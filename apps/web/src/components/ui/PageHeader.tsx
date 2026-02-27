type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      {subtitle ? <p className="max-w-2xl text-sm text-white/70 md:text-base">{subtitle}</p> : null}
    </header>
  );
};
