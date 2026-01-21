import { useState, useEffect } from "react";

interface LandscapePromptProps {
  onSkip: () => void;
}

export default function LandscapePrompt({ onSkip }: LandscapePromptProps) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if mobile: touch device AND smaller screen (not tablet in landscape)
      const mobile = window.innerWidth < 1024 && 'ontouchstart' in window;
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobile(mobile);
      setIsPortrait(portrait);
    };

    checkOrientation();
    
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Only show on mobile devices in portrait orientation
  if (!isMobile || !isPortrait) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-8">
      {/* Animated rotation hint */}
      <div className="relative mb-8">
        {/* Phone outline - portrait */}
        <div className="relative animate-pulse">
          <div className="w-16 h-28 border-4 border-slate-500 rounded-2xl flex items-center justify-center bg-slate-800">
            <div className="w-10 h-16 bg-slate-700 rounded-lg" />
          </div>
          {/* Rotation arrow */}
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-blue-400 text-3xl animate-bounce">
            ↻
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-white text-center mb-3 pixel-text">
        Rotate Your Device
      </h2>
      <p className="text-slate-400 text-center max-w-xs mb-4 leading-relaxed">
        This interactive portfolio experience works best in landscape mode
      </p>
      
      {/* Desktop recommendation */}
      <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-8 px-4 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
        <span>💻</span>
        <span>Best experienced on a computer or larger screen</span>
      </div>
      
      {/* Visual comparison */}
      <div className="flex items-center gap-6 mb-10">
        {/* Portrait - X */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-16 border-2 border-slate-600 rounded-lg opacity-50" />
          <span className="text-red-400 text-xl">✕</span>
        </div>
        
        <span className="text-slate-500 text-2xl">→</span>
        
        {/* Landscape - Check */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-10 border-2 border-blue-500 rounded-lg bg-blue-500/10" />
          <span className="text-green-400 text-xl">✓</span>
        </div>
      </div>

      {/* Skip option */}
      <div className="text-center">
        <p className="text-slate-500 text-sm mb-3">
          Don't want to rotate?
        </p>
        <button
          onClick={onSkip}
          className="px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors font-medium border border-slate-700 hover:border-slate-500"
        >
          Skip to portfolio →
        </button>
      </div>
    </div>
  );
}
