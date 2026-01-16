import type { KAPLAYCtx } from "./types";
import { SIZES, CSS_COLORS } from "./constants";

const T = SIZES.TILE;

/**
 * Create grass background using CSS colors (not tilemap)
 */
export function createGrassField(
  k: KAPLAYCtx,
  width: number,
  height: number
): void {
  for (let x = 0; x < width; x += T) {
    for (let y = 0; y < height; y += T) {
      // Random variation for natural look
      const color = Math.random() > 0.7 ? CSS_COLORS.GRASS_DARK : CSS_COLORS.GRASS;
      k.add([
        k.rect(T, T),
        k.pos(x, y),
        k.color(color[0], color[1], color[2]),
        k.z(-100),
      ]);
    }
  }
}

/**
 * Create a grid of colored floor tiles (CSS-based)
 */
export function createFloorGrid(
  k: KAPLAYCtx,
  startX: number,
  startY: number,
  width: number,
  height: number,
  color: readonly [number, number, number],
  zIndex: number = -10
): void {
  k.add([
    k.rect(width, height),
    k.pos(startX, startY),
    k.color(color[0], color[1], color[2]),
    k.z(zIndex),
  ]);
}

/**
 * Create plaza with stone color
 */
export function createPlaza(
  k: KAPLAYCtx,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  k.add([
    k.rect(w, h),
    k.pos(x, y),
    k.color(CSS_COLORS.PLAZA_STONE[0], CSS_COLORS.PLAZA_STONE[1], CSS_COLORS.PLAZA_STONE[2]),
    k.z(-50),
  ]);
}

/**
 * Create a road segment (CSS-based)
 */
export function createRoadSegment(
  k: KAPLAYCtx,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  k.add([
    k.rect(width, height),
    k.pos(x, y),
    k.color(CSS_COLORS.ROAD[0], CSS_COLORS.ROAD[1], CSS_COLORS.ROAD[2]),
    k.z(-50),
  ]);
}

/**
 * Create horizontal road lane markings (CSS-based)
 */
export function createRoadMarkings(
  k: KAPLAYCtx,
  startX: number,
  y: number,
  endX: number
): void {
  for (let x = startX; x < endX; x += T * 3) {
    k.add([
      k.rect(T * 1.5, 3),
      k.pos(x, y),
      k.color(CSS_COLORS.ROAD_MARKING[0], CSS_COLORS.ROAD_MARKING[1], CSS_COLORS.ROAD_MARKING[2]),
      k.z(-49),
    ]);
  }
}

/**
 * Create vertical road lane markings (CSS-based)
 */
export function createVerticalRoadMarkings(
  k: KAPLAYCtx,
  x: number,
  startY: number,
  endY: number
): void {
  for (let y = startY; y < endY; y += T * 3) {
    k.add([
      k.rect(3, T * 1.5),
      k.pos(x, y),
      k.color(CSS_COLORS.ROAD_MARKING[0], CSS_COLORS.ROAD_MARKING[1], CSS_COLORS.ROAD_MARKING[2]),
      k.z(-45),
    ]);
  }
}

/**
 * Create a path/walkway (CSS-based)
 */
export function createPath(
  k: KAPLAYCtx,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  pathWidth: number = 2
): void {
  const isHorizontal = startY === endY;
  const color = CSS_COLORS.SIDEWALK;
  
  if (isHorizontal) {
    k.add([
      k.rect(endX - startX, pathWidth * T),
      k.pos(startX, startY),
      k.color(color[0], color[1], color[2]),
      k.z(-50),
    ]);
  } else {
    k.add([
      k.rect(pathWidth * T, endY - startY),
      k.pos(startX, startY),
      k.color(color[0], color[1], color[2]),
      k.z(-50),
    ]);
  }
}

/**
 * Create a horizontal wall segment with collision (CSS-based for interiors)
 */
export function createWallSegment(
  k: KAPLAYCtx,
  x: number,
  y: number,
  hasCollision: boolean = true
): void {
  k.add([
    k.rect(T, T),
    k.pos(x, y),
    k.color(60, 50, 70),
    k.outline(1, k.Color.fromArray([40, 35, 50])),
    k.z(0),
  ]);
  
  if (hasCollision) {
    k.add([
      k.rect(T, T),
      k.pos(x, y),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
    ]);
  }
}

/**
 * Create walls around a room (with gap for door at bottom center)
 */
export function createRoomWalls(
  k: KAPLAYCtx,
  offsetX: number,
  offsetY: number,
  roomW: number,
  roomH: number
): void {
  // Top wall
  for (let x = 0; x < roomW; x += T) {
    createWallSegment(k, offsetX + x, offsetY);
  }
  
  // Side walls
  for (let y = 0; y < roomH; y += T) {
    createWallSegment(k, offsetX, offsetY + y);
    createWallSegment(k, offsetX + roomW - T, offsetY + y);
  }
  
  // Bottom wall (with door gap in center)
  for (let x = 0; x < roomW; x += T) {
    const isDoorArea = x >= roomW / 2 - T && x <= roomW / 2;
    if (!isDoorArea) {
      createWallSegment(k, offsetX + x, offsetY + roomH - T);
    }
  }
}

/**
 * Create UI text element (fixed to screen)
 */
export function createUIText(
  k: KAPLAYCtx,
  text: string,
  x: number,
  y: number,
  size: number = 10,
  color: [number, number, number] = [255, 255, 255]
): void {
  k.add([
    k.text(text, { size, font: "gameFont" }),
    k.pos(x, y),
    k.anchor("center"),
    k.color(color[0], color[1], color[2]),
    k.fixed(),
    k.z(1000),
  ]);
}
