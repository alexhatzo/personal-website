import type { PortfolioData } from "../../types/portfolio";

// ?section=<id> accepts these ids.
export const SECTIONS = [
  { id: "about", label: "About", accent: "#6f97ff", kicker: "Athens → Los Angeles", pos: [0.08, 0.13] },
  { id: "now", label: "Now", accent: "#ff5c9a", kicker: "Founding engineer, creator commerce × AI", pos: [0.31, 0.16] },
  { id: "before", label: "Before", accent: "#ffb23e", kicker: "Clusters, clouds, campaigns", pos: [0.54, 0.12] },
  { id: "projects", label: "Projects", accent: "#c6ff4a", kicker: "Things shipped and tinkered", pos: [0.76, 0.15] },
  { id: "skills", label: "Skills", accent: "#43dcff", kicker: "What orbits the work", pos: [0.2, 0.87] },
  { id: "offhours", label: "Off-hours", accent: "#a993ff", kicker: "Records, linen, tennis", pos: [0.46, 0.85] },
  { id: "contact", label: "Contact", accent: "#ffe15c", kicker: "Say hello", pos: [0.72, 0.88] },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
export const HOME_ACCENT = "#ff6a3d";

export const isSectionId = (v: string | null): v is SectionId => SECTIONS.some((s) => s.id === v);

// The "Life" category belongs to Off-hours; Projects shows every other category.
export const lifeCategory = (data: PortfolioData) =>
  data.projects.categories.find((c) => c.name.toLowerCase() === "life");

export function shiftHue(hex: string, deg: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (((h * 60 + deg) % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r1)}${to(g1)}${to(b1)}`;
}
