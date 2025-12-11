type Props = {
  label?: string;
};

export const AdPlaceholder = ({ label = "Advertisement" }: Props) => (
  <div
    className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center transition-colors hover:bg-slate-100"
    style={{ minHeight: 140 }}
    aria-hidden="true"
  >
    <span className="text-2xl mb-2">📢</span>
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
      {label}
    </span>
  </div>
);
