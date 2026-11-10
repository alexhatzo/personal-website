import type { Experience, PortfolioData, Project } from "../../types/portfolio";

// Great-circle Athens (23.94E, 37.94N) -> Los Angeles (118.41W, 33.94N); computed in map.ts too.
export const ROUTE_KM = 11127;

// The flight is flown in three legs; each pinned chapter scrubs its own leg 0 -> 1.
// Share of the total distance per leg: 03 takeoff, 04 steps + gallery, 05 landing.
export const LEG_SHARE = { takeoff: 0.7, cruiseA: 0.16, cruiseB: 0.11, landing: 0.03 } as const;
export type Leg = keyof typeof LEG_SHARE;
export const flight: Record<Leg, number> = { takeoff: 0, cruiseA: 0, cruiseB: 0, landing: 0 };
export const LEGS = Object.keys(LEG_SHARE) as Leg[];
export const flownKm = () => ROUTE_KM * LEGS.reduce((km, l) => km + LEG_SHARE[l] * flight[l], 0);

export interface ChapterMeta {
  title: string;
  years: [number, number];
  palette: { bg: string; ink: string; accent: string };
  // How much of a viewport before the chapter start the palette starts blending in.
  blend: number;
}

const PAPER = "#F4EFE7";
const NOIR = "#0F0E0D";
const SUN = "#FF4F1A";

export function chapterMeta(d: PortfolioData): ChapterMeta[] {
  const p1 = job(d, "job-p1")?.company ?? "Cruising altitude";
  const oo = job(d, "job-oneoff")?.company ?? "Landing";
  return [
    { title: "Boarding", years: [2018, 2018], palette: { bg: "#EEEBE3", ink: "#1336B8", accent: "#1336B8" }, blend: 0 },
    { title: d.about.quickFacts.hometown.split(",")[0], years: [2018, 2018], palette: { bg: "#E8E0D2", ink: "#2A1F19", accent: "#B9482A" }, blend: 0.7 },
    { title: "First gigs", years: [2020, 2021], palette: { bg: "#E2D3BC", ink: "#2A1F19", accent: "#A63F1D" }, blend: 0.5 },
    { title: "Takeoff", years: [2021, 2022], palette: { bg: "#0B1430", ink: "#E8EDF8", accent: "#F3B562" }, blend: 0.6 },
    { title: p1, years: [2022, 2026], palette: { bg: "#060A18", ink: "#DCE3F5", accent: "#8FD3FF" }, blend: 0.6 },
    { title: `Landing: ${oo}`, years: [2026, 2026], palette: { bg: PAPER, ink: NOIR, accent: SUN }, blend: 0.02 },
    { title: "Side quests", years: [2026, 2026], palette: { bg: NOIR, ink: PAPER, accent: SUN }, blend: 0.5 },
    { title: "Toolkit", years: [2026, 2026], palette: { bg: PAPER, ink: NOIR, accent: SUN }, blend: 0.5 },
    { title: "Off-hours", years: [2026, 2026], palette: { bg: "#140E0C", ink: PAPER, accent: SUN }, blend: 0.5 },
    { title: "Arrivals", years: [2026, 2026], palette: { bg: SUN, ink: NOIR, accent: NOIR }, blend: 0.6 },
  ];
}

export const job = (d: PortfolioData, id: string): Experience | undefined => d.experience.find((e) => e.id === id);
export const projectsIn = (d: PortfolioData, name: string): Project[] =>
  d.projects.categories.find((c) => c.name === name)?.projects ?? [];

// Percentages, "<5 min", "$200k+", "5,000": the numbers worth pulling out typographically.
export const METRIC = /(?<![\w$])(<\s?\d+\s?min|\$\d[\d,]*k?\+?|\d[\d,]*%\+?|\d{1,3}(?:,\d{3})+\+?)/g;
export const firstMetric = (s: string) => s.match(METRIC)?.[0] ?? null;

export const pad = (n: number, w = 2) => String(n).padStart(w, "0");
export const hostOf = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
