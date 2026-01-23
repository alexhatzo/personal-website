import { useState, useEffect, useRef, useCallback } from "react";
import { mobileInput, mobileAction, ACTION_LABEL_CHANGE_EVENT } from "../game/GameCanvas";

// Detect if device has touch capability (true mobile device)
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

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
  return <span className="text-2xl relative z-10">💬</span>;
}

function HammerIcon() {
  return <span className="text-2xl relative z-10">🔨</span>;
}

function ArrowIcon() {
  return <span className="text-2xl relative z-10">🏹</span>;
}

function InfoIcon() {
  return <span className="text-2xl relative z-10">ℹ️</span>;
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

// Joystick configuration
const JOYSTICK_SIZE = 100; // Outer circle diameter
const KNOB_SIZE = 44; // Inner knob diameter
const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2; // Max distance knob can move from center
const DEAD_ZONE = 0.15; // Dead zone as percentage of max distance

interface MobileControlsProps {
  onSkip?: () => void;
}

export default function MobileControls({ onSkip }: MobileControlsProps) {
  const [actionLabel, setActionLabel] = useState("Chat");
  const [showControls, setShowControls] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Check if we should show mobile controls (touch device in landscape)
  useEffect(() => {
    const checkMobile = () => {
      const isTouch = isTouchDevice();
      const isLandscape = window.innerWidth > window.innerHeight;
      setShowControls(isTouch && isLandscape);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  // Listen for action label changes via custom event (event-driven, not polling)
  useEffect(() => {
    const handleLabelChange = (e: CustomEvent<string>) => {
      setActionLabel(e.detail);
    };

    // Set initial value from current state
    setActionLabel(mobileAction.label);

    // Listen for changes
    window.addEventListener(
      ACTION_LABEL_CHANGE_EVENT,
      handleLabelChange as EventListener
    );

    return () => {
      window.removeEventListener(
        ACTION_LABEL_CHANGE_EVENT,
        handleLabelChange as EventListener
      );
    };
  }, []);

  // Calculate joystick input from knob position
  const updateInput = useCallback((x: number, y: number) => {
    const distance = Math.sqrt(x * x + y * y);
    const normalizedDistance = distance / MAX_DISTANCE;

    // Apply dead zone
    if (normalizedDistance < DEAD_ZONE) {
      mobileInput.up = false;
      mobileInput.down = false;
      mobileInput.left = false;
      mobileInput.right = false;
      return;
    }

    // Calculate angle and determine direction
    const angle = Math.atan2(y, x);
    const degrees = (angle * 180) / Math.PI;

    // Reset all inputs
    mobileInput.up = false;
    mobileInput.down = false;
    mobileInput.left = false;
    mobileInput.right = false;

    // Set inputs based on angle (with 45-degree sectors)
    // Right: -45 to 45
    // Down: 45 to 135
    // Left: 135 to 180 or -180 to -135
    // Up: -135 to -45

    if (degrees >= -45 && degrees < 45) {
      mobileInput.right = true;
    } else if (degrees >= 45 && degrees < 135) {
      mobileInput.down = true;
    } else if (degrees >= 135 || degrees < -135) {
      mobileInput.left = true;
    } else if (degrees >= -135 && degrees < -45) {
      mobileInput.up = true;
    }

    // Also enable diagonal movement if close to corners
    if (degrees >= -67.5 && degrees < -22.5) {
      mobileInput.up = true;
      mobileInput.right = true;
    } else if (degrees >= 22.5 && degrees < 67.5) {
      mobileInput.down = true;
      mobileInput.right = true;
    } else if (degrees >= 112.5 && degrees < 157.5) {
      mobileInput.down = true;
      mobileInput.left = true;
    } else if (degrees >= -157.5 && degrees < -112.5) {
      mobileInput.up = true;
      mobileInput.left = true;
    }
  }, []);

  // Handle joystick touch
  const handleJoystickTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickRef.current) return;

    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let x = touch.clientX - centerX;
    let y = touch.clientY - centerY;

    // Limit to max distance
    const distance = Math.sqrt(x * x + y * y);
    if (distance > MAX_DISTANCE) {
      x = (x / distance) * MAX_DISTANCE;
      y = (y / distance) * MAX_DISTANCE;
    }

    setKnobPosition({ x, y });
    updateInput(x, y);
    isDragging.current = true;
  }, [updateInput]);

  const handleJoystickEnd = useCallback(() => {
    setKnobPosition({ x: 0, y: 0 });
    mobileInput.up = false;
    mobileInput.down = false;
    mobileInput.left = false;
    mobileInput.right = false;
    isDragging.current = false;
  }, []);

  const handleActionPress = () => {
    mobileAction.trigger();
  };

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

  // Don't render controls if not on a touch device in landscape
  if (!showControls) return null;

  return (
    <>
      {/* Portfolio/Skip button - mobile accessible alternative */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 active:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-600 shadow-lg select-none touch-none"
          aria-label="View as traditional portfolio"
        >
          <span className="text-base">📋</span>
          <span className="font-medium">Portfolio</span>
        </button>
      )}

      {/* Virtual Joystick on the left */}
      <div
        ref={joystickRef}
        className="fixed bottom-4 left-4 z-40 select-none touch-none"
        style={{ width: JOYSTICK_SIZE, height: JOYSTICK_SIZE }}
        onTouchStart={handleJoystickTouch}
        onTouchMove={handleJoystickTouch}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
        onContextMenu={(e) => e.preventDefault()}
        role="application"
        aria-label="Virtual joystick for movement"
      >
        {/* Outer ring (joystick base) */}
        <div
          className="absolute inset-0 rounded-full bg-slate-800/70 border-2 border-slate-600/80 shadow-lg"
          style={{
            background: 'radial-gradient(circle, rgba(51,65,85,0.8) 0%, rgba(30,41,59,0.9) 100%)',
          }}
        >
          {/* Direction indicators */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute top-2 text-slate-500 text-xs">↑</div>
            <div className="absolute bottom-2 text-slate-500 text-xs">↓</div>
            <div className="absolute left-2 text-slate-500 text-xs">←</div>
            <div className="absolute right-2 text-slate-500 text-xs">→</div>
          </div>
        </div>

        {/* Inner knob (draggable) */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-slate-500 to-slate-700 border-2 border-slate-400 shadow-xl transition-transform duration-75"
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            left: (JOYSTICK_SIZE - KNOB_SIZE) / 2 + knobPosition.x,
            top: (JOYSTICK_SIZE - KNOB_SIZE) / 2 + knobPosition.y,
          }}
        >
          {/* Knob highlight */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-400/30 to-transparent" />
        </div>
      </div>

      {/* Action button on the right */}
      <div className="fixed bottom-6 right-4 z-40 select-none touch-none">
        <button
          className={`w-14 h-14 rounded-full ${getButtonStyle(actionLabel)} border-4 border-slate-800 flex items-center justify-center active:scale-95 select-none touch-none shadow-xl relative overflow-hidden focus:outline-none`}
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
