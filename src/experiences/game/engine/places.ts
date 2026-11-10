export type PlaceId =
  | "port"
  | "skills"
  | "oneoff"
  | "p1"
  | "athens"
  | "workshop"
  | "beach"
  | "tennis"
  | "contact";

export interface Place {
  id: PlaceId;
  name: string;
  tagline: string;
  /** district center */
  x: number;
  z: number;
  /** radius of the flattened plaza */
  flat: number;
  /** interactable marker position */
  mx: number;
  mz: number;
  color: string;
  /** optional hand-picked spawn (debug ?spot= and guide teleports) */
  spawn?: [number, number];
}

// x = east, z = south. Island is ~200 m across, centered on the origin.
export const PLACES: Place[] = [
  { id: "port", name: "The Port", tagline: "Arrivals · about Alex", x: 0, z: 66, flat: 18, mx: 9, mz: 60, color: "#f2c14e" },
  { id: "skills", name: "Skill Square", tagline: "Every token on the island", x: 0, z: 26, flat: 12, mx: 4, mz: 20, color: "#2ec4b6" },
  { id: "oneoff", name: "OneOff Atelier", tagline: "Now · the current job", x: -40, z: 10, flat: 14, mx: -40, mz: 18, color: "#ff5a8a" },
  { id: "p1", name: "P1 Container Harbor", tagline: "DevOps · Kubernetes", x: 62, z: 46, flat: 19, mx: 54, mz: 36, color: "#4f8cff", spawn: [47, 24] },
  { id: "athens", name: "Old Athens", tagline: "Where it started", x: -12, z: -28, flat: 14, mx: -12, mz: -20, color: "#e8b04a" },
  { id: "workshop", name: "The Workshop", tagline: "Projects, work & personal", x: 30, z: 2, flat: 14, mx: 30, mz: 10, color: "#ff8a3d" },
  { id: "beach", name: "Beach Club", tagline: "DJ booth · Lino · events", x: -62, z: 50, flat: 15, mx: -60, mz: 42, color: "#c86bff" },
  { id: "tennis", name: "Tennis Club", tagline: "Pure toy", x: 46, z: -38, flat: 17, mx: 34, mz: -30, color: "#b6e05a" },
  { id: "contact", name: "The Lighthouse", tagline: "Say hello", x: -30, z: -66, flat: 9, mx: -24, mz: -62, color: "#ff6b4a" },
];

export const PLACE: Record<PlaceId, Place> = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<PlaceId, Place>;

export const SECRET_CAT = { x: -44, z: -74 };

// Roads as waypoint chains between districts (rendered as Catmull-Rom ribbons).
export const ROADS: [number, number][][] = [
  [[0, 84], [0, 66], [2, 46], [0, 26], [-6, 4], [-12, -14], [-12, -28], [-16, -46], [-24, -58], [-30, -64]],
  [[0, 26], [-18, 18], [-40, 10]],
  [[-40, 10], [-50, 28], [-60, 44]],
  [[0, 26], [16, 12], [30, 2]],
  [[30, 2], [38, -12], [42, -20]],
  [[30, 2], [48, 22], [58, 40]],
  [[0, 66], [24, 66], [44, 56], [58, 46]],
  [[0, 66], [-24, 68], [-44, 60], [-58, 52]],
  [[-12, -28], [12, -32], [28, -33], [36, -32]],
];
