type Props = {
  href: string;
  label: string;
  ariaLabel?: string;
};

export const FloatingActionButton = ({ href, label, ariaLabel }: Props) => (
  <div className="fixed bottom-6 right-6 z-50 sm:hidden">
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel || label}
      className="flex items-center gap-2 rounded-full bg-blue-600 pl-4 pr-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-700 active:scale-95"
    >
      <span>🚀</span>
      {label}
    </a>
  </div>
);
