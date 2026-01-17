import type { SectionType } from "../types";
import type { CreatureConfig } from "./creatures";
import { getSpritesForType } from "../sprites";

// ============================================================================
// Types
// ============================================================================

/**
 * Action types for creature interactions
 * - pokeball: Throw a pokeball to capture (Experience building style)
 * - arrow: Shoot an arrow at creatures (Skills building style)
 * - hammer: Swing a hammer to smash creatures (Projects building style)
 */
export type ActionType = "pokeball" | "arrow" | "hammer";

/**
 * Configuration for creatures in a building
 */
export interface BuildingCreatureConfig {
  /** Which building section this applies to */
  section: SectionType;
  /** Whether this building has creatures (vs content board) */
  hasCreatures: boolean;
  /** Creature definitions (without x/y, those are set by the room) */
  creatures?: Omit<CreatureConfig, "x" | "y">[];
  /** Action type for interacting with creatures */
  actionType?: ActionType;
  /** Title to display in the room */
  roomTitle?: string;
  /** Instruction text to display */
  instructionText?: string;
}

// ============================================================================
// Building Creature Configurations
// ============================================================================

// Helper to get sprites by type
const mushroomSprites = getSpritesForType("mushroom");
// Blob sprites are split into two types (different column counts), so we list them directly
const blobSprites = ["blob-red", "blob-green", "blob-blue"];

/**
 * Creature configurations for each building
 * Buildings without creatures will show the content board UI
 */
export const BUILDING_CREATURE_CONFIGS: BuildingCreatureConfig[] = [
  // Experience building - has creatures with pokeball capture
  {
    section: "experience",
    hasCreatures: true,
    actionType: "pokeball",
    roomTitle: "Work Experience",
    instructionText: "Press SPACE to capture!",
    creatures: [
      { id: "job-0", sprite: mushroomSprites[0], label: "Senior Dev" },
      { id: "job-1", sprite: mushroomSprites[1], label: "Engineer" },
      { id: "job-2", sprite: mushroomSprites[2], label: "Junior" },
    ],
  },
  
  // Projects building - blobs with hammer smash
  {
    section: "projects",
    hasCreatures: true,
    actionType: "hammer",
    roomTitle: "My Projects",
    instructionText: "Press SPACE to smash!",
    creatures: [
      { id: "project-0", sprite: blobSprites[0], label: "Project 1" },
      { id: "project-1", sprite: blobSprites[1], label: "Project 2" },
      { id: "project-2", sprite: blobSprites[2], label: "Project 3" },
    ],
  },
  
  // Skills building - goblins with arrow shooting (one per skill category)
  {
    section: "skills",
    hasCreatures: true,
    actionType: "arrow",
    roomTitle: "My Skills",
    instructionText: "Press SPACE to shoot!",
    creatures: [
      { id: "skill-0", sprite: "goblin", label: "Frontend" },
      { id: "skill-1", sprite: "goblin", label: "Backend" },
      { id: "skill-2", sprite: "goblin", label: "DevOps" },
    ],
  },
  
  // About building - content board
  {
    section: "about",
    hasCreatures: false,
  },
  
  // Contact building - content board (keep as static)
  {
    section: "contact",
    hasCreatures: false,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the creature config for a specific building section
 */
export function getCreatureConfigForSection(section: SectionType): BuildingCreatureConfig | undefined {
  return BUILDING_CREATURE_CONFIGS.find((config) => config.section === section);
}

/**
 * Check if a building section has creatures
 */
export function sectionHasCreatures(section: SectionType): boolean {
  const config = getCreatureConfigForSection(section);
  return config?.hasCreatures ?? false;
}
