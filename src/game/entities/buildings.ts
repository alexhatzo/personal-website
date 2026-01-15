import type { KAPLAYCtx, BuildingConfig, SectionType } from "../types";
import { COLORS, SIZES } from "../constants";

const T = SIZES.TILE;

// Building configurations for the city
export const BUILDINGS: BuildingConfig[] = [
  {
    x: SIZES.WORLD_W / 2 - 40,
    y: 20,
    w: 80,
    h: 56,
    section: "about",
    label: "ABOUT ME",
    color: COLORS.ABOUT,
  },
  {
    x: 16,
    y: SIZES.WORLD_H / 2 - 40,
    w: 64,
    h: 80,
    section: "projects",
    label: "PROJECTS",
    color: COLORS.PROJECTS,
  },
  {
    x: 560,
    y: SIZES.WORLD_H / 2 - 40,
    w: 64,
    h: 80,
    section: "skills",
    label: "SKILLS",
    color: COLORS.SKILLS,
  },
  {
    x: 100,
    y: 380,
    w: 80,
    h: 56,
    section: "experience",
    label: "EXPERIENCE",
    color: COLORS.EXPERIENCE,
  },
  {
    x: 460,
    y: 380,
    w: 80,
    h: 56,
    section: "contact",
    label: "CONTACT",
    color: COLORS.CONTACT,
  },
];

/**
 * Create a building with doors, windows, and collision zones
 */
export function createBuilding(k: KAPLAYCtx, config: BuildingConfig): void {
  const { x, y, w, h, section, label, color } = config;

  // Building shadow
  k.add([
    k.rect(w, h),
    k.pos(x + 3, y + 3),
    k.color(0, 0, 0),
    k.opacity(0.3),
    k.z(0),
  ]);

  // Building body
  k.add([
    k.rect(w, h),
    k.pos(x, y),
    k.color(color[0], color[1], color[2]),
    k.outline(2, k.Color.fromArray([30, 30, 30])),
    k.z(1),
  ]);

  // Roof
  k.add([
    k.rect(w + 8, 5),
    k.pos(x - 4, y - 3),
    k.color(50, 50, 50),
    k.z(2),
  ]);

  // Door
  const doorX = x + w / 2 - 8;
  const doorY = y + h - 16;
  k.add([
    k.rect(16, 16),
    k.pos(doorX, doorY),
    k.color(80, 50, 30),
    k.outline(1, k.Color.fromArray([40, 25, 15])),
    k.z(2),
  ]);

  // Windows
  const winCols = Math.floor((w - 24) / 20);
  const winRows = Math.floor((h - 24) / 20);
  for (let r = 0; r < winRows; r++) {
    for (let c = 0; c < winCols; c++) {
      k.add([
        k.rect(10, 10),
        k.pos(x + 10 + c * 20, y + 8 + r * 20),
        k.color(180, 200, 230),
        k.outline(1, k.Color.fromArray([30, 30, 30])),
        k.z(2),
      ]);
    }
  }

  // Label
  k.add([
    k.text(label, { size: 8 }),
    k.pos(x + w / 2, y - 10),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(10),
  ]);

  // Door collision zone - teleports to interior
  k.add([
    k.rect(20, 8),
    k.pos(doorX - 2, doorY + 16),
    k.area(),
    k.opacity(0),
    "door",
    { section, doorPos: { x: x + w / 2, y: y + h + 24 } },
  ]);

  // Building collision (walls - prevents walking through)
  k.add([
    k.rect(w, h - 12),
    k.pos(x, y),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

// Interior floor colors
const FLOOR_COLORS: Record<SectionType, readonly [number, number, number]> = {
  about: [180, 120, 100],     // Warm brown
  projects: [120, 160, 120],  // Soft green
  skills: [120, 140, 180],    // Soft blue
  experience: [180, 160, 120],// Tan
  contact: [160, 130, 170],   // Soft purple
};

/**
 * Get floor color for a section
 */
export function getFloorColor(section: SectionType): readonly [number, number, number] {
  return FLOOR_COLORS[section];
}

/**
 * Create interior furniture based on room type (CSS-based)
 */
export function createInteriorFurniture(
  k: KAPLAYCtx,
  section: SectionType,
  offsetX: number,
  offsetY: number,
  roomW: number
): void {
  if (section === "about" || section === "contact") {
    // Desk
    k.add([
      k.rect(T * 2, T),
      k.pos(offsetX + roomW - T * 4, offsetY + T * 2),
      k.color(120, 80, 50),
      k.outline(1, k.Color.fromArray([80, 50, 30])),
      k.z(50),
    ]);
    k.add([
      k.rect(T * 2, T),
      k.pos(offsetX + roomW - T * 4, offsetY + T * 2),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
    
    // Chair
    k.add([
      k.rect(T, T),
      k.pos(offsetX + roomW - T * 3.5, offsetY + T * 3 + 4),
      k.color(80, 60, 40),
      k.z(50),
    ]);
    
    // Plant
    k.add([
      k.rect(10, 8),
      k.pos(offsetX + T * 2 + 3, offsetY + T * 2 + 6),
      k.color(160, 100, 70),
      k.z(50),
    ]);
    k.add([
      k.circle(6),
      k.pos(offsetX + T * 2 + 8, offsetY + T * 2 + 4),
      k.color(80, 140, 60),
      k.z(51),
    ]);
    k.add([
      k.circle(6),
      k.pos(offsetX + T * 2 + 8, offsetY + T * 2 + 8),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
  } else if (section === "projects" || section === "skills") {
    // Bookshelf
    k.add([
      k.rect(T, T * 2),
      k.pos(offsetX + T * 2, offsetY + T + 4),
      k.color(100, 70, 45),
      k.outline(1, k.Color.fromArray([70, 50, 30])),
      k.z(50),
    ]);
    // Books
    k.add([k.rect(4, 6), k.pos(offsetX + T * 2 + 2, offsetY + T + 8), k.color(180, 60, 60), k.z(51)]);
    k.add([k.rect(4, 6), k.pos(offsetX + T * 2 + 7, offsetY + T + 8), k.color(60, 120, 180), k.z(51)]);
    k.add([k.rect(4, 6), k.pos(offsetX + T * 2 + 2, offsetY + T + 20), k.color(60, 160, 80), k.z(51)]);
    k.add([
      k.rect(T, T * 2),
      k.pos(offsetX + T * 2, offsetY + T),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
    
    // Computer desk
    k.add([
      k.rect(T * 2, T),
      k.pos(offsetX + roomW - T * 4, offsetY + T * 2),
      k.color(80, 80, 90),
      k.outline(1, k.Color.fromArray([50, 50, 60])),
      k.z(50),
    ]);
    // Monitor
    k.add([
      k.rect(12, 10),
      k.pos(offsetX + roomW - T * 3.5, offsetY + T * 1.5),
      k.color(40, 40, 45),
      k.z(51),
    ]);
    k.add([
      k.rect(10, 8),
      k.pos(offsetX + roomW - T * 3.5 + 1, offsetY + T * 1.5 + 1),
      k.color(100, 150, 200),
      k.z(52),
    ]);
    k.add([
      k.rect(T * 2, T),
      k.pos(offsetX + roomW - T * 4, offsetY + T * 2),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
  } else {
    // Couch (experience section)
    k.add([
      k.rect(T * 2.5, T),
      k.pos(offsetX + T * 2, offsetY + T * 2),
      k.color(100, 80, 120),
      k.outline(1, k.Color.fromArray([70, 50, 90])),
      k.z(50),
    ]);
    // Cushions
    k.add([k.rect(10, 6), k.pos(offsetX + T * 2 + 4, offsetY + T * 2 + 2), k.color(120, 100, 140), k.z(51)]);
    k.add([k.rect(10, 6), k.pos(offsetX + T * 2 + 18, offsetY + T * 2 + 2), k.color(120, 100, 140), k.z(51)]);
    k.add([
      k.rect(T * 2.5, T),
      k.pos(offsetX + T * 2, offsetY + T * 2),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
  }
}
