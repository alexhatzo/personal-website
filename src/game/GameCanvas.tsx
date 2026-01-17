import { useEffect, useRef, useState } from "react";
import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";
import { SIZES } from "./constants";
import { loadSprites } from "./sprites";
import { setupCityScene, setupInteriorScenes, setOnCaptureCallback, setOnSectionInteractCallback } from "./scenes";
import { setBuildingLabels, setInteriorTitles, setAboutData, setContactData } from "./content";
import type { BuildingsData, AboutData, ContactData } from "../types/portfolio";

// Re-export mobileInput and mobileAction for MobileControls component
export { mobileInput, mobileAction } from "./entities";

// Detect if we're on mobile (touch device or narrow screen)
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || 'ontouchstart' in window;
}

interface GameCanvasProps {
  onZoneEnter: (section: string) => void;
  onCapture?: (creatureId: string) => void;
  onSectionInteract?: (section: string) => void;
  buildingsData?: BuildingsData;
  aboutData?: AboutData;
  contactData?: ContactData;
}

export default function GameCanvas({ onZoneEnter, onCapture, onSectionInteract, buildingsData, aboutData, contactData }: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<KAPLAYCtx | null>(null);
  const initializedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;
    initializedRef.current = true;
    canvasRef.current.innerHTML = "";

    // Set building labels and interior titles from portfolio data
    if (buildingsData) {
      setBuildingLabels({
        about: buildingsData.about.label,
        projects: buildingsData.projects.label,
        skills: buildingsData.skills.label,
        experience: buildingsData.experience.label,
        contact: buildingsData.contact.label,
      });
      setInteriorTitles({
        about: buildingsData.about.interiorTitle,
        projects: buildingsData.projects.interiorTitle,
        skills: buildingsData.skills.interiorTitle,
        experience: buildingsData.experience.interiorTitle,
        contact: buildingsData.contact.interiorTitle,
      });
    }

    // Set about and contact data for content boards
    if (aboutData) {
      setAboutData(aboutData);
    }
    if (contactData) {
      setContactData(contactData);
    }

    // Initialize Kaplay - use smaller viewport on mobile for 2x zoom effect
    const isMobile = isMobileDevice();
    const canvasW = isMobile ? Math.floor(SIZES.CANVAS_W / 2) : SIZES.CANVAS_W;
    const canvasH = isMobile ? Math.floor(SIZES.CANVAS_H / 2) : SIZES.CANVAS_H;
    
    const k = kaplay({
      root: canvasRef.current,
      width: canvasW,
      height: canvasH,
      letterbox: !isMobile, // Disable letterbox on mobile to fill screen
      stretch: isMobile,    // Stretch to fill on mobile
      crisp: true,
      background: [34, 100, 34],
    });

    gameRef.current = k;

    // Set up capture callback for Experience building
    if (onCapture) {
      setOnCaptureCallback(onCapture);
    }

    // Set up section interact callback for About/Contact buildings
    if (onSectionInteract) {
      setOnSectionInteractCallback(onSectionInteract);
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
  }, [onZoneEnter, onCapture, onSectionInteract, buildingsData, aboutData, contactData]);

  return (
    <div
      ref={canvasRef}
      className={`w-full flex justify-center ${
        isMobile 
          ? 'items-start h-[calc(100vh-130px)]' 
          : 'items-center h-full'
      }`}
    />
  );
}
