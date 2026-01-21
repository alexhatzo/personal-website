interface SkipButtonProps {
  onClick: () => void;
}

export default function SkipButton({ onClick }: SkipButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-40 hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-sm rounded-lg border border-slate-700 hover:border-slate-500 transition-all backdrop-blur-sm group"
      title="View as traditional portfolio"
    >
      <span className="text-base">📋</span>
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
        Skip to portfolio
      </span>
    </button>
  );
}
