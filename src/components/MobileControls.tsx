import { useState, useEffect } from "react";
import { mobileInput, mobileAction } from "../game/GameCanvas";

// Action button icons for different contexts
function PokeballIcon() {
  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-slate-100 to-white" />
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2" />
      <div className="relative w-5 h-5 rounded-full bg-white border-4 border-slate-800" />
    </>
  );
}

function ChatIcon() {
  return (
    <span className="text-2xl relative z-10">💬</span>
  );
}

function HammerIcon() {
  return (
    <span className="text-2xl relative z-10">🔨</span>
  );
}

function ArrowIcon() {
  return (
    <span className="text-2xl relative z-10">🏹</span>
  );
}

function InfoIcon() {
  return (
    <span className="text-2xl relative z-10">ℹ️</span>
  );
}

// Get button style based on action type
function getButtonStyle(label: string): string {
  switch (label) {
    case "Catch":
      return "bg-gradient-to-b from-red-500 to-red-600";
    case "Smash":
      return "bg-gradient-to-b from-amber-600 to-amber-700";
    case "Shoot":
      return "bg-gradient-to-b from-green-500 to-green-600";
    case "Info":
      return "bg-gradient-to-b from-blue-500 to-blue-600";
    case "Chat":
    default:
      return "bg-gradient-to-b from-sky-500 to-sky-600";
  }
}

export default function MobileControls() {
  const [actionLabel, setActionLabel] = useState("Chat");

  // Update label periodically to reflect current context
  useEffect(() => {
    const interval = setInterval(() => {
      if (mobileAction.label !== actionLabel) {
        setActionLabel(mobileAction.label);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [actionLabel]);

  const handleTouchStart = (direction: "up" | "down" | "left" | "right") => {
    mobileInput[direction] = true;
  };

  const handleTouchEnd = (direction: "up" | "down" | "left" | "right") => {
    mobileInput[direction] = false;
  };

  const handleAllTouchEnd = () => {
    mobileInput.up = false;
    mobileInput.down = false;
    mobileInput.left = false;
    mobileInput.right = false;
  };

  const handleActionPress = () => {
    mobileAction.trigger();
  };

  // Prevent text selection on touch
  const preventSelection = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  const buttonClass =
    "w-14 h-14 bg-slate-800/80 border-2 border-slate-600 rounded-lg flex items-center justify-center text-2xl text-white active:bg-slate-700 select-none touch-none focus:outline-none focus:ring-2 focus:ring-blue-400";

  // Get the right icon for current action
  const renderActionIcon = () => {
    switch (actionLabel) {
      case "Catch":
        return <PokeballIcon />;
      case "Smash":
        return <HammerIcon />;
      case "Shoot":
        return <ArrowIcon />;
      case "Info":
        return <InfoIcon />;
      case "Chat":
      default:
        return <ChatIcon />;
    }
  };

  return (
    <>
      {/* D-pad controls on the left */}
      <nav
        className="fixed bottom-6 left-6 z-40 md:hidden select-none touch-none"
        role="group"
        aria-label="Game movement controls"
        onTouchStart={preventSelection}
      >
        <div className="grid grid-cols-3 gap-1">
          {/* Top row - Up button */}
          <div />
          <button
            className={buttonClass}
            onTouchStart={() => handleTouchStart("up")}
            onTouchEnd={() => handleTouchEnd("up")}
            onTouchCancel={handleAllTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Move up"
          >
            ↑
          </button>
          <div />

          {/* Middle row - Left and Right */}
          <button
            className={buttonClass}
            onTouchStart={() => handleTouchStart("left")}
            onTouchEnd={() => handleTouchEnd("left")}
            onTouchCancel={handleAllTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Move left"
          >
            ←
          </button>
          <div />
          <button
            className={buttonClass}
            onTouchStart={() => handleTouchStart("right")}
            onTouchEnd={() => handleTouchEnd("right")}
            onTouchCancel={handleAllTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Move right"
          >
            →
          </button>

          {/* Bottom row - Down button */}
          <div />
          <button
            className={buttonClass}
            onTouchStart={() => handleTouchStart("down")}
            onTouchEnd={() => handleTouchEnd("down")}
            onTouchCancel={handleAllTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Move down"
          >
            ↓
          </button>
          <div />
        </div>
      </nav>

      {/* Action button on the right - changes based on context */}
      <div className="fixed bottom-10 right-6 z-40 md:hidden select-none touch-none">
        <button
          className={`w-16 h-16 rounded-full ${getButtonStyle(actionLabel)} border-4 border-slate-800 flex items-center justify-center active:scale-95 select-none touch-none shadow-lg relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2`}
          onTouchStart={handleActionPress}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={`${actionLabel} action button`}
        >
          {renderActionIcon()}
        </button>
        <p className="text-center text-white text-xs mt-1 text-shadow select-none" aria-hidden="true">
          {actionLabel}
        </p>
      </div>
    </>
  );
}
