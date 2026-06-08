type Props = {
  href: string;
  label: string;
  ariaLabel?: string;
};

export const FloatingActionButton = ({ href, label, ariaLabel }: Props) => (
  <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 sm:hidden">
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel || label}
      className="flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-blue-600 py-3 pl-4 pr-5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-95"
    >
      <span>🚀</span>
      {label}
    </a>
  </div>
);
