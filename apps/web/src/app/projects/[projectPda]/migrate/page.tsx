
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { useRegistryProgram } from "@/lib/registry";
import { ResearchRegistryClient } from "@signallab/sdk";
import { PublicKey, Transaction } from "@solana/web3.js";
import { canonicalStringify, sha256, hashToBytes } from "@/lib/crypto";
import { useToast } from "@/context/ToastContext";
import { postToSocial } from "@/lib/social";
import { DatasetProvenance, BioEnrichment } from "@/lib/provenance";
import { DataUriStorageProvider } from "@/lib/storage";

export default function MigratePage() {
  console.log("Rendering Migrate Page"); // Debug log to verify route loading
  const params = useParams();
  const router = useRouter();
  const projectPda = params.projectPda as string;
  
  const program = useRegistryProgram();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();
  
  const client = useMemo(() => new ResearchRegistryClient(program), [program]);
  const storage = useMemo(() => new DataUriStorageProvider(), []);
  
  // State
  const [jsonInput, setJsonInput] = useState("");
  const [canonicalJson, setCanonicalJson] = useState("");
  const [innerHash, setInnerHash] = useState("");
  const [version, setVersion] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  
  // New State for Upgrade
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [credits, setCredits] = useState(10); // Mock credits
  const [enableBio, setEnableBio] = useState(false);
  const [enrichmentPreview, setEnrichmentPreview] = useState<BioEnrichment | null>(null);
  const [enriching, setEnriching] = useState(false);

  const [auditTrail, setAuditTrail] = useState<{
    txSignature: string;
    timestamp: number;
    signer: string;
    finalHash: string;
  } | null>(null);

  // Load credits from local storage
  useEffect(() => {
    const saved = localStorage.getItem("bio_credits");
    if (saved) setCredits(parseInt(saved));

    // Fetch project data to get next version
    const fetchProject = async () => {
      try {
        // @ts-expect-error: Anchor types inference issue
        const p = await program.account.project.fetch(new PublicKey(projectPda));
        setProject(p);
        // Auto-increment version
        setVersion((p.datasetCount + 1).toString());
      } catch (e) {
        console.error("Failed to fetch project:", e);
      }
    };
    if (program && projectPda) fetchProject();
  }, [program, projectPda]);

  // Handle JSON Input with validation
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const size = new Blob([value]).size;
    
    if (size > 200 * 1024) {
      showToast("JSON input is too large (max 200KB). Please use a smaller dataset or file reference.", "error");
      return;
    }
    
    if (size > 50 * 1024) {
       // Only show warning once per session/reset? 
       // For now, just rely on user seeing the size indicator below
    }
    
    setJsonInput(value);
  };

  // Compute canonical JSON and inner hash when input changes
  useEffect(() => {
    try {
      if (!jsonInput.trim()) {
        setCanonicalJson("");
        setInnerHash("");
        return;
      }
      const parsed = JSON.parse(jsonInput);
      const canonical = canonicalStringify(parsed);
      setCanonicalJson(canonical);
      
      sha256(canonical).then(setInnerHash);
    } catch (e) {
      setCanonicalJson("Invalid JSON");
      setInnerHash("");
    }
  }, [jsonInput]);

  // Handle BIO Enrichment
  const runBioEnrichment = async () => {
    if (!jsonInput || !enableBio) return;
    if (plan === 'free') {
      showToast("Upgrade to Pro to use BIO Enrichment", "error");
      return;
    }
    
    try {
      setEnriching(true);
      const res = await fetch("/api/bio/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: jsonInput }),
      });
      const data = await res.json();
      
      if (data.enriched) {
        setEnrichmentPreview(data.data);
        showToast("Enrichment complete!", "success");
      } else {
        showToast(data.message || "Enrichment failed", "info");
      }
    } catch (e) {
      console.error(e);
      showToast("Enrichment error", "error");
    } finally {
      setEnriching(false);
    }
  };

  const handleMigrate = async () => {
    if (!wallet || !innerHash || !canonicalJson) return;
    
    try {
      setSubmitting(true);
      showToast("Starting migration...", "info");

      // 1. Prepare Storage of INNER content
      // For MVP, we store the inner content as a Data URI inside the provenance wrapper?
      // Or we store the inner content URI.
      // Let's store the inner content as a Data URI for now.
      const innerContentUri = await storage.upload(canonicalJson, "application/json");

      // 2. Construct Provenance Wrapper
      const provenance: DatasetProvenance = {
        source: enableBio ? 'bio' : 'manual',
        ingested_at: new Date().toISOString(),
        canonical_sha256: innerHash,
        content_uri: innerContentUri,
        bio_enrichment: enrichmentPreview || undefined,
      };

      // 3. Canonicalize & Hash the Provenance Wrapper
      const finalCanonical = canonicalStringify(provenance);
      const finalHash = await sha256(finalCanonical);
      const finalUri = await storage.upload(finalCanonical, "application/json");

      // 4. Attest on-chain
      const ver = parseInt(version);
      if (isNaN(ver)) throw new Error("Invalid version number");

      const ix = await client.addDataset(
        wallet.publicKey,
        new PublicKey(projectPda),
        ver,
        hashToBytes(finalHash),
        finalUri
      );

      const tx = new Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;

      const sig = await sendTransaction(tx, connection);
      showToast("Attesting on-chain...", "info", sig);
      
      await connection.confirmTransaction(sig, "confirmed");
      
      // Deduct credits if used
      if (enableBio) {
        const newCredits = credits - 1;
        setCredits(newCredits);
        localStorage.setItem("bio_credits", newCredits.toString());
      }

      showToast("Migration complete!", "success", sig);

      await postToSocial({
        action: 'migrate_dataset',
        projectPda: projectPda,
        walletAddress: wallet.publicKey.toBase58(),
        hash: finalHash,
        signature: sig
      });
      
      setAuditTrail({
        txSignature: sig,
        timestamp: Date.now(),
        signer: wallet.publicKey.toBase58(),
        finalHash
      });

    } catch (e: any) {
      console.error(e);
      showToast("Migration failed: " + e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Dataset Migration Tool</h1>
            <p className="text-gray-400">Sunrise/BIO Provenance Pipeline</p>
          </div>
        </div>
        
        {/* Credits / Plan */}
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-gray-400 text-sm">Credits:</span>
            <span className="text-yellow-400 font-mono font-bold">{credits}</span>
          </div>
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setPlan('free')}
              className={`px-3 py-1 rounded text-sm transition ${plan === 'free' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Free
            </button>
            <button
              onClick={() => setPlan('pro')}
              className={`px-3 py-1 rounded text-sm transition ${plan === 'pro' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Pro
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Input & Configuration */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Input Data</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Dataset Version</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                type="number"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Paste JSON Metadata</label>
              <textarea
                value={jsonInput}
                onChange={handleJsonChange}
                className="w-full h-64 bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs text-green-300 focus:border-blue-500 outline-none resize-none"
                placeholder='{"title": "My Research", "results": [1, 2, 3]...}'
              />
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Inner Hash: <span className="font-mono text-gray-300">{innerHash ? innerHash.substring(0, 16) + "..." : "-"}</span></span>
              <span className={new Blob([jsonInput]).size > 50 * 1024 ? "text-yellow-500" : ""}>
                {new Blob([jsonInput]).size} bytes {new Blob([jsonInput]).size > 50 * 1024 ? "(Large)" : ""}
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold text-white flex justify-between items-center">
              2. BIO Enrichment
              {plan === 'free' && <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 font-normal">Pro Only</span>}
            </h2>
            
            <div className="flex items-center justify-between bg-black/30 p-3 rounded border border-white/5">
              <span className="text-sm text-gray-300">Run Biological Knowledge Graph Enrichment</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={enableBio}
                  onChange={(e) => {
                    if (plan === 'free') return;
                    setEnableBio(e.target.checked);
                  }}
                  disabled={plan === 'free'}
                />
                <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${plan === 'free' ? 'opacity-50' : 'peer-checked:bg-purple-600'}`}></div>
              </label>
            </div>

            {enableBio && (
              <div className="space-y-3">
                <button
                  onClick={runBioEnrichment}
                  disabled={enriching || !jsonInput}
                  className="w-full py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded hover:bg-purple-600/30 transition text-sm flex justify-center items-center gap-2"
                >
                  {enriching ? "Analyzing..." : "Analyze & Enrich"}
                </button>

                {enrichmentPreview && (
                  <div className="bg-black/30 p-3 rounded border border-purple-500/20 space-y-2 text-xs">
                    <p className="font-semibold text-purple-300">BIO Summary:</p>
                    <p className="text-gray-400 italic">{enrichmentPreview.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {enrichmentPreview.keywords.map(k => (
                        <span key={k} className="px-2 py-0.5 bg-purple-900/40 text-purple-200 rounded-full border border-purple-500/20">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Provenance & Audit */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold text-white">3. Provenance Wrapper</h2>
            
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Provenance Preview</label>
              <div className="bg-black/30 p-3 rounded border border-white/5 h-64 overflow-y-auto font-mono text-xs text-gray-400 whitespace-pre-wrap break-all">
                {JSON.stringify({
                  source: enableBio ? 'bio' : 'manual',
                  ingested_at: new Date().toISOString(),
                  canonical_sha256: innerHash || "...",
                  content_uri: "data:application/json;base64,...",
                  bio_enrichment: enrichmentPreview
                }, null, 2)}
              </div>
              <p className="text-xs text-gray-500">
                This wrapper (including enrichment) will be hashed and signed.
              </p>
            </div>

            <button
              onClick={handleMigrate}
              disabled={submitting || !innerHash || !wallet}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
            >
              {submitting ? "Attesting..." : "Sign & Migrate"}
            </button>
          </div>

          {auditTrail && (
            <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h2 className="text-xl font-semibold text-green-400">Provenance Attested</h2>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Final Wrapper Hash</span>
                  <span className="font-mono text-green-300 break-all">{auditTrail.finalHash}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Transaction Signature</span>
                  <a 
                    href={`https://explorer.solana.com/tx/${auditTrail.txSignature}?cluster=custom&customUrl=http://localhost:8899`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline break-all font-mono"
                  >
                    {auditTrail.txSignature} ↗
                  </a>
                </div>
                
                <div className="pt-2 border-t border-green-500/20">
                  <p className="text-xs text-green-300/80 italic">
                    Dataset migrated with full BIO provenance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
