import { mobileInput } from "../game/GameCanvas";

export default function MobileControls() {
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

  const buttonClass =
    "w-14 h-14 bg-slate-800/80 border-2 border-slate-600 rounded-lg flex items-center justify-center text-2xl text-white active:bg-slate-700 select-none";

  return (
    <div className="fixed bottom-6 left-6 z-40 md:hidden">
      <div className="grid grid-cols-3 gap-1">
        {/* Top row - Up button */}
        <div />
        <button
          className={buttonClass}
          onTouchStart={() => handleTouchStart("up")}
          onTouchEnd={() => handleTouchEnd("up")}
          onTouchCancel={handleAllTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
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
        >
          ↓
        </button>
        <div />
      </div>
    </div>
  );
}
