import type { KAPLAYCtx } from "../types";
import { TILES, CSS_COLORS } from "../constants";

// Tree configurations: [topTile, bottomTile] - only using verified working pairs
const TREE_TYPES: Array<[number, number]> = [
  [TILES.ROUND_TOP, TILES.ROUND_BOTTOM],       // Green tree (233 + 260) - WORKS
  [TILES.AUTUMN_TOP, TILES.AUTUMN_BOTTOM],     // Autumn orange tree (313 + 340) - WORKS
];

/**
 * Create a two-tile tree using tilemap (top + bottom stacked)
 */
export function createTree(k: KAPLAYCtx, x: number, y: number, variant: number = 0): void {
  const [topTile, bottomTile] = TREE_TYPES[variant % TREE_TYPES.length];
  const T = 16; // tile size
  
  // Top half (canopy)
  k.add([
    k.sprite("tiles", { frame: topTile }),
    k.pos(x - 8, y - 8 - T), // positioned above the bottom
    k.z(y),
  ]);
  
  // Bottom half (trunk)
  k.add([
    k.sprite("tiles", { frame: bottomTile }),
    k.pos(x - 8, y - 8),
    k.z(y + 1), // slightly in front
  ]);
  
  // Collision at base of tree
  k.add([
    k.circle(6),
    k.pos(x, y + 4),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a bench using CSS (more reliable than tilemap)
 */
export function createBench(k: KAPLAYCtx, x: number, y: number): void {
  const wood = CSS_COLORS.BENCH_WOOD;
  // Bench seat
  k.add([
    k.rect(20, 6),
    k.pos(x, y),
    k.color(wood[0], wood[1], wood[2]),
    k.outline(1, k.Color.fromArray([80, 50, 30])),
    k.z(y + 8),
  ]);
  // Bench legs
  k.add([
    k.rect(3, 4),
    k.pos(x + 2, y + 6),
    k.color(60, 40, 25),
    k.z(y + 8),
  ]);
  k.add([
    k.rect(3, 4),
    k.pos(x + 15, y + 6),
    k.color(60, 40, 25),
    k.z(y + 8),
  ]);
  // Collision
  k.add([
    k.rect(20, 10),
    k.pos(x, y),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a lamp post using CSS
 */
export function createLampPost(k: KAPLAYCtx, x: number, y: number): void {
  const post = CSS_COLORS.LAMP_POST;
  const light = CSS_COLORS.LAMP_LIGHT;
  // Post
  k.add([
    k.rect(4, 20),
    k.pos(x + 6, y),
    k.color(post[0], post[1], post[2]),
    k.z(y + 16),
  ]);
  // Light fixture
  k.add([
    k.circle(5),
    k.pos(x + 8, y - 2),
    k.color(light[0], light[1], light[2]),
    k.z(y + 17),
  ]);
  // Collision
  k.add([
    k.circle(4),
    k.pos(x + 8, y + 12),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a street sign using CSS
 */
export function createStreetSign(k: KAPLAYCtx, x: number, y: number): void {
  // Post
  k.add([
    k.rect(3, 16),
    k.pos(x + 6, y + 4),
    k.color(80, 80, 90),
    k.z(y + 16),
  ]);
  // Sign
  k.add([
    k.rect(14, 10),
    k.pos(x + 1, y - 4),
    k.color(40, 100, 40),
    k.outline(1, k.Color.fromArray([255, 255, 255])),
    k.z(y + 17),
  ]);
  // Collision
  k.add([
    k.circle(3),
    k.pos(x + 8, y + 14),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a traffic light using CSS
 */
export function createTrafficLight(k: KAPLAYCtx, x: number, y: number): void {
  // Post
  k.add([
    k.rect(4, 24),
    k.pos(x + 6, y),
    k.color(50, 50, 55),
    k.z(y + 16),
  ]);
  // Light box
  k.add([
    k.rect(8, 16),
    k.pos(x + 4, y - 14),
    k.color(30, 30, 35),
    k.outline(1, k.Color.fromArray([20, 20, 25])),
    k.z(y + 17),
  ]);
  // Lights (red, yellow, green)
  k.add([k.circle(2), k.pos(x + 8, y - 10), k.color(200, 60, 60), k.z(y + 18)]);
  k.add([k.circle(2), k.pos(x + 8, y - 6), k.color(200, 180, 60), k.z(y + 18)]);
  k.add([k.circle(2), k.pos(x + 8, y - 2), k.color(60, 180, 60), k.z(y + 18)]);
  // Collision
  k.add([
    k.circle(4),
    k.pos(x + 8, y + 16),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a trash can using CSS
 */
export function createTrashCan(k: KAPLAYCtx, x: number, y: number): void {
  // Can body
  k.add([
    k.rect(10, 12),
    k.pos(x + 3, y + 2),
    k.color(70, 80, 70),
    k.outline(1, k.Color.fromArray([50, 60, 50])),
    k.z(y + 8),
  ]);
  // Lid
  k.add([
    k.rect(12, 3),
    k.pos(x + 2, y),
    k.color(60, 70, 60),
    k.z(y + 9),
  ]);
  // Collision
  k.add([
    k.circle(5),
    k.pos(x + 8, y + 8),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a mailbox using CSS
 */
export function createMailbox(k: KAPLAYCtx, x: number, y: number): void {
  // Post
  k.add([
    k.rect(3, 10),
    k.pos(x + 6, y + 6),
    k.color(80, 60, 40),
    k.z(y + 8),
  ]);
  // Box
  k.add([
    k.rect(12, 8),
    k.pos(x + 2, y),
    k.color(60, 80, 140),
    k.outline(1, k.Color.fromArray([40, 60, 120])),
    k.z(y + 9),
  ]);
  // Collision
  k.add([
    k.circle(5),
    k.pos(x + 8, y + 10),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a fire hydrant using CSS
 */
export function createFireHydrant(k: KAPLAYCtx, x: number, y: number): void {
  // Body
  k.add([
    k.rect(8, 10),
    k.pos(x + 4, y + 4),
    k.color(180, 50, 50),
    k.outline(1, k.Color.fromArray([140, 40, 40])),
    k.z(y + 8),
  ]);
  // Top
  k.add([
    k.rect(6, 4),
    k.pos(x + 5, y + 1),
    k.color(160, 45, 45),
    k.z(y + 9),
  ]);
  // Collision
  k.add([
    k.circle(4),
    k.pos(x + 8, y + 10),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a parked car using CSS
 */
export function createCar(
  k: KAPLAYCtx,
  x: number,
  y: number,
  type: "blue" | "red" | "yellow" | "green" = "red"
): void {
  const colors: Record<string, readonly [number, number, number]> = {
    red: CSS_COLORS.CAR_RED,
    blue: CSS_COLORS.CAR_BLUE,
    yellow: CSS_COLORS.CAR_YELLOW,
    green: [60, 140, 80],
  };
  const color = colors[type];
  
  // Car body
  k.add([
    k.rect(24, 14),
    k.pos(x, y),
    k.color(color[0], color[1], color[2]),
    k.outline(1, k.Color.fromArray([color[0] - 30, color[1] - 30, color[2] - 30])),
    k.z(y + 8),
  ]);
  // Windows
  k.add([
    k.rect(8, 6),
    k.pos(x + 4, y + 2),
    k.color(150, 180, 200),
    k.z(y + 9),
  ]);
  k.add([
    k.rect(8, 6),
    k.pos(x + 12, y + 2),
    k.color(150, 180, 200),
    k.z(y + 9),
  ]);
  // Wheels
  k.add([k.circle(3), k.pos(x + 5, y + 14), k.color(30, 30, 30), k.z(y + 7)]);
  k.add([k.circle(3), k.pos(x + 19, y + 14), k.color(30, 30, 30), k.z(y + 7)]);
  // Collision
  k.add([
    k.rect(24, 14),
    k.pos(x, y),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a fountain using CSS
 */
export function createFountain(k: KAPLAYCtx, x: number, y: number): void {
  const water = CSS_COLORS.FOUNTAIN_WATER;
  const edge = CSS_COLORS.FOUNTAIN_EDGE;
  // Outer ring
  k.add([
    k.circle(24),
    k.pos(x, y),
    k.color(edge[0], edge[1], edge[2]),
    k.outline(3, k.Color.fromArray([60, 60, 70])),
    k.z(50),
  ]);
  // Water
  k.add([
    k.circle(18),
    k.pos(x, y),
    k.color(water[0], water[1], water[2]),
    k.z(51),
  ]);
  // Center spout
  k.add([
    k.circle(6),
    k.pos(x, y),
    k.color(water[0] + 30, water[1] + 30, water[2] + 30),
    k.z(52),
  ]);
  // Collision
  k.add([
    k.circle(26),
    k.pos(x, y),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}

/**
 * Create a plant/potted plant using CSS
 */
export function createPlant(k: KAPLAYCtx, x: number, y: number): void {
  // Pot
  k.add([
    k.rect(10, 8),
    k.pos(x + 3, y + 6),
    k.color(160, 100, 70),
    k.z(50),
  ]);
  // Plant
  k.add([
    k.circle(6),
    k.pos(x + 8, y + 4),
    k.color(80, 140, 60),
    k.z(51),
  ]);
  // Collision
  k.add([
    k.circle(6),
    k.pos(x + 8, y + 8),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
  ]);
}
