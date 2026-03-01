"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRegistryProgram, shortenAddress, formatDate } from "@/lib/registry";
import Link from "next/link";
import { LoadingPage } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ResearchRegistryClient, deriveProjectPda, FEES } from "@signallab/sdk";
import { Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useToast } from "@/context/ToastContext";
import { postToSocial } from "@/lib/social";
import { useSubscription } from "@/hooks/useSubscription";

export default function FeedPage() {
  const program = useRegistryProgram();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { showToast } = useToast();
  const { isPro, subscriptionPda } = useSubscription();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Project State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [slug, setSlug] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Balance State for Debugging
  const [balance, setBalance] = useState<number | null>(null);
  const [requestingAirdrop, setRequestingAirdrop] = useState(false);

  const client = useMemo(() => new ResearchRegistryClient(program), [program]);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error("Failed to fetch balance:", e);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleRequestAirdrop = async () => {
    if (!publicKey) return;
    setRequestingAirdrop(true);
    try {
      const signature = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, "confirmed");
      showToast("Airdrop successful! (2 SOL)", "success");
      fetchBalance();
    } catch (err: any) {
      console.error("Airdrop failed:", err);
      showToast("Airdrop failed: " + err.message, "error");
    } finally {
      setRequestingAirdrop(false);
    }
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error: Anchor types inference issue
      const accounts = await program.account.project.all();
      // Sort by creation time descending (newest first)
      const sorted = accounts.sort((a: any, b: any) => 
        b.account.createdAt.toNumber() - a.account.createdAt.toNumber()
      );
      setProjects(sorted);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to load projects from Solana.");
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setCreateError(null);
    setIsCreating(true);

    try {
      const finalMetadataUri = metadataUri.trim() || "https://example.com/project.json";
      
      const instruction = await client.createProject(
        publicKey,
        slug.trim(),
        finalMetadataUri,
        isPro ? subscriptionPda : null
      );

      const tx = new Transaction().add(instruction);
      const signature = await sendTransaction(tx, connection);
      
      showToast("Transaction sent...", "info", signature);

      await connection.confirmTransaction(signature, "confirmed");
      showToast("Project created successfully!", "success", signature);

      // Post to Social Feed
      const [projectPda] = deriveProjectPda(publicKey, slug.trim());
      postToSocial({
        action: 'create_project',
        projectPda: projectPda.toBase58(),
        walletAddress: publicKey.toBase58(),
        projectSlug: slug.trim(),
        signature
      }).then(success => {
        if (!success) showToast("Social post failed", "error");
      });

      setIsModalOpen(false);
      setSlug("");
      setMetadataUri("");
      // Refresh list
      fetchProjects();
      fetchBalance();
    } catch (err: any) {
      console.error("Create project error:", err);
      if (err.logs) {
        console.error("Transaction logs:", err.logs);
      }
      
      let msg = err.message || "Failed to create project";
      if (msg.includes("0x1")) {
         msg = "Insufficient funds. Please request an airdrop.";
      }
      setCreateError(msg);
      showToast("Failed to create project", "error");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingPage />
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ErrorState message={error} retry={fetchProjects} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white hover:text-purple-400 hover:drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300 cursor-default">Project Radar</h1>
          <p className="text-gray-400 mt-1">Discover decentralized research projects.</p>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!connected}
            className={`px-6 py-3 sm:py-2 rounded-lg font-medium transition-all w-full sm:w-auto ${
              connected
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {connected ? "Create Project" : "Connect wallet to create"}
          </button>
        </div>
      </header>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b021f] border border-purple-500/20 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
            
            <div className="bg-white/5 p-3 rounded-lg mb-4 text-xs border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-gray-400">
                <span>Wallet:</span>
                <span className="font-mono text-purple-300">{publicKey ? shortenAddress(publicKey) : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Fee:</span>
                <span className={isPro ? "text-green-400 font-bold" : "text-yellow-400"}>
                  {isPro ? "Included in Pro" : `${FEES.PROJECT} SOL`}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Balance:</span>
                <span className={balance !== null && balance < 0.05 ? "text-red-400 font-bold" : "text-green-400"}>
                  {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}
                </span>
              </div>
              
              {balance !== null && balance < 1.0 && (
                 <div className="pt-1 border-t border-white/10">
                   <button
                    type="button"
                    onClick={handleRequestAirdrop}
                    disabled={requestingAirdrop}
                    className="w-full py-1.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs rounded transition-colors text-center border border-blue-500/20"
                  >
                    {requestingAirdrop ? "Requesting Airdrop..." : "Request 2 SOL Airdrop (Localnet)"}
                  </button>
                 </div>
              )}
            </div>

            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Project Slug <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  maxLength={32}
                  placeholder="my-research-dao"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max 32 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Metadata URI
                </label>
                <input
                  type="url"
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  maxLength={200}
                  placeholder="https://example.com/project.json"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Defaults to example.com if empty</p>
              </div>

              {createError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !slug.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link 
            key={p.publicKey.toBase58()} 
            href={`/projects/${p.publicKey.toBase58()}`}
            className="group block p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                {p.account.slug}
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 border border-white/5">
                {p.account.datasetCount.toString()} Datasets
              </span>
            </div>
            
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {p.account.slug.substring(0, 2).toUpperCase()}
                </div>
                <span>By {shortenAddress(p.account.authority)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span>Created {formatDate(p.account.createdAt.toNumber())}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5">
          <p className="text-gray-400 text-lg">No projects found on chain yet.</p>
          <p className="text-sm text-gray-500 mt-2">Be the first to create one!</p>
        </div>
      )}
    </div>
  );
}
