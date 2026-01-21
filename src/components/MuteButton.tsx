interface MuteButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function MuteButton({ isMuted, onToggle }: MuteButtonProps) {
  return (
    <div className="fixed top-4 left-4 z-40 flex flex-col items-center gap-1">
      <button
        onClick={onToggle}
        className="w-12 h-12 bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600 rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={isMuted ? "Unmute music" : "Mute music"}
        title={isMuted ? "Unmute music" : "Mute music"}
      >
        <span className="text-2xl">
          {isMuted ? "🔇" : "🔊"}
        </span>
      </button>
      <span className="text-xs text-slate-300 text-shadow">Toggle Music</span>
    </div>
  );
}
