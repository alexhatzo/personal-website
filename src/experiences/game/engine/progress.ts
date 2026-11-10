const KEY = "hatzo-island-v1";

export interface Progress {
  visited: string[];
  skills: string[];
  ach: string[];
  knocked: number;
  hits: number;
  muted: boolean;
}

export const ACHIEVEMENTS = [
  { id: "first", name: "First token", desc: "Pick up a skill token." },
  { id: "allskills", name: "Full stack, literally", desc: "Collect every skill on the island." },
  { id: "tourist", name: "Island hopper", desc: "Visit all nine places." },
  { id: "chaos", name: "Chaos engineering", desc: "Knock over 8 containers at the P1 harbor." },
  { id: "kerning", name: "Kerning issues", desc: "Topple all five HATZO letters." },
  { id: "air", name: "Airtime", desc: "Jump off a ramp and stay airborne for a full second." },
  { id: "dj", name: "Opening set", desc: "Drop the needle at the beach DJ booth." },
  { id: "ace", name: "Ace", desc: "Smack 5 tennis balls with the scooter." },
  { id: "cat", name: "Island cat", desc: "Find the cat who lives past the lighthouse." },
  { id: "night", name: "Night owl", desc: "Switch the island to night." },
] as const;
export type AchId = (typeof ACHIEVEMENTS)[number]["id"];

export function loadProgress(): Progress {
  const empty: Progress = { visited: [], skills: [], ach: [], knocked: 0, hits: 0, muted: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    return empty;
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode: progress just won't persist */
  }
}
