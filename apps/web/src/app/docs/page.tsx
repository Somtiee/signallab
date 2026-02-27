import { PageHeader } from '@/components/ui/PageHeader';

const DocsPage = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        title="SignalLab Docs"
        subtitle="Understand the primitives behind the research registry, funding mechanisms, and integrations."
      />

      <section className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)]">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-purple-500/30 via-fuchsia-400/20 to-yellow-300/15 blur-3xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/80 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.9)] backdrop-blur space-y-8">
            
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">SignalLab in a Nutshell 🥜</h2>
              <p className="leading-relaxed text-white/75 text-base">
                You asked for the &quot;Noob Guide&quot;, here it is. SignalLab is a place where <span className="text-yellow-300 font-semibold">Science meets Crypto</span>.
              </p>
            </div>

            {/* The Breakdown */}
            <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-white/10">
              
              {/* For Users */}
              <div>
                <h3 className="text-xl font-bold text-green-400 mb-3 flex items-center gap-2">
                  <span className="bg-green-500/20 p-1.5 rounded-lg text-lg">👀</span>
                  For Users (The "Scouts")
                </h3>
                <div className="space-y-4 text-white/70">
                  <p>You are looking for the next big thing in decentralized science.</p>
                  <ul className="space-y-3 list-disc pl-4 marker:text-green-400">
                    <li>
                      <strong>Go to Radar:</strong> This is your discovery tool. Browse the list of projects. Click on one to see their data.
                    </li>
                    <li>
                      <strong>Vote:</strong> If a project asks "Should we research X?", you vote. Your vote is recorded on-chain.
                    </li>
                    <li>
                      <strong>Watch Signals:</strong> This is the live ticker. See who else is voting, what new projects just launched, and what's trending.
                    </li>
                  </ul>
                </div>
              </div>

              {/* For Teams */}
              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-3 flex items-center gap-2">
                  <span className="bg-purple-500/20 p-1.5 rounded-lg text-lg">🛠️</span> 
                  For Teams (The "Builders")
                </h3>
                <div className="space-y-4 text-white/70">
                  <p>You need to prove your research is real and get community funding/support.</p>
                  <ul className="space-y-3 list-disc pl-4 marker:text-purple-400">
                    <li>
                      <strong>Go to Radar:</strong> Click "Create Project". This registers your lab on the blockchain.
                    </li>
                    <li>
                      <strong>Upload Data:</strong> On your project page, you upload datasets. We stamp them with a "fingerprint" so everyone knows they are authentic.
                    </li>
                    <li>
                      <strong>Create Polls:</strong> Ask the scouts what they want. "Is this data useful?" "What should we do next?"
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* The Loop */}
            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-lg font-medium text-white">
                Teams <span className="text-purple-400">PROVE</span> work 
                <span className="mx-2">→</span> 
                Users <span className="text-green-400">SIGNAL</span> support
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default DocsPage;
