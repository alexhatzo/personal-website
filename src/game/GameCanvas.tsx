import { useEffect, useRef } from "react";
import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";
import { SIZES, BACKGROUND_COLOR } from "./constants";
import { loadSprites } from "./sprites";
import { setupCityScene, setupInteriorScenes } from "./scenes";
import { setBuildingLabels, setInteriorTitles, setAboutData, setContactData } from "./content";
import { setCreatureLabels } from "./entities";
import type { BuildingsData, AboutData, ContactData, Experience, ProjectsData, SkillsData } from "../types/portfolio";

// Re-export mobileInput, mobileAction, and event name for MobileControls component
export { mobileInput, mobileAction, ACTION_LABEL_CHANGE_EVENT } from "./entities";

interface GameCanvasProps {
  onCapture?: (creatureId: string) => void;
  onSectionInteract?: (section: string) => void;
  buildingsData?: BuildingsData;
  aboutData?: AboutData;
  contactData?: ContactData;
  experienceData?: Experience[];
  projectsData?: ProjectsData;
  skillsData?: SkillsData;
}

export default function GameCanvas({ onCapture, onSectionInteract, buildingsData, aboutData, contactData, experienceData, projectsData, skillsData }: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<KAPLAYCtx | null>(null);
  const initializedRef = useRef(false);
  
  // Store callbacks in refs so they're always up-to-date without causing re-initialization
  const onCaptureRef = useRef(onCapture);
  const onSectionInteractRef = useRef(onSectionInteract);
  
  // Effect 1: Keep callback refs synchronized with props
  useEffect(() => {
    onCaptureRef.current = onCapture;
    onSectionInteractRef.current = onSectionInteract;
  }, [onCapture, onSectionInteract]);
  
  // Effect 2: Set portfolio content data (building labels, interior titles, creature labels)
  // This runs on mount and whenever data props change
  useEffect(() => {
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
    if (aboutData) {
      setAboutData(aboutData);
    }
    if (contactData) {
      setContactData(contactData);
    }
    setCreatureLabels(experienceData, projectsData, skillsData);
  }, [buildingsData, aboutData, contactData, experienceData, projectsData, skillsData]);

  // Effect 3: Initialize Kaplay game engine (runs once on mount)
  // Uses refs for callbacks so the game doesn't reinitialize when callbacks change
  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;
    initializedRef.current = true;
    
    // Clean up any existing content before initializing
    canvasRef.current.innerHTML = "";

    // Initialize Kaplay - use full canvas size, letterbox handles scaling
    const k = kaplay({
      root: canvasRef.current,
      width: SIZES.CANVAS_W,
      height: SIZES.CANVAS_H,
      letterbox: true,
      crisp: true,
      background: BACKGROUND_COLOR,
    });

    gameRef.current = k;

    // Load all sprites
    loadSprites(k);

    // Setup scenes - wrap callbacks in functions that access refs
    // This ensures callbacks are always up-to-date without reinitializing scenes
    setupCityScene(k);
    setupInteriorScenes(k, {
      onCapture: (creatureId: string) => onCaptureRef.current?.(creatureId),
      onSectionInteract: (section: string) => onSectionInteractRef.current?.(section),
    });

    // Start the game
    k.go("city");

    // Cleanup when component unmounts
    return () => {
      if (gameRef.current) {
        gameRef.current.quit();
        gameRef.current = null;
      }
    };
  }, []);

  // Simple container - Kaplay's letterbox mode handles all scaling
  return (
    <div
      ref={canvasRef}
      className="w-full h-full flex items-center justify-center game-container"
    />
  );
}
