const Home = () => {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)] lg:items-center">
        <div className="space-y-8">
          <p className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-yellow-300/90 backdrop-blur">
            Solana research registry
          </p>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
              Coordinate
              <span className="mx-2 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                signal
              </span>
              for serious research.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
              SignalLab helps Solana teams track experiments, share results, and route capital
              toward the highest-signal work, all on-chain.
            </p>
          </div>

        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-purple-500/25 via-fuchsia-400/20 to-yellow-300/15 blur-3xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between text-xs text-white/70">
              <span className="font-medium">Live signal snapshot</span>
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[0.7rem] font-medium text-emerald-300">
                Prototype
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/40">Active tracks</dt>
                <dd className="text-2xl font-semibold text-white">32</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/40">Researchers</dt>
                <dd className="text-2xl font-semibold text-white">118</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Funded experiments
                </dt>
                <dd className="text-2xl font-semibold text-white">57</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/40">Network</dt>
                <dd className="text-sm font-medium text-emerald-300">Solana devnet</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-300/90">
            Why SignalLab
          </h2>
          <p className="max-w-2xl text-sm text-white/75 md:text-base">
            Built for teams who treat research as a product: clear signals, reproducible
            experiments, and funding aligned with real impact.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.9)] backdrop-blur transition hover:border-yellow-300/50 hover:bg-white/10">
            <h3 className="mb-2 text-sm font-semibold text-white">Signal-native registry</h3>
            <p className="text-xs leading-relaxed text-white/75">
              Capture hypotheses, designs, and results in a single, queryable on-chain registry so
              nothing gets lost in chats or docs.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.9)] backdrop-blur transition hover:border-yellow-300/50 hover:bg-white/10">
            <h3 className="mb-2 text-sm font-semibold text-white">Funding aligned to outcomes</h3>
            <p className="text-xs leading-relaxed text-white/75">
              Route grants, bounties, and retroactive rewards to the research that actually moves
              core metrics for your protocol.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.9)] backdrop-blur transition hover:border-yellow-300/50 hover:bg-white/10">
            <h3 className="mb-2 text-sm font-semibold text-white">Built for Solana teams</h3>
            <p className="text-xs leading-relaxed text-white/75">
              Optimized for Solana&apos;s tooling and velocity: fast transactions, on-chain
              attestations, and primitives teams already use.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-center items-center gap-3 pt-12 pb-4">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
        </div>
        <span className="text-xs font-bold tracking-[0.2em] text-yellow-400 uppercase shadow-yellow-500/20 drop-shadow-sm">
          LIVE NOW ON SOLANA DEVNET
        </span>
      </div>
    </div>
  );
};

export default Home;
