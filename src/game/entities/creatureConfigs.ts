import type { SectionType } from "../types";
import type { CreatureConfig } from "./creatures";
import { getSpritesForType } from "../sprites";
import type { Experience, ProjectsData, SkillsData } from "../../types/portfolio";

// ============================================================================
// Dynamic Labels from Portfolio Data
// ============================================================================

// Module-level state for creature labels (set by GameCanvas before game init)
let experienceLabels: string[] = ["Job 1", "Job 2", "Job 3"];
let projectLabels: string[] = ["Work", "Personal", "Life"];
let skillLabels: string[] = ["Frontend", "Backend", "DevOps"];

/**
 * Set creature labels from portfolio data
 * Called by GameCanvas before the game initializes
 */
export function setCreatureLabels(
  experience?: Experience[],
  projects?: ProjectsData,
  skills?: SkillsData
): void {
  if (experience && experience.length > 0) {
    experienceLabels = experience.map((job) => job.role);
  }
  // Projects now uses categories - labels come from category names
  if (projects?.categories && projects.categories.length > 0) {
    projectLabels = projects.categories.map((cat) => cat.name);
  }
  if (skills?.categories && skills.categories.length > 0) {
    skillLabels = skills.categories.map((cat) => cat.name);
  }
}

// Getters for dynamic labels
function getExperienceLabel(index: number): string {
  return experienceLabels[index] ?? `Job ${index + 1}`;
}

function getProjectLabel(index: number): string {
  return projectLabels[index] ?? `Project ${index + 1}`;
}

function getSkillLabel(index: number): string {
  return skillLabels[index] ?? `Skill ${index + 1}`;
}

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
 * Note: Uses getters for labels so they can be set dynamically from portfolio data
 */
export const BUILDING_CREATURE_CONFIGS: BuildingCreatureConfig[] = [
  // Experience building - has creatures with pokeball capture
  {
    section: "experience",
    hasCreatures: true,
    actionType: "pokeball",
    roomTitle: "Work Experience",
    instructionText: "Press SPACE to capture!",
    get creatures() {
      return [
        { id: "job-0", sprite: mushroomSprites[0], label: getExperienceLabel(0) },
        { id: "job-1", sprite: mushroomSprites[1], label: getExperienceLabel(1) },
        { id: "job-2", sprite: mushroomSprites[2], label: getExperienceLabel(2) },
      ];
    },
  },
  
  // Projects building - blobs with hammer smash
  {
    section: "projects",
    hasCreatures: true,
    actionType: "hammer",
    roomTitle: "My Projects",
    instructionText: "Press SPACE to smash!",
    get creatures() {
      return [
        { id: "project-0", sprite: blobSprites[0], label: getProjectLabel(0) },
        { id: "project-1", sprite: blobSprites[1], label: getProjectLabel(1) },
        { id: "project-2", sprite: blobSprites[2], label: getProjectLabel(2) },
      ];
    },
  },
  
  // Skills building - goblins with arrow shooting (one per skill category)
  {
    section: "skills",
    hasCreatures: true,
    actionType: "arrow",
    roomTitle: "My Skills",
    instructionText: "Press SPACE to shoot!",
    get creatures() {
      return [
        { id: "skill-0", sprite: "goblin", label: getSkillLabel(0) },
        { id: "skill-1", sprite: "goblin", label: getSkillLabel(1) },
        { id: "skill-2", sprite: "goblin", label: getSkillLabel(2) },
      ];
    },
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
