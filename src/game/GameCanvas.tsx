import { useEffect, useRef } from "react";
import kaplay from "kaplay";
import type { KAPLAYCtx } from "kaplay";
import { SIZES } from "./constants";
import { loadSprites } from "./sprites";
import { setupCityScene, setupInteriorScenes, setOnCaptureCallback, setOnSectionInteractCallback } from "./scenes";
import { setBuildingLabels, setInteriorTitles, setAboutData, setContactData } from "./content";
import { setCreatureLabels } from "./entities";
import type { BuildingsData, AboutData, ContactData, Experience, ProjectsData, SkillsData } from "../types/portfolio";

// Re-export mobileInput and mobileAction for MobileControls component
export { mobileInput, mobileAction } from "./entities";

interface GameCanvasProps {
  onZoneEnter: (section: string) => void;
  onCapture?: (creatureId: string) => void;
  onSectionInteract?: (section: string) => void;
  buildingsData?: BuildingsData;
  aboutData?: AboutData;
  contactData?: ContactData;
  experienceData?: Experience[];
  projectsData?: ProjectsData;
  skillsData?: SkillsData;
}

export default function GameCanvas({ onZoneEnter: _onZoneEnter, onCapture, onSectionInteract, buildingsData, aboutData, contactData, experienceData, projectsData, skillsData }: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<KAPLAYCtx | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip if already initialized or no canvas ref
    if (!canvasRef.current || initializedRef.current) return;
    initializedRef.current = true;
    
    // Clean up any existing content before initializing
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

    // Set creature labels from portfolio data (experience roles, project titles, skill categories)
    setCreatureLabels(experienceData, projectsData, skillsData);

    // Initialize Kaplay - use full canvas size, letterbox handles scaling
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
    // Empty dependency array - only initialize once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simple container - Kaplay's letterbox mode handles all scaling
  return (
    <div
      ref={canvasRef}
      className="w-full h-full flex items-center justify-center game-container"
    />
  );
}
