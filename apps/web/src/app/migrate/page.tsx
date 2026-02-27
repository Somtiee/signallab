import { PageHeader } from '@/components/ui/PageHeader';

const MigratePage = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Migrate to SignalLab"
        subtitle="Bring your existing research docs, Notion wikis, and trackers into a signal-native format."
      />

      <section className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)]">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-purple-500/30 via-fuchsia-400/20 to-yellow-300/15 blur-3xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/80 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300/90">
              Coming online
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Migration tools will help you map existing research artifacts into structured,
              queryable tracks, with helpers for bulk imports and programmatic pipelines.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MigratePage;
