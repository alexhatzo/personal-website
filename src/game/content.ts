import type { BuildingContent, SectionType } from "./types";
import type { AboutData, ContactData } from "../types/portfolio";

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

// Portfolio data for content boards
let aboutData: AboutData | null = null;
let contactData: ContactData | null = null;

// Setters called from GameCanvas with data from portfolio.json
export function setBuildingLabels(labels: Record<SectionType, string>): void {
  buildingLabels = labels;
}

export function setInteriorTitles(titles: Record<SectionType, string>): void {
  interiorTitles = titles;
}

export function setAboutData(data: AboutData): void {
  aboutData = data;
}

export function setContactData(data: ContactData): void {
  contactData = data;
}

// Getters for use in game code
export function getBuildingLabel(section: SectionType): string {
  return buildingLabels[section];
}

export function getInteriorTitle(section: SectionType): string {
  return interiorTitles[section];
}

export function getAboutData(): AboutData | null {
  return aboutData;
}

export function getContactData(): ContactData | null {
  return contactData;
}

// Helper to truncate text to fit on content board (roughly 24 chars per line)
function truncate(text: string, maxLen: number = 24): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 2) + "..";
}

// Generate about content lines from portfolio data
function getAboutLines(): string[] {
  if (!aboutData) {
    return ["Loading...", "", "Please wait."];
  }
  return [
    truncate(aboutData.name, 22),
    "",
    truncate(aboutData.title, 22),
    "",
    "Press SPACE for more!",
  ];
}

// Generate contact content lines from portfolio data
function getContactLines(): string[] {
  if (!contactData) {
    return ["Loading...", "", "Please wait."];
  }
  return [
    truncate(contactData.email, 22),
    "",
    ...contactData.socialLinks.slice(0, 2).map((link) => 
      `${link.icon} ${truncate(link.name, 18)}`
    ),
    "",
    "Press SPACE for more!",
  ];
}

// Content displayed inside each building (short text for the interior boards)
// About and Contact use dynamic data from portfolio.json
export const BUILDING_CONTENT: Record<SectionType, BuildingContent> = {
  about: {
    get title() { return interiorTitles.about; },
    get lines() { return getAboutLines(); },
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
    get lines() { return getContactLines(); },
  },
};
