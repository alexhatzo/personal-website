import type { BuildingContent, SectionType } from "./types";

// Content displayed inside each building
export const BUILDING_CONTENT: Record<SectionType, BuildingContent> = {
  about: {
    title: "About Me",
    lines: [
      "Hi! I'm a developer who",
      "loves building creative",
      "web experiences.",
      "",
      "Skills: React, TypeScript",
      "This site proves websites",
      "can be fun to explore!",
    ],
  },
  projects: {
    title: "My Projects",
    lines: [
      "1. This Portfolio!",
      "   Walk around & explore",
      "",
      "2. Project Two",
      "   A cool app I built",
      "",
      "3. Project Three",
      "   Another creation",
    ],
  },
  skills: {
    title: "My Skills",
    lines: [
      "Frontend:",
      "  React, TypeScript, CSS",
      "",
      "Backend:",
      "  Node.js, Python, SQL",
      "",
      "Tools:",
      "  Git, Docker, AWS",
    ],
  },
  experience: {
    title: "Work History",
    lines: [
      "2023 - Now",
      "  Senior Dev @ Company",
      "",
      "2021 - 2023",
      "  Engineer @ Startup",
      "",
      "2019 - 2021",
      "  Junior @ First Job",
    ],
  },
  contact: {
    title: "Contact Me",
    lines: [
      "Email:",
      "  hello@example.com",
      "",
      "GitHub:",
      "  github.com/you",
      "",
      "LinkedIn:",
      "  linkedin.com/in/you",
    ],
  },
};
