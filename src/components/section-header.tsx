type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export const SectionHeader = ({ eyebrow, title, description, action }: Props) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b-2 border-slate-300 pb-6 mb-6">
    <div className="space-y-3">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h2>
      {description ? (
        <p className="max-w-3xl text-base text-slate-600 leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);
