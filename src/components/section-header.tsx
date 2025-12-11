type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export const SectionHeader = ({ eyebrow, title, description, action }: Props) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-6 mb-2">
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
      {description ? (
        <p className="max-w-3xl text-base text-slate-600 leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);
