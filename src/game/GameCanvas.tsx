import { useEffect, useRef } from "react";
import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";
import { SIZES } from "./constants";
import { loadSprites } from "./sprites";
import { setupCityScene, setupInteriorScenes, setOnCaptureCallback } from "./scenes";

// Re-export mobileInput and mobileAction for MobileControls component
export { mobileInput, mobileAction } from "./entities";

interface GameCanvasProps {
  onZoneEnter: (section: string) => void;
  onCapture?: (creatureId: string) => void;
}

export default function GameCanvas({ onZoneEnter, onCapture }: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<KAPLAYCtx | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;
    initializedRef.current = true;
    canvasRef.current.innerHTML = "";

    // Initialize Kaplay
    const k = kaplay({
      root: canvasRef.current,
      width: SIZES.CANVAS_W,
      height: SIZES.CANVAS_H,
      letterbox: true,
      crisp: true,
      background: [34, 100, 34],
    });

    gameRef.current = k;

    // Set up capture callback for Experience building
    if (onCapture) {
      setOnCaptureCallback(onCapture);
    }

    // Load all sprites
    loadSprites(k);

    // Setup scenes
    setupCityScene(k);
    setupInteriorScenes(k);

    // Start the game
    k.go("city");

    // Cleanup
    return () => {
      if (gameRef.current) {
        gameRef.current.quit();
        gameRef.current = null;
      }
    };
  }, [onZoneEnter, onCapture]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
