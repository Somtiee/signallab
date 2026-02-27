
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRegistryProgram, shortenAddress, formatDate } from "@/lib/registry";
import { ResearchRegistryClient, deriveVoteReceiptPda, FEES } from "@signallab/sdk";
import { PublicKey, Transaction } from "@solana/web3.js";
import { LoadingPage } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/context/ToastContext";
import { postToSocial } from "@/lib/social";
import { useSubscription } from "@/hooks/useSubscription";

// Simple SHA-256 helper
async function sha256(message: string): Promise<Uint8Array> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return new Uint8Array(hashBuffer);
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectPda = params.projectPda as string;
  
  const program = useRegistryProgram();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();
  const { isPro } = useSubscription();
  
  const [project, setProject] = useState<any>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthority, setIsAuthority] = useState(false);
  const [userVoteReceipts, setUserVoteReceipts] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showAddDataset, setShowAddDataset] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const client = useMemo(() => new ResearchRegistryClient(program), [program]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!projectPda) return;
    setLoading(true);
    setError(null);
    try {
      const pda = new PublicKey(projectPda);
      // @ts-expect-error: Anchor types inference issue
      const proj = await program.account.project.fetch(pda);
      setProject(proj);
      
      // @ts-expect-error: Anchor types inference issue
      if (wallet && proj.authority.equals(wallet.publicKey)) {
        setIsAuthority(true);
      }

      // Fetch Datasets (offset 8 for discriminator)
      // @ts-expect-error: Anchor types inference issue
      const dSets = await program.account.dataset.all([
        { memcmp: { offset: 8, bytes: pda.toBase58() } }
      ]);
      // @ts-expect-error: Anchor types inference issue
      setDatasets(dSets.sort((a, b) => b.account.version - a.account.version));

      // Fetch Polls
      // @ts-expect-error: Anchor types inference issue
      const pList = await program.account.poll.all([
        { memcmp: { offset: 8, bytes: pda.toBase58() } }
      ]);
      setPolls(pList);

      // Check votes
      if (wallet) {
        const receipts = new Set<string>();
        for (const poll of pList) {
          try {
            const [receiptPda] = deriveVoteReceiptPda(poll.publicKey, wallet.publicKey, program.programId);
            const info = await connection.getAccountInfo(receiptPda);
            if (info) receipts.add(poll.publicKey.toBase58());
          } catch (e) {}
        }
        setUserVoteReceipts(receipts);
      }

    } catch (e: any) {
      console.error("Error loading project:", e);
      setError(e.message || "Failed to load project data.");
    } finally {
      setLoading(false);
    }
  }, [program, projectPda, wallet, connection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleAddDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !project) return;
    setSubmitting(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const version = parseInt(formData.get("version") as string);
    const dataUri = formData.get("dataUri") as string;
    const content = formData.get("content") as string;

    try {
      showToast("Preparing transaction...", "info");
      const hash = await sha256(content);
      const ix = await client.addDataset(wallet.publicKey, new PublicKey(projectPda), version, hash, dataUri);
      
      const tx = new Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;
      
      const sig = await sendTransaction(tx, connection);
      showToast("Transaction sent! Waiting for confirmation...", "info", sig);
      
      await connection.confirmTransaction(sig, "confirmed");
      
      showToast("Dataset added successfully!", "success", sig);
      
      postToSocial({
        action: 'add_dataset',
        projectPda: projectPda,
        walletAddress: wallet.publicKey.toBase58(),
        projectSlug: project.slug,
        hash: Buffer.from(hash).toString('hex'),
        signature: sig
      }).then(success => {
        if (!success) showToast("Social post failed", "error");
      });

      setShowAddDataset(false);
      fetchData();
    } catch (e: any) {
      console.error(e);
      showToast("Failed to add dataset: " + e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !project) return;
    setSubmitting(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const question = formData.get("question") as string;
    const optionsInput = formData.get("options") as string;
    const endDateStr = formData.get("endDate") as string;
    const endTs = Math.floor(new Date(endDateStr).getTime() / 1000);

    // Client-side validation for end timestamp (must be at least 1 minute in the future)
    if (endTs <= Math.floor(Date.now() / 1000) + 60) {
      showToast("End time must be at least 1 minute in the future.", "error");
      setSubmitting(false);
      return;
    }

    try {
      showToast("Preparing transaction...", "info");
      // Append timestamp to ensure uniqueness of the poll PDA even if options are the same
      const uniqueOptions = optionsInput + "-" + Date.now();
      const hash = await sha256(uniqueOptions); 
      const ix = await client.createPoll(
        wallet.publicKey, 
        new PublicKey(projectPda), 
        question, 
        hash, 
        endTs, 
        0 // Mode 0: Simple Yes/No
      );
      
      const tx = new Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;
      
      const sig = await sendTransaction(tx, connection);
      showToast("Transaction sent! Waiting for confirmation...", "info", sig);
      
      await connection.confirmTransaction(sig, "confirmed");
      
      showToast("Poll created successfully!", "success", sig);
      
      postToSocial({
        action: 'create_poll',
        projectPda: projectPda,
        walletAddress: wallet.publicKey.toBase58(),
        projectSlug: project.slug,
        endTs: endTs,
        signature: sig
      }).then(success => {
        if (!success) showToast("Social post failed", "error");
      });

      setShowCreatePoll(false);
      fetchData();
    } catch (e: any) {
      console.error(e);
      showToast("Failed to create poll: " + e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (pollPda: PublicKey, choice: number) => {
    if (!wallet) return;
    if (userVoteReceipts.has(pollPda.toBase58())) return;
    
    try {
      showToast("Preparing vote...", "info");
      const ix = await client.castVote(wallet.publicKey, pollPda, choice);
      
      const tx = new Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;
      
      const sig = await sendTransaction(tx, connection);
      showToast("Vote submitted! Waiting for confirmation...", "info", sig);
      
      await connection.confirmTransaction(sig, "confirmed");
      
      showToast("Vote cast successfully!", "success", sig);

      postToSocial({
        action: 'cast_vote',
        projectPda: projectPda,
        walletAddress: wallet.publicKey.toBase58(),
        projectSlug: project.slug,
        signature: sig
      }).then(success => {
        if (!success) showToast("Social post failed", "error");
      });
      
      fetchData();
    } catch (e: any) {
      console.error(e);
      showToast("Vote failed: " + e.message, "error");
    }
  };

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><LoadingPage /></div>;
  if (error) return <div className="max-w-6xl mx-auto px-4 py-8"><ErrorState message={error} retry={fetchData} /></div>;
  if (!project) return <div className="max-w-6xl mx-auto px-4 py-8"><ErrorState message="Project not found." /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">{project.slug}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                {shortenAddress(project.authority)}
              </span>
              <span>Created: {formatDate(project.createdAt.toNumber())}</span>
              <a href={project.metadataUri} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1">
                View Metadata ↗
              </a>
            </div>
          </div>
          {isAuthority && (
            <div className="flex gap-2 w-full md:w-auto">
              {isPro ? (
                <Link 
                  href={`/projects/${projectPda}/migrate`}
                  className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 px-4 py-2 rounded-lg text-sm font-medium transition flex-1 md:flex-none justify-center flex items-center gap-2 shadow-lg shadow-purple-900/20"
                >
                  <span>⚡</span> Migration Tool
                </Link>
              ) : (
                <button 
                  onClick={() => showToast("Upgrade to Pro to access Migration Tool", "error")}
                  className="bg-gray-700 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium transition flex-1 md:flex-none justify-center flex items-center gap-2 cursor-not-allowed opacity-50"
                  disabled
                >
                  <span>🔒</span> Migration Tool (Pro)
                </button>
              )}
              <button 
                onClick={() => setShowAddDataset(true)}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition border border-white/10 flex-1 md:flex-none justify-center flex"
              >
                + Add Dataset
              </button>
              <button 
                onClick={() => setShowCreatePoll(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition flex-1 md:flex-none justify-center flex text-white"
              >
                + Create Poll
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Datasets */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-white">
            Datasets 
            <span className="text-sm bg-white/10 px-2 py-0.5 rounded-full text-gray-400 border border-white/5">{datasets.length}</span>
          </h2>
          <div className="space-y-4">
            {datasets.map((d) => (
              <div key={d.publicKey.toBase58()} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:border-white/20 transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded text-xs">v{d.account.version}</span>
                  <span className="text-xs text-gray-500">{formatDate(d.account.createdAt.toNumber())}</span>
                </div>
                
                {/* Provenance Display */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">Hash:</span>
                    <span className="text-xs font-mono text-yellow-300 truncate max-w-[200px]">
                      {d.account.contentHash ? Buffer.from(d.account.contentHash).toString('hex') : 'No hash'}
                    </span>
                  </div>
                  {d.account.dataUri.startsWith("data:") && (
                     <span className="text-xs bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                       BIO / Provenance
                     </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={d.account.dataUri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block text-sm text-gray-300 truncate hover:text-white flex-1"
                  >
                    {d.account.dataUri.length > 50 ? d.account.dataUri.substring(0, 50) + "..." : d.account.dataUri}
                  </a>
                  <a href={d.account.dataUri} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white">
                    ↗
                  </a>
                </div>
              </div>
            ))}
            {datasets.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-lg bg-white/5">
                <p className="text-gray-500 italic">No datasets published yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Polls */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-white">
            Governance Polls
            <span className="text-sm bg-white/10 px-2 py-0.5 rounded-full text-gray-400 border border-white/5">{polls.length}</span>
          </h2>
          <div className="space-y-4">
            {polls.map((p) => {
              const ended = Date.now() / 1000 > p.account.endTs.toNumber();
              const voted = userVoteReceipts.has(p.publicKey.toBase58());
              const total = p.account.yesVotes.toNumber() + p.account.noVotes.toNumber();
              const yesPercent = total > 0 ? (p.account.yesVotes.toNumber() / total) * 100 : 0;
              const noPercent = total > 0 ? 100 - yesPercent : 0;

              return (
                <div key={p.publicKey.toBase58()} className="p-5 rounded-lg border border-white/10 bg-white/5">
                  <h3 className="font-medium mb-3 text-white">{p.account.questionUri}</h3> {/* Assuming URI is text for now, or fetching it */}
                  
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Yes ({p.account.yesVotes.toString()})</span>
                      <span>No ({p.account.noVotes.toString()})</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                      <div style={{ width: `${yesPercent}%` }} className="bg-green-500 h-full transition-all duration-500" />
                      <div style={{ width: `${noPercent}%` }} className="bg-red-500 h-full transition-all duration-500" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      {ended ? (
                        <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Ended</span>
                      ) : (
                        <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded animate-pulse">Active</span>
                      )}
                      <span>Ends {new Date(p.account.endTs.toNumber() * 1000).toLocaleString()}</span>
                    </div>
                    
                    {!ended && !voted && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleVote(p.publicKey, 1)}
                          className="px-3 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 text-sm transition-colors border border-green-500/30"
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => handleVote(p.publicKey, 0)}
                          className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 text-sm transition-colors border border-red-500/30"
                        >
                          No
                        </button>
                      </div>
                    )}
                    {voted && (
                      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                        Voted ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {polls.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-lg bg-white/5">
                <p className="text-gray-500 italic">No active polls.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add Dataset Modal */}
      {showAddDataset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Add Dataset</h3>
            <div className="mb-4 text-xs text-gray-400 flex justify-between">
                <span>Fee:</span>
                <span className={isPro ? "text-green-400 font-bold" : "text-yellow-400"}>
                  {isPro ? "Included in Pro" : `${FEES.DATASET} SOL`}
                </span>
            </div>
            <form onSubmit={handleAddDataset} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Version (number)</label>
                <input name="version" type="number" required className="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none" placeholder="1" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data URI (IPFS/Arweave)</label>
                <input name="dataUri" required className="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Content (for hash)</label>
                <textarea name="content" required className="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none" rows={3} placeholder="Raw content to hash..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddDataset(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 transition">
                  {submitting ? "Adding..." : "Add Dataset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreatePoll && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Create Poll</h3>
            <div className="mb-4 text-xs text-gray-400 flex justify-between">
                <span>Fee:</span>
                <span className={isPro ? "text-green-400 font-bold" : "text-yellow-400"}>
                  {isPro ? "Included in Pro" : `${FEES.POLL} SOL`}
                </span>
            </div>
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Question</label>
                <textarea name="question" required className="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none [color-scheme:dark]" rows={3} placeholder="Should we...?" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Options (for hash)</label>
                <input name="options" required className="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none [color-scheme:dark]" placeholder="Yes, No" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date & Time (Local)</label>
                <input 
                  name="endDate" 
                  type="datetime-local" 
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none [color-scheme:dark]" 
                  defaultValue={new Date(Date.now() + 3 * 86400 * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreatePoll(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 transition">
                  {submitting ? "Creating..." : "Create Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
