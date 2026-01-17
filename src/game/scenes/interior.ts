import type { KAPLAYCtx, GameObj, SectionType, InteriorSceneData } from "../types";
import { SIZES } from "../constants";
import { createFloorGrid, createRoomWalls, createUIText } from "../utils";
import {
  createPlayer,
  setupWorldBounds,
  mobileAction,
  getFloorColor,
  createInteriorFurniture,
  createCreature,
  findNearestCreature,
  throwPokeball,
  createCaptureEffect,
  playDeathAnimation,
  getCreatureConfigForSection,
  shootArrow,
  createArrowHitEffect,
  swingHammer,
  type BuildingCreatureConfig,
} from "../entities";
import { BUILDING_CONTENT } from "../content";

const T = SIZES.TILE;
const { ROOM_W, ROOM_H } = SIZES;

// Store onCapture callback at module level so it can be set from GameCanvas
let captureCallback: ((id: string) => void) | null = null;

// Store onSectionInteract callback for About/Contact rooms
let sectionInteractCallback: ((section: string) => void) | null = null;

/**
 * Set the capture callback from outside
 */
export function setOnCaptureCallback(callback: (id: string) => void): void {
  captureCallback = callback;
}

/**
 * Set the section interact callback from outside (for About/Contact modals)
 */
export function setOnSectionInteractCallback(callback: (section: string) => void): void {
  sectionInteractCallback = callback;
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
      k.text(line, { size: 8, font: "gameFont" }),
      k.pos(offsetX + ROOM_W / 2 - 92, offsetY + T * 2 + 14 + i * 16),
      k.color(255, 250, 230),
      k.z(1000),
    ]);
  });
}

/**
 * Calculate creature positions based on the number of creatures
 * Distributes them evenly across the room
 */
function getCreaturePositions(
  count: number,
  offsetX: number,
  offsetY: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  
  if (count === 1) {
    positions.push({ x: offsetX + ROOM_W * 0.5, y: offsetY + ROOM_H * 0.50 });
  } else if (count === 2) {
    positions.push({ x: offsetX + ROOM_W * 0.33, y: offsetY + ROOM_H * 0.52 });
    positions.push({ x: offsetX + ROOM_W * 0.67, y: offsetY + ROOM_H * 0.52 });
  } else if (count === 3) {
    positions.push({ x: offsetX + ROOM_W * 0.25, y: offsetY + ROOM_H * 0.55 });
    positions.push({ x: offsetX + ROOM_W * 0.5, y: offsetY + ROOM_H * 0.50 });
    positions.push({ x: offsetX + ROOM_W * 0.75, y: offsetY + ROOM_H * 0.55 });
  } else {
    // For more creatures, distribute evenly
    const cols = Math.min(count, 4);
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const xPct = (col + 1) / (cols + 1);
      const yPct = 0.45 + (row * 0.15);
      positions.push({ x: offsetX + ROOM_W * xPct, y: offsetY + ROOM_H * yPct });
    }
  }
  
  return positions;
}

/**
 * Create action handler for pokeball throwing
 */
function createPokeballActionHandler(k: KAPLAYCtx): () => void {
  let canThrow = true;
  const throwCooldown = 0.5;

  return () => {
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
      const creatureId = creature.creatureId as string;

      playDeathAnimation(k, creature, () => {
        createCaptureEffect(k, creature.pos);
        creature.destroy();

        if (captureCallback) {
          captureCallback(creatureId);
        }
      });
    });
  };
}

/**
 * Create action handler for arrow shooting
 */
function createArrowActionHandler(k: KAPLAYCtx): () => void {
  let canShoot = true;
  const shootCooldown = 0.5;

  return () => {
    if (!canShoot) return;

    const players = k.get("player");
    if (players.length === 0) return;
    const player = players[0];

    const nearestCreature = findNearestCreature(k, player.pos, 200);
    if (!nearestCreature) return;

    canShoot = false;
    k.wait(shootCooldown, () => {
      canShoot = true;
    });

    shootArrow(k, player.pos, nearestCreature, (creature) => {
      const creatureId = creature.creatureId as string;

      createArrowHitEffect(k, creature.pos);
      playDeathAnimation(k, creature, () => {
        creature.destroy();

        if (captureCallback) {
          captureCallback(creatureId);
        }
      });
    });
  };
}

/**
 * Create action handler for hammer swinging
 */
function createHammerActionHandler(k: KAPLAYCtx): () => void {
  let canSwing = true;
  const swingCooldown = 0.5;

  return () => {
    if (!canSwing) return;

    const players = k.get("player");
    if (players.length === 0) return;
    const player = players[0];

    // Get player's current facing direction from their animation
    const currentAnim = player.curAnim();
    let dir = "down";
    if (currentAnim) {
      if (currentAnim.includes("up")) dir = "up";
      else if (currentAnim.includes("down")) dir = "down";
      else if (currentAnim.includes("left")) dir = "left";
      else if (currentAnim.includes("right")) dir = "right";
    }

    canSwing = false;
    k.wait(swingCooldown, () => {
      canSwing = true;
    });

    swingHammer(k, player.pos, dir, (creature) => {
      const creatureId = creature.creatureId as string;

      playDeathAnimation(k, creature, () => {
        creature.destroy();

        if (captureCallback) {
          captureCallback(creatureId);
        }
      });
    });
  };
}

/**
 * Create a room with interactive creatures
 * Uses the BuildingCreatureConfig to determine creatures, title, instructions, and action type
 */
function createCreatureRoom(
  k: KAPLAYCtx,
  section: SectionType,
  creatureConfig: BuildingCreatureConfig,
  offsetX: number,
  offsetY: number,
  data?: InteriorSceneData
): void {
  const floorColor = getFloorColor(section);
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

  // Title (from config or content)
  const content = BUILDING_CONTENT[section];
  const title = creatureConfig.roomTitle ?? content.title;
  k.add([
    k.text(title, { size: 12, font: "gameFont" }),
    k.pos(offsetX + ROOM_W / 2, offsetY + T + 12),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(1000),
  ]);

  // Instruction text (from config)
  if (creatureConfig.instructionText) {
    k.add([
      k.text(creatureConfig.instructionText, { size: 8, font: "gameFont" }),
      k.pos(offsetX + ROOM_W / 2, offsetY + T + 30),
      k.anchor("center"),
      k.color(200, 200, 150),
      k.z(1000),
    ]);
  }

  // Create creatures from config
  const creatures = creatureConfig.creatures ?? [];
  const positions = getCreaturePositions(creatures.length, offsetX, offsetY);

  creatures.forEach((config, i) => {
    createCreature(k, {
      ...config,
      x: positions[i].x,
      y: positions[i].y,
    });
  });

  // Create action handler based on action type and set mobile label
  let actionHandler: (() => void) | undefined;
  let actionLabel = "Action";
  
  if (creatureConfig.actionType === "pokeball") {
    actionHandler = createPokeballActionHandler(k);
    actionLabel = "Catch";
  } else if (creatureConfig.actionType === "arrow") {
    actionHandler = createArrowActionHandler(k);
    actionLabel = "Shoot";
  } else if (creatureConfig.actionType === "hammer") {
    actionHandler = createHammerActionHandler(k);
    actionLabel = "Smash";
  }

  // Set mobile action label
  mobileAction.setLabel(actionLabel);

  // Create player with action callback
  const player = createPlayer(
    k,
    offsetX + ROOM_W / 2,
    offsetY + ROOM_H - T * 2.5,
    "up",
    actionHandler ? { onAction: actionHandler } : undefined
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
      k.text(content.title, { size: 12, font: "gameFont" }),
      k.pos(offsetX + ROOM_W / 2, offsetY + T + 12),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.z(1000),
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

    // SPACE interaction for About and Contact rooms
    if (section === "about" || section === "contact") {
      const handleInteract = () => {
        if (sectionInteractCallback) {
          sectionInteractCallback(section);
        }
      };

      // Set up mobile action for About/Contact
      mobileAction.setLabel("Info");
      mobileAction.setCallback(handleInteract);

      k.onKeyPress("space", handleInteract);
    }

    // UI
    const uiText = section === "about" || section === "contact" 
      ? "Press SPACE to learn more | Walk down to exit"
      : "Walk down to exit";
    createUIText(k, uiText, k.width() / 2, k.height() - 10, 8, [200, 200, 200]);
  });
}

/**
 * Setup all interior scenes
 * Uses BUILDING_CREATURE_CONFIGS to determine room type (creatures vs content board)
 */
export function setupInteriorScenes(k: KAPLAYCtx): void {
  const allSections: SectionType[] = ["about", "projects", "skills", "experience", "contact"];
  
  allSections.forEach((section) => {
    const creatureConfig = getCreatureConfigForSection(section);
    
    if (creatureConfig?.hasCreatures) {
      // Create a creature room
      k.scene(section, (data?: InteriorSceneData) => {
        const offsetX = (k.width() - ROOM_W) / 2;
        const offsetY = (k.height() - ROOM_H) / 2;
        createCreatureRoom(k, section, creatureConfig, offsetX, offsetY, data);
      });
    } else {
      // Create a standard content board room
      createStandardInteriorScene(k, section);
    }
  });
}
