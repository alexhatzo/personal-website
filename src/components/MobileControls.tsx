import { mobileInput, mobileAction } from "../game/GameCanvas";

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

  const handleActionPress = () => {
    mobileAction.trigger();
  };

  const buttonClass =
    "w-14 h-14 bg-slate-800/80 border-2 border-slate-600 rounded-lg flex items-center justify-center text-2xl text-white active:bg-slate-700 select-none";

  return (
    <>
      {/* D-pad controls on the left */}
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

      {/* Action button on the right - styled like a pokeball */}
      <div className="fixed bottom-10 right-6 z-40 md:hidden">
        <button
          className="w-16 h-16 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-slate-800 flex items-center justify-center active:scale-95 select-none shadow-lg relative overflow-hidden"
          onTouchStart={handleActionPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* White bottom half */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-slate-100 to-white" />
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2" />
          {/* Center button */}
          <div className="relative w-5 h-5 rounded-full bg-white border-4 border-slate-800" />
        </button>
        <p className="text-center text-white text-xs mt-1 text-shadow">Catch!</p>
      </div>
    </>
  );
}
