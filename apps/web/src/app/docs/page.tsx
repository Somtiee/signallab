
import React from 'react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-yellow-500/30">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="inline-block mb-12 text-sm text-neutral-500 hover:text-white transition-colors">
          ← Back to SignalLab
        </Link>
        
        <header className="mb-16">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Documentation</h1>
          <p className="text-xl text-neutral-400">
            How to navigate the SignalLab ecosystem.
          </p>
        </header>

        <section className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-yellow-400">The "Noob Guide"</h2>
            <p className="leading-relaxed text-white/75 text-base">
              You asked for the &quot;Noob Guide&quot;, here it is. SignalLab is a place where <span className="text-yellow-300 font-semibold">Science meets Crypto</span>.
              We use the Solana blockchain to make scientific data immutable, verifiable, and valuable.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">For Project Owners</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-300 marker:text-yellow-500">
              <li>
                <strong>Create Projects:</strong> Define your research goal. Is it a survey? A dataset collection? A clinical trial?
              </li>
              <li>
                <strong>Create Polls:</strong> Ask the scouts what they want. &quot;Is this data useful?&quot; &quot;What should we do next?&quot;
              </li>
              <li>
                <strong>Upload Datasets:</strong> Publish your findings. We hash them on-chain so you have proof of discovery (PoD).
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">For Scouts (Users)</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-300 marker:text-yellow-500">
              <li>
                <strong>Vote:</strong> Signal your interest. Use your SOL to vote on polls.
              </li>
              <li>
                <strong>Earn:</strong> (Coming Soon) Get rewarded for contributing valid data.
              </li>
              <li>
                <strong>Verify:</strong> Check the provenance of any dataset. Don&apos;t trust, verify.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
