import { useState, useEffect } from "react";

interface WelcomeOverlayProps {
  onSkip?: () => void;
  onStart?: () => void;
}

export default function WelcomeOverlay({ onSkip, onStart }: WelcomeOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 1024 && 'ontouchstart' in window;
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsLandscapeMobile(isMobile && isLandscape);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onStart?.();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible) return null;

  // Compact version for mobile landscape
  if (isLandscapeMobile) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fadeIn p-2">
        <div className="bg-slate-900 border-2 border-slate-600 rounded-lg w-full max-w-2xl p-4 shadow-2xl animate-scaleIn flex gap-4">
          {/* Left side - Header & Controls */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎮</span>
              <div>
                <h1 className="text-lg font-bold text-white pixel-text leading-tight">
                  Welcome!
                </h1>
                <p className="text-slate-400 text-xs">
                  Interactive pixel portfolio
                </p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-2 text-xs">
              <div className="flex gap-4">
                <div>
                  <span className="text-slate-400">Desktop:</span>
                  <div className="flex gap-1 mt-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded text-xs">↑↓←→</kbd>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Mobile:</span>
                  <p className="text-slate-300 mt-1">D-pad controls</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex flex-col justify-center gap-2 min-w-[140px]">
            <button
              onClick={handleDismiss}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-sm"
              autoFocus
            >
              Let's Explore! 🚀
            </button>
            {onSkip && (
              <button
                onClick={handleSkip}
                className="py-1.5 text-slate-400 hover:text-white text-xs transition-colors"
              >
                Skip to portfolio →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard version for desktop and portrait mobile
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn overflow-y-auto p-4">
      <div className="bg-slate-900 border-4 border-slate-600 rounded-lg max-w-md w-full p-6 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-2xl font-bold text-white pixel-text">
            Welcome to My Portfolio!
          </h1>
          <p className="text-slate-400 mt-2">
            Explore my work in this interactive pixel world
          </p>
        </div>

        {/* Controls Guide */}
        <div className="space-y-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <span>🕹️</span> How to Play
            </h3>
            
            {/* Desktop Controls */}
            <div className="mb-3">
              <p className="text-slate-400 text-sm mb-2">Desktop:</p>
              <div className="flex gap-2 justify-center">
                <kbd className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm font-mono">↑</kbd>
                <kbd className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm font-mono">↓</kbd>
                <kbd className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm font-mono">←</kbd>
                <kbd className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm font-mono">→</kbd>
                <span className="text-slate-500 mx-1">or</span>
                <kbd className="px-3 py-1 bg-slate-700 text-slate-200 rounded text-sm font-mono">WASD</kbd>
              </div>
            </div>

            {/* Mobile Controls */}
            <div>
              <p className="text-slate-400 text-sm mb-2">Mobile:</p>
              <p className="text-slate-300 text-sm text-center">
                Use the on-screen D-pad to move
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span>🏠</span> What to Do
            </h3>
            <ul className="text-slate-300 text-sm space-y-2">
              <li className="flex gap-2">
                <span className="text-blue-400">→</span>
                Walk into building doors to explore sections
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">→</span>
                Each building contains different portfolio content
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">→</span>
                Press ESC or click outside to close popups
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleDismiss}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          autoFocus
        >
          Let's Explore! 🚀
        </button>

        {/* Skip to portfolio option */}
        {onSkip && (
          <button
            onClick={handleSkip}
            className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Or skip to portfolio →
          </button>
        )}
      </div>
    </div>
  );
}
