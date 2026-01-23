import type { KAPLAYCtx, BuildingConfig, SectionType } from "../types";
import { COLORS, SIZES, BUILDING } from "../constants";
import { getBuildingLabel } from "../content";

const T = SIZES.TILE;

// Building configurations for the city (labels come from portfolio.json via getBuildingLabel)
export const BUILDINGS: Omit<BuildingConfig, "label">[] = [
  {
    // About Me - cozy house at top center
    x: SIZES.WORLD_W / 2 - 36,
    y: 30,
    w: 72,
    h: 48,
    section: "about",
    color: COLORS.ABOUT,
    doorSide: "bottom",
  },
  {
    // Projects - tall skyscraper on left
    x: 16,
    y: SIZES.WORLD_H / 2 - 55,
    w: 56,
    h: 110,
    section: "projects",
    color: COLORS.PROJECTS,
    doorSide: "bottom",
  },
  {
    // Skills - tall skyscraper on right
    x: 568,
    y: SIZES.WORLD_H / 2 - 55,
    w: 56,
    h: 110,
    section: "skills",
    color: COLORS.SKILLS,
    doorSide: "bottom",
  },
  {
    // Experience - medium office building bottom-left
    x: 100,
    y: 390,
    w: 72,
    h: 64,
    section: "experience",
    color: COLORS.EXPERIENCE,
    doorSide: "bottom",
  },
  {
    // Contact - small house bottom-right
    x: 468,
    y: 400,
    w: 64,
    h: 44,
    section: "contact",
    color: COLORS.CONTACT,
    doorSide: "bottom",
  },
];

// Determine building style based on section
type BuildingStyle = "house" | "skyscraper";
function getBuildingStyle(section: SectionType): BuildingStyle {
  // Houses for personal sections, skyscrapers for work/professional
  if (section === "about" || section === "contact") {
    return "house";
  }
  return "skyscraper";
}

/**
 * Create a building with doors, windows, and collision zones
 * Style varies based on section type (house vs skyscraper)
 */
export function createBuilding(k: KAPLAYCtx, config: Omit<BuildingConfig, "label">): void {
  const { x, y, w, h, section, color, doorSide } = config;
  const label = getBuildingLabel(section);
  const style = getBuildingStyle(section);

  // Color helpers
  const darken = (c: readonly [number, number, number], amount: number): [number, number, number] => [
    Math.max(0, c[0] - amount),
    Math.max(0, c[1] - amount),
    Math.max(0, c[2] - amount),
  ];
  const lighten = (c: readonly [number, number, number], amount: number): [number, number, number] => [
    Math.min(255, c[0] + amount),
    Math.min(255, c[1] + amount),
    Math.min(255, c[2] + amount),
  ];

  // === DOOR POSITION CALCULATION (same for both styles) ===
  const doorW = BUILDING.DOOR_WIDTH;
  const doorH = BUILDING.DOOR_HEIGHT;
  let doorX: number, doorY: number;
  let doorCollisionX: number, doorCollisionY: number;
  let doorCollisionW: number, doorCollisionH: number;
  let returnPosX: number, returnPosY: number;

  switch (doorSide) {
    case "bottom":
      doorX = x + w / 2 - doorW / 2;
      doorY = y + h - doorH;
      doorCollisionX = doorX - 3;
      doorCollisionY = doorY + doorH;
      doorCollisionW = 20;
      doorCollisionH = 8;
      returnPosX = x + w / 2;
      returnPosY = y + h + 40;
      break;
    case "top":
      doorX = x + w / 2 - doorW / 2;
      doorY = y;
      doorCollisionX = doorX - 3;
      doorCollisionY = y - 8;
      doorCollisionW = 20;
      doorCollisionH = 8;
      returnPosX = x + w / 2;
      returnPosY = y - 40;
      break;
    case "left":
      doorX = x;
      doorY = y + h / 2 - doorH / 2;
      doorCollisionX = x - 8;
      doorCollisionY = doorY - 1;
      doorCollisionW = 8;
      doorCollisionH = 20;
      returnPosX = x - 40;
      returnPosY = y + h / 2;
      break;
    case "right":
      doorX = x + w - doorW;
      doorY = y + h / 2 - doorH / 2;
      doorCollisionX = x + w;
      doorCollisionY = doorY - 1;
      doorCollisionW = 8;
      doorCollisionH = 20;
      returnPosX = x + w + 40;
      returnPosY = y + h / 2;
      break;
  }

  if (style === "house") {
    createHouse(k, x, y, w, h, color, doorSide, doorX, doorY, doorW, doorH, darken, lighten);
  } else {
    createSkyscraper(k, x, y, w, h, color, doorSide, doorX, doorY, doorW, doorH, darken);
  }

  // === LABEL (always at top for visibility) ===
  k.add([
    k.text(label, { size: 8, font: "gameFont" }),
    k.pos(x + w / 2, y - 24),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(1000),
  ]);

  // === DOOR COLLISION ZONE (teleports to interior) ===
  k.add([
    k.rect(doorCollisionW, doorCollisionH),
    k.pos(doorCollisionX, doorCollisionY),
    k.area(),
    k.opacity(0),
    "door",
    { section, doorPos: { x: returnPosX, y: returnPosY } },
  ]);

  // === BUILDING COLLISION (walls - prevents walking through) ===
  if (doorSide === "bottom") {
    k.add([
      k.rect(w, h - 14),
      k.pos(x, y),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
  } else if (doorSide === "top") {
    k.add([
      k.rect(w, h - 14),
      k.pos(x, y + 14),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
  } else if (doorSide === "left") {
    k.add([
      k.rect(w - 14, h),
      k.pos(x + 14, y),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
  } else if (doorSide === "right") {
    k.add([
      k.rect(w - 14, h),
      k.pos(x, y),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
  }
}

/**
 * Create a cozy house with pitched roof and chimney
 */
function createHouse(
  k: KAPLAYCtx,
  x: number, y: number, w: number, h: number,
  color: readonly [number, number, number],
  doorSide: string,
  doorX: number, doorY: number, doorW: number, doorH: number,
  darken: (c: readonly [number, number, number], amt: number) => [number, number, number],
  lighten: (c: readonly [number, number, number], amt: number) => [number, number, number]
): void {
  const roofHeight = BUILDING.ROOF_HEIGHT;
  const roofColor: [number, number, number] = [139, 90, 43]; // Brown roof

  // === 3D DEPTH ===
  k.add([
    k.rect(4, h),
    k.pos(x + w, y + 2),
    k.color(...darken(color, 50)),
    k.z(0),
  ]);

  // === HOUSE BODY ===
  k.add([
    k.rect(w, h),
    k.pos(x, y),
    k.color(color[0], color[1], color[2]),
    k.outline(2, k.Color.fromArray([50, 40, 30])),
    k.z(1),
  ]);

  // === PITCHED ROOF (triangular, wide at bottom, narrow at top) ===
  // Roof eave (horizontal bar at top of building walls - widest part)
  k.add([
    k.rect(w + 10, 4),
    k.pos(x - 5, y - 4),
    k.color(...darken(roofColor, 10)),
    k.z(2),
  ]);
  // Roof body (stacked rectangles getting smaller going UP to form peak)
  const roofLayers = 5;
  for (let i = 0; i < roofLayers; i++) {
    // Layer 0 is at bottom (widest), layer 4 is at top (narrowest)
    const layerWidth = w + 8 - (i * (w + 8) / roofLayers);
    const layerHeight = roofHeight / roofLayers;
    // Position: bottom layers are closer to building (higher y), top layers are further up (lower y)
    const layerY = y - 4 - (i + 1) * layerHeight;
    const layerX = x - 4 + (i * (w + 8) / roofLayers / 2);
    k.add([
      k.rect(layerWidth, layerHeight),
      k.pos(layerX, layerY),
      k.color(...darken(roofColor, (roofLayers - i) * 6)),
      k.z(2),
    ]);
  }
  // Roof peak highlight (at the very top)
  k.add([
    k.rect(10, 3),
    k.pos(x + w / 2 - 5, y - 4 - roofHeight - 2),
    k.color(...lighten(roofColor, 20)),
    k.z(3),
  ]);

  // === DOOR ===
  k.add([
    k.rect(doorW, doorH),
    k.pos(doorX, doorY),
    k.color(100, 60, 40),
    k.outline(2, k.Color.fromArray([60, 35, 20])),
    k.z(2),
  ]);
  // Door frame
  k.add([
    k.rect(doorW + 4, 3),
    k.pos(doorX - 2, doorY - 2),
    k.color(80, 50, 30),
    k.z(3),
  ]);
  // Door handle
  k.add([
    k.circle(2),
    k.pos(doorX + doorW - 4, doorY + doorH / 2),
    k.color(200, 170, 80),
    k.z(3),
  ]);

  // === WINDOWS (cozy style with shutters) ===
  const windowPositions = getHouseWindowPositions(x, y, w, h, doorX, doorY, doorW, doorH, doorSide);
  windowPositions.forEach(({ wx, wy }) => {
    // Window
    k.add([
      k.rect(12, 14),
      k.pos(wx, wy),
      k.color(200, 220, 240),
      k.outline(2, k.Color.fromArray([60, 45, 35])),
      k.z(2),
    ]);
    // Window cross
    k.add([
      k.rect(12, 2),
      k.pos(wx, wy + 6),
      k.color(80, 60, 45),
      k.z(3),
    ]);
    k.add([
      k.rect(2, 14),
      k.pos(wx + 5, wy),
      k.color(80, 60, 45),
      k.z(3),
    ]);
    // Shutters
    k.add([
      k.rect(4, 14),
      k.pos(wx - 5, wy),
      k.color(...lighten(color, 20)),
      k.outline(1, k.Color.fromArray([50, 40, 30])),
      k.z(2),
    ]);
    k.add([
      k.rect(4, 14),
      k.pos(wx + 13, wy),
      k.color(...lighten(color, 20)),
      k.outline(1, k.Color.fromArray([50, 40, 30])),
      k.z(2),
    ]);
  });

  // === WELCOME MAT ===
  if (doorSide === "bottom") {
    k.add([
      k.rect(doorW + 6, 4),
      k.pos(doorX - 3, doorY + doorH),
      k.color(120, 90, 60),
      k.z(0),
    ]);
  } else if (doorSide === "top") {
    k.add([
      k.rect(doorW + 6, 4),
      k.pos(doorX - 3, doorY - 4),
      k.color(120, 90, 60),
      k.z(0),
    ]);
  }
}

/**
 * Create a modern skyscraper with glass windows
 */
function createSkyscraper(
  k: KAPLAYCtx,
  x: number, y: number, w: number, h: number,
  color: readonly [number, number, number],
  doorSide: string,
  doorX: number, doorY: number, doorW: number, doorH: number,
  darken: (c: readonly [number, number, number], amt: number) => [number, number, number]
): void {
  // === 3D DEPTH ===
  k.add([
    k.rect(5, h),
    k.pos(x + w, y + 3),
    k.color(...darken(color, 70)),
    k.z(0),
  ]);
  k.add([
    k.rect(w, 5),
    k.pos(x + 3, y + h),
    k.color(...darken(color, 90)),
    k.z(0),
  ]);

  // === BUILDING BODY ===
  k.add([
    k.rect(w, h),
    k.pos(x, y),
    k.color(color[0], color[1], color[2]),
    k.outline(2, k.Color.fromArray([40, 40, 50])),
    k.z(1),
  ]);

  // === FLAT ROOF ===
  // Main roof edge
  k.add([
    k.rect(w + 6, 4),
    k.pos(x - 3, y - 4),
    k.color(60, 60, 70),
    k.z(2),
  ]);
  // Subtle depth shadow at roof line
  k.add([
    k.rect(w, 2),
    k.pos(x, y),
    k.color(...darken(color, 30)),
    k.z(2),
  ]);

  // === GLASS DOOR (revolving style) ===
  // Door frame
  k.add([
    k.rect(doorW + 6, doorH + 4),
    k.pos(doorX - 3, doorY - 2),
    k.color(50, 55, 60),
    k.z(2),
  ]);
  // Glass door
  k.add([
    k.rect(doorW, doorH),
    k.pos(doorX, doorY),
    k.color(150, 180, 200),
    k.opacity(0.8),
    k.outline(1, k.Color.fromArray([80, 100, 120])),
    k.z(3),
  ]);
  // Door divider (glass panels)
  k.add([
    k.rect(2, doorH),
    k.pos(doorX + doorW / 2 - 1, doorY),
    k.color(70, 80, 90),
    k.z(4),
  ]);

  // === GRID OF WINDOWS ===
  const winW = 8;
  const winH = 10;
  const winSpaceX = 12;
  const winSpaceY = 14;
  const startX = x + 6;
  const startY = y + 6;

  for (let wy = startY; wy + winH < y + h - 8; wy += winSpaceY) {
    for (let wx = startX; wx + winW < x + w - 6; wx += winSpaceX) {
      // Skip if overlaps door
      if (wx + winW > doorX - 2 && wx < doorX + doorW + 2 &&
          wy + winH > doorY - 2 && wy < doorY + doorH + 2) {
        continue;
      }
      
      // Window (blue glass)
      k.add([
        k.rect(winW, winH),
        k.pos(wx, wy),
        k.color(140, 170, 200),
        k.outline(1, k.Color.fromArray([60, 70, 80])),
        k.z(2),
      ]);
      // Window glare effect
      k.add([
        k.rect(2, winH - 2),
        k.pos(wx + 1, wy + 1),
        k.color(180, 200, 220),
        k.opacity(0.5),
        k.z(3),
      ]);
    }
  }

  // === ENTRANCE CANOPY (for horizontal doors) ===
  if (doorSide === "bottom" || doorSide === "top") {
    const canopyY = doorSide === "bottom" ? doorY - 6 : doorY + doorH + 2;
    k.add([
      k.rect(doorW + 16, 4),
      k.pos(doorX - 8, canopyY),
      k.color(50, 55, 60),
      k.z(4),
    ]);
    // Canopy supports
    k.add([
      k.rect(2, 4),
      k.pos(doorX - 6, canopyY),
      k.color(70, 75, 80),
      k.z(3),
    ]);
    k.add([
      k.rect(2, 4),
      k.pos(doorX + doorW + 4, canopyY),
      k.color(70, 75, 80),
      k.z(3),
    ]);
  }
}

/**
 * Calculate window positions for house, avoiding door area
 */
function getHouseWindowPositions(
  x: number, y: number, w: number, h: number,
  _doorX: number, _doorY: number, _doorW: number, _doorH: number,
  doorSide: string
): Array<{ wx: number; wy: number }> {
  const positions: Array<{ wx: number; wy: number }> = [];
  
  // Two windows for houses, positioned based on door location
  if (doorSide === "bottom" || doorSide === "top") {
    // Windows on left and right of door
    positions.push({ wx: x + 10, wy: y + 12 });
    positions.push({ wx: x + w - 24, wy: y + 12 });
  } else if (doorSide === "left") {
    // Windows on right side, stacked
    positions.push({ wx: x + w - 24, wy: y + 10 });
    positions.push({ wx: x + w - 24, wy: y + h - 28 });
  } else if (doorSide === "right") {
    // Windows on left side, stacked
    positions.push({ wx: x + 10, wy: y + 10 });
    positions.push({ wx: x + 10, wy: y + h - 28 });
  }
  
  return positions;
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
