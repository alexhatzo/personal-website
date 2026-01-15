import type { KAPLAYCtx, GameObj, SectionType, InteriorSceneData } from "../types";
import { SIZES } from "../constants";
import { createFloorGrid, createRoomWalls, createUIText } from "../utils";
import {
  createPlayer,
  setupWorldBounds,
  getFloorColor,
  createInteriorFurniture,
  createCreature,
  findNearestCreature,
  throwPokeball,
  createCaptureEffect,
  MUSHROOM_SPRITES,
} from "../entities";
import { BUILDING_CONTENT } from "../content";
import type { CreatureConfig } from "../entities";

const T = SIZES.TILE;
const { ROOM_W, ROOM_H } = SIZES;

// Experience building creatures configuration
const EXPERIENCE_CREATURES: CreatureConfig[] = [
  { id: "job-0", sprite: MUSHROOM_SPRITES[0], label: "Senior Dev", x: 0, y: 0 },
  { id: "job-1", sprite: MUSHROOM_SPRITES[1], label: "Engineer", x: 0, y: 0 },
  { id: "job-2", sprite: MUSHROOM_SPRITES[2], label: "Junior", x: 0, y: 0 },
];

// Store onCapture callback at module level so it can be set from GameCanvas
let captureCallback: ((id: string) => void) | null = null;

/**
 * Set the capture callback from outside
 */
export function setOnCaptureCallback(callback: (id: string) => void): void {
  captureCallback = callback;
}

/**
 * Create the standard content board for non-experience sections
 */
function createContentBoard(
  k: KAPLAYCtx,
  content: { title: string; lines: string[] },
  offsetX: number,
  offsetY: number
): void {
  // Content Board background
  k.add([
    k.rect(200, 120),
    k.pos(offsetX + ROOM_W / 2 - 100, offsetY + T * 2 + 4),
    k.color(50, 40, 30),
    k.outline(3, k.Color.fromArray([80, 60, 40])),
    k.z(90),
  ]);

  // Content lines
  content.lines.forEach((line, i) => {
    k.add([
      k.text(line, { size: 10 }),
      k.pos(offsetX + ROOM_W / 2 - 92, offsetY + T * 2 + 14 + i * 14),
      k.color(255, 250, 230),
      k.z(100),
    ]);
  });
}

/**
 * Create the Experience room with catchable creatures
 */
function createExperienceRoom(
  k: KAPLAYCtx,
  offsetX: number,
  offsetY: number,
  data?: InteriorSceneData
): void {
  const floorColor = getFloorColor("experience");
  createFloorGrid(k, offsetX, offsetY, ROOM_W, ROOM_H, floorColor, -10);
  createRoomWalls(k, offsetX, offsetY, ROOM_W, ROOM_H);

  // Exit Door
  k.add([
    k.rect(T * 2, T),
    k.pos(offsetX + ROOM_W / 2 - T, offsetY + ROOM_H - T),
    k.color(100, 70, 50),
    k.outline(1, k.Color.fromArray([70, 50, 35])),
    k.z(0),
  ]);
  k.add([
    k.rect(T * 2, T),
    k.pos(offsetX + ROOM_W / 2 - T, offsetY + ROOM_H - T),
    k.area(),
    k.opacity(0),
    "exit",
    { returnPos: data?.returnPos ?? { x: 320, y: 280 } },
  ]);

  // Title
  k.add([
    k.text("Work Experience", { size: 16 }),
    k.pos(offsetX + ROOM_W / 2, offsetY + T + 12),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(100),
  ]);

  // Instruction text
  k.add([
    k.text("Press SPACE to capture!", { size: 10 }),
    k.pos(offsetX + ROOM_W / 2, offsetY + T + 28),
    k.anchor("center"),
    k.color(200, 200, 150),
    k.z(100),
  ]);

  // Position creatures in the room (anchored at bottom, so y is where feet are)
  const creaturePositions = [
    { x: offsetX + ROOM_W * 0.25, y: offsetY + ROOM_H * 0.55 },
    { x: offsetX + ROOM_W * 0.5, y: offsetY + ROOM_H * 0.50 },
    { x: offsetX + ROOM_W * 0.75, y: offsetY + ROOM_H * 0.55 },
  ];

  // Create creatures
  EXPERIENCE_CREATURES.forEach((config, i) => {
    createCreature(k, {
      ...config,
      x: creaturePositions[i].x,
      y: creaturePositions[i].y,
    });
  });

  // Cooldown to prevent rapid firing
  let canThrow = true;
  const throwCooldown = 0.5; // seconds

  // Action handler for throwing pokeball
  const handleAction = () => {
    if (!canThrow) return;

    const players = k.get("player");
    if (players.length === 0) return;
    const player = players[0];

    const nearestCreature = findNearestCreature(k, player.pos, 150);
    if (!nearestCreature) return;

    canThrow = false;
    k.wait(throwCooldown, () => {
      canThrow = true;
    });

    throwPokeball(k, player.pos, nearestCreature, (creature) => {
      // Get creature info before destroying
      const creatureId = creature.creatureId as string;

      // Create capture effect
      createCaptureEffect(k, creature.pos);

      // Destroy the creature
      creature.destroy();

      // Trigger callback to show modal
      if (captureCallback) {
        captureCallback(creatureId);
      }
    });
  };

  // Create player with action callback
  const player = createPlayer(
    k,
    offsetX + ROOM_W / 2,
    offsetY + ROOM_H - T * 2.5,
    "up",
    { onAction: handleAction }
  );

  // Room Bounds
  setupWorldBounds(
    k,
    player,
    offsetX + T + 8,
    offsetY + T * 2,
    offsetX + ROOM_W - T - 8,
    offsetY + ROOM_H - T + 4
  );

  // Exit Collision
  player.onCollide("exit", (exit: GameObj) => {
    k.go("city", { x: exit.returnPos.x, y: exit.returnPos.y + 8, dir: "down" });
  });

  // UI
  createUIText(k, "Walk down to exit", k.width() / 2, k.height() - 10, 8, [200, 200, 200]);
}

/**
 * Create a standard interior scene for non-experience buildings
 */
function createStandardInteriorScene(k: KAPLAYCtx, section: SectionType): void {
  k.scene(section, (data?: InteriorSceneData) => {
    const content = BUILDING_CONTENT[section];
    const offsetX = (k.width() - ROOM_W) / 2;
    const offsetY = (k.height() - ROOM_H) / 2;

    // Floor
    const floorColor = getFloorColor(section);
    createFloorGrid(k, offsetX, offsetY, ROOM_W, ROOM_H, floorColor, -10);

    // Walls
    createRoomWalls(k, offsetX, offsetY, ROOM_W, ROOM_H);

    // Exit Door
    k.add([
      k.rect(T * 2, T),
      k.pos(offsetX + ROOM_W / 2 - T, offsetY + ROOM_H - T),
      k.color(100, 70, 50),
      k.outline(1, k.Color.fromArray([70, 50, 35])),
      k.z(0),
    ]);
    k.add([
      k.rect(T * 2, T),
      k.pos(offsetX + ROOM_W / 2 - T, offsetY + ROOM_H - T),
      k.area(),
      k.opacity(0),
      "exit",
      { returnPos: data?.returnPos ?? { x: 320, y: 280 } },
    ]);

    // Furniture
    createInteriorFurniture(k, section, offsetX, offsetY, ROOM_W);

    // Title
    k.add([
      k.text(content.title, { size: 16 }),
      k.pos(offsetX + ROOM_W / 2, offsetY + T + 12),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.z(100),
    ]);

    // Content Board
    createContentBoard(k, content, offsetX, offsetY);

    // Player
    const player = createPlayer(k, offsetX + ROOM_W / 2, offsetY + ROOM_H - T * 2.5, "up");

    // Room Bounds
    setupWorldBounds(
      k,
      player,
      offsetX + T + 8,
      offsetY + T * 2,
      offsetX + ROOM_W - T - 8,
      offsetY + ROOM_H - T + 4
    );

    // Exit Collision
    player.onCollide("exit", (exit: GameObj) => {
      k.go("city", { x: exit.returnPos.x, y: exit.returnPos.y + 8, dir: "down" });
    });

    // UI
    createUIText(k, "Walk down to exit", k.width() / 2, k.height() - 10, 8, [200, 200, 200]);
  });
}

/**
 * Setup all interior scenes
 */
export function setupInteriorScenes(k: KAPLAYCtx): void {
  // Standard sections
  const standardSections: SectionType[] = ["about", "projects", "skills", "contact"];
  standardSections.forEach((section) => createStandardInteriorScene(k, section));

  // Experience section with creatures
  k.scene("experience", (data?: InteriorSceneData) => {
    const offsetX = (k.width() - ROOM_W) / 2;
    const offsetY = (k.height() - ROOM_H) / 2;
    createExperienceRoom(k, offsetX, offsetY, data);
  });
}
