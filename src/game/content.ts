import type { BuildingContent, SectionType } from "./types";

// Module-level state for building labels and interior titles
// These get set by GameCanvas before the game initializes
let buildingLabels: Record<SectionType, string> = {
  about: "ABOUT ME",
  projects: "PROJECTS",
  skills: "SKILLS",
  experience: "EXPERIENCE",
  contact: "CONTACT",
};

let interiorTitles: Record<SectionType, string> = {
  about: "About Me",
  projects: "My Projects",
  skills: "My Skills",
  experience: "Work Experience",
  contact: "Contact Me",
};

// Setters called from GameCanvas with data from portfolio.json
export function setBuildingLabels(labels: Record<SectionType, string>): void {
  buildingLabels = labels;
}

export function setInteriorTitles(titles: Record<SectionType, string>): void {
  interiorTitles = titles;
}

// Getters for use in game code
export function getBuildingLabel(section: SectionType): string {
  return buildingLabels[section];
}

export function getInteriorTitle(section: SectionType): string {
  return interiorTitles[section];
}

// Content displayed inside each building (short text for the interior boards)
// These are simple summaries - the full content is in the React modals
export const BUILDING_CONTENT: Record<SectionType, BuildingContent> = {
  about: {
    get title() { return interiorTitles.about; },
    lines: [
      "Walk around to explore!",
      "",
      "Click on elements or",
      "press SPACE to interact.",
    ],
  },
  projects: {
    get title() { return interiorTitles.projects; },
    lines: [
      "Check out my work!",
      "",
      "Each project showcases",
      "different skills.",
    ],
  },
  skills: {
    get title() { return interiorTitles.skills; },
    lines: [
      "Technical expertise in:",
      "",
      "Frontend, Backend,",
      "DevOps & more!",
    ],
  },
  experience: {
    get title() { return interiorTitles.experience; },
    lines: [
      "Capture the mushrooms",
      "to see my work history!",
      "",
      "Press SPACE near them.",
    ],
  },
  contact: {
    get title() { return interiorTitles.contact; },
    lines: [
      "Let's connect!",
      "",
      "Find me on GitHub,",
      "LinkedIn, or email.",
    ],
  },
};
