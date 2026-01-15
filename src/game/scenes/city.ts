import type { KAPLAYCtx, GameObj, CitySceneData, Position } from "../types";
import { SIZES, PLAZA } from "../constants";
import { createGrassField, createPath, createRoadSegment, createRoadMarkings, createPlaza, createUIText } from "../utils";
import {
  createPlayer,
  setupCamera,
  setupWorldBounds,
  createTree,
  createBench,
  createLampPost,
  createStreetSign,
  createTrafficLight,
  createTrashCan,
  createMailbox,
  createFireHydrant,
  createCar,
  createFountain,
  createBuilding,
  BUILDINGS,
} from "../entities";

const T = SIZES.TILE;

// Decoration positions - easy to modify!
const TREE_POSITIONS: Position[] = [
  { x: 150, y: 100 }, { x: 490, y: 100 },
  { x: 140, y: 200 }, { x: 500, y: 200 },
  { x: 140, y: 280 }, { x: 500, y: 280 },
  { x: 220, y: 380 }, { x: 420, y: 380 },
  { x: 300, y: 440 }, { x: 340, y: 440 },
];

const BENCH_POSITIONS: Position[] = [
  { x: PLAZA.X + 30, y: PLAZA.Y + 30 },
  { x: PLAZA.X + PLAZA.W - 50, y: PLAZA.Y + 30 },
  { x: PLAZA.X + 30, y: PLAZA.Y + PLAZA.H - 40 },
  { x: PLAZA.X + PLAZA.W - 50, y: PLAZA.Y + PLAZA.H - 40 },
];

const LAMP_POST_POSITIONS: Position[] = [
  { x: PLAZA.X - 20, y: PLAZA.Y + 40 },
  { x: PLAZA.X + PLAZA.W + 4, y: PLAZA.Y + 40 },
  { x: PLAZA.X - 20, y: PLAZA.Y + PLAZA.H - 40 },
  { x: PLAZA.X + PLAZA.W + 4, y: PLAZA.Y + PLAZA.H - 40 },
];

const PARKED_CAR_POSITIONS: Position[] = [
  { x: 50, y: PLAZA.Y + PLAZA.H + 8 },
  { x: 180, y: PLAZA.Y + PLAZA.H + 8 },
  { x: 400, y: PLAZA.Y + PLAZA.H + 8 },
  { x: 550, y: PLAZA.Y + PLAZA.H + 8 },
];

// New decorations for richer city
const STREET_SIGN_POSITIONS: Position[] = [
  { x: PLAZA.X - 30, y: PLAZA.Y + PLAZA.H + 36 },
  { x: PLAZA.X + PLAZA.W + 14, y: PLAZA.Y + PLAZA.H + 36 },
];

const TRAFFIC_LIGHT_POSITIONS: Position[] = [
  { x: 130, y: PLAZA.Y + PLAZA.H - 8 },
  { x: 500, y: PLAZA.Y + PLAZA.H - 8 },
];

const TRASH_CAN_POSITIONS: Position[] = [
  { x: PLAZA.X + 60, y: PLAZA.Y - 20 },
  { x: PLAZA.X + PLAZA.W - 76, y: PLAZA.Y - 20 },
  { x: 90, y: 340 },
  { x: 540, y: 340 },
];

const MAILBOX_POSITIONS: Position[] = [
  { x: 90, y: SIZES.WORLD_H / 2 + 50 },
  { x: 530, y: SIZES.WORLD_H / 2 + 50 },
];

const FIRE_HYDRANT_POSITIONS: Position[] = [
  { x: 170, y: PLAZA.Y + PLAZA.H + 36 },
  { x: 460, y: PLAZA.Y + PLAZA.H + 36 },
];

/**
 * Setup the city scene
 */
export function setupCityScene(k: KAPLAYCtx): void {
  k.scene("city", (startPos?: CitySceneData) => {
    const { WORLD_W, WORLD_H } = SIZES;

    // === 1. Ground Layers (CSS-based) ===
    createGrassField(k, WORLD_W, WORLD_H);

    // Main plaza (stone)
    createPlaza(k, PLAZA.X, PLAZA.Y, PLAZA.W, PLAZA.H);

    // Horizontal road
    createRoadSegment(k, 0, PLAZA.Y + PLAZA.H, WORLD_W, T * 2);
    createRoadMarkings(k, 0, PLAZA.Y + PLAZA.H + T - 1, WORLD_W);

    // Paths to buildings
    createPath(k, WORLD_W / 2 - T, 80, WORLD_W / 2 + T, PLAZA.Y, 2);
    createPath(k, 80, WORLD_H / 2 - T, PLAZA.X, WORLD_H / 2 + T, 2);
    createPath(k, PLAZA.X + PLAZA.W, WORLD_H / 2 - T, 560, WORLD_H / 2 + T, 2);

    // === 2. Buildings ===
    BUILDINGS.forEach((b) => createBuilding(k, b));

    // === 3. Decorations - Nature (tilemap trees) ===
    TREE_POSITIONS.forEach(({ x, y }, i) => createTree(k, x, y, i));

    // === 4. Decorations - Street Furniture (CSS-based) ===
    BENCH_POSITIONS.forEach(({ x, y }) => createBench(k, x, y));
    LAMP_POST_POSITIONS.forEach(({ x, y }) => createLampPost(k, x, y));
    STREET_SIGN_POSITIONS.forEach(({ x, y }) => createStreetSign(k, x, y));
    TRAFFIC_LIGHT_POSITIONS.forEach(({ x, y }) => createTrafficLight(k, x, y));
    TRASH_CAN_POSITIONS.forEach(({ x, y }) => createTrashCan(k, x, y));
    MAILBOX_POSITIONS.forEach(({ x, y }) => createMailbox(k, x, y));
    FIRE_HYDRANT_POSITIONS.forEach(({ x, y }) => createFireHydrant(k, x, y));

    // === 5. Vehicles (CSS-based) ===
    const carTypes: Array<"red" | "yellow" | "green" | "blue"> = ["red", "yellow", "green", "blue"];
    PARKED_CAR_POSITIONS.forEach(({ x, y }, i) => createCar(k, x, y, carTypes[i % carTypes.length]));

    // === 6. Fountain in center of plaza ===
    createFountain(k, WORLD_W / 2, PLAZA.Y + PLAZA.H / 2);

    // === 7. Player ===
    const spawnX = startPos?.x ?? WORLD_W / 2;
    const spawnY = startPos?.y ?? PLAZA.Y + PLAZA.H / 2 + 50;
    const spawnDir = startPos?.dir ?? "down";
    const player = createPlayer(k, spawnX, spawnY, spawnDir);

    // === 8. Camera & Bounds ===
    setupCamera(k, player, WORLD_W, WORLD_H);
    setupWorldBounds(k, player, 16, 16, WORLD_W - 16, WORLD_H - 16);

    // === 9. Door Collision - Enter Buildings ===
    player.onCollide("door", (door: GameObj) => {
      k.go(door.section, { returnPos: door.doorPos });
    });

    // === 10. UI ===
    createUIText(k, "Welcome to my Portfolio!", k.width() / 2, 10, 10);
    createUIText(k, "Walk into building doors to explore", k.width() / 2, k.height() - 10, 8, [220, 220, 220]);
  });
}
