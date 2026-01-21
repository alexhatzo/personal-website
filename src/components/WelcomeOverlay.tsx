import { useState, useEffect } from "react";

const STORAGE_KEY = "portfolio_hasVisited";

interface WelcomeOverlayProps {
  onSkip?: () => void;
}

export default function WelcomeOverlay({ onSkip }: WelcomeOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    if (!hasVisited) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-slate-900 border-4 border-slate-600 rounded-lg max-w-md w-full mx-4 p-6 shadow-2xl animate-scaleIn">
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

        {/* Skip hint */}
        <p className="text-slate-500 text-xs text-center mt-3">
          This message won't appear again
        </p>
      </div>
    </div>
  );
}
