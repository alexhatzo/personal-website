import type { KAPLAYCtx, GameObj, CitySceneData, Position } from "../types";
import { SIZES, PLAZA } from "../constants";
import { createGrassField, createRoadSegment, createRoadMarkings, createVerticalRoadMarkings, createPlaza, createUIText } from "../utils";
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
  createWanderingCreature,
  findNearestWanderingCreature,
  showChatBubble,
  getNextDialogue,
} from "../entities";

const T = SIZES.TILE;

// Decoration positions - easy to modify!
const TREE_POSITIONS: Position[] = [
  { x: 150, y: 100 }, { x: 490, y: 100 },
  { x: 100, y: 200 }, { x: 540, y: 200 },  // Moved away from side building paths
  { x: 100, y: 280 }, { x: 540, y: 280 },  // Moved away from side building paths
  { x: 220, y: 380 }, { x: 420, y: 380 },
  { x: 300, y: 420 }, { x: 340, y: 420 },  // Moved up slightly
];

const BENCH_POSITIONS: Position[] = [
  { x: PLAZA.X + 30, y: PLAZA.Y + 30 },
  { x: PLAZA.X + PLAZA.W - 50, y: PLAZA.Y + 30 },
  { x: PLAZA.X + 30, y: PLAZA.Y + PLAZA.H - 40 },
  { x: PLAZA.X + PLAZA.W - 50, y: PLAZA.Y + PLAZA.H - 40 },
];

// Lamp posts inside the plaza corners
const LAMP_POST_POSITIONS: Position[] = [
  { x: PLAZA.X + 10, y: PLAZA.Y + 20 },
  { x: PLAZA.X + PLAZA.W - 26, y: PLAZA.Y + 20 },
  { x: PLAZA.X + 10, y: PLAZA.Y + PLAZA.H - 36 },
  { x: PLAZA.X + PLAZA.W - 26, y: PLAZA.Y + PLAZA.H - 36 },
];

// Cars positioned on the roads around the plaza
const PARKED_CAR_POSITIONS: Position[] = [
  // On bottom road
  { x: PLAZA.X - 10, y: PLAZA.Y + PLAZA.H + 4 },
  { x: PLAZA.X + PLAZA.W + 10, y: PLAZA.Y + PLAZA.H + 4 },
  // On top road  
  { x: PLAZA.X + 40, y: PLAZA.Y - 28 },
  { x: PLAZA.X + PLAZA.W - 60, y: PLAZA.Y - 28 },
];

// Street signs on grass near road corners
const STREET_SIGN_POSITIONS: Position[] = [
  { x: PLAZA.X - 56, y: PLAZA.Y + PLAZA.H + 40 },
  { x: PLAZA.X + PLAZA.W + 40, y: PLAZA.Y + PLAZA.H + 40 },
];

// Traffic lights at road intersections (corners outside the roundabout)
const TRAFFIC_LIGHT_POSITIONS: Position[] = [
  { x: PLAZA.X - 50, y: PLAZA.Y - 50 },  // Top-left corner
  { x: PLAZA.X + PLAZA.W + 34, y: PLAZA.Y - 50 },  // Top-right corner
];

// Trash cans inside the plaza and on grass areas
const TRASH_CAN_POSITIONS: Position[] = [
  { x: PLAZA.X + 80, y: PLAZA.Y + 10 },
  { x: PLAZA.X + PLAZA.W - 96, y: PLAZA.Y + 10 },
  { x: 80, y: 380 },   // Near Experience building area
  { x: 560, y: 380 },  // Near Contact building area
];

// Mailboxes on grass near building entrances (now at bottom of buildings)
const MAILBOX_POSITIONS: Position[] = [
  { x: 80, y: 310 },   // Near Projects building entrance
  { x: 550, y: 310 },  // Near Skills building entrance
];

// Fire hydrants on grass near bottom roads
const FIRE_HYDRANT_POSITIONS: Position[] = [
  { x: 110, y: PLAZA.Y + PLAZA.H + 40 },
  { x: 520, y: PLAZA.Y + PLAZA.H + 40 },
];

/**
 * Setup the city scene
 */
export function setupCityScene(k: KAPLAYCtx): void {
  k.scene("city", (startPos?: CitySceneData) => {
    const { WORLD_W, WORLD_H } = SIZES;

    // === 1. Ground Layers (CSS-based) ===
    createGrassField(k, WORLD_W, WORLD_H);

    // Main plaza (stone) - the town center
    createPlaza(k, PLAZA.X, PLAZA.Y, PLAZA.W, PLAZA.H);

    // === Roads around the plaza (roundabout style) ===
    const roadWidth = T * 2;
    
    // Top road (horizontal) - only markings in the middle section (not at corners)
    createRoadSegment(k, PLAZA.X - roadWidth, PLAZA.Y - roadWidth, PLAZA.W + roadWidth * 2, roadWidth);
    createRoadMarkings(k, PLAZA.X, PLAZA.Y - roadWidth + T - 1, PLAZA.X + PLAZA.W);
    
    // Bottom road (horizontal) - only markings in the middle section (not at corners)
    createRoadSegment(k, PLAZA.X - roadWidth, PLAZA.Y + PLAZA.H, PLAZA.W + roadWidth * 2, roadWidth);
    createRoadMarkings(k, PLAZA.X, PLAZA.Y + PLAZA.H + T - 1, PLAZA.X + PLAZA.W);
    
    // Left road (vertical) - connects top and bottom roads (no markings - corners covered by horizontal)
    createRoadSegment(k, PLAZA.X - roadWidth, PLAZA.Y - roadWidth, roadWidth, PLAZA.H + roadWidth * 2);
    
    // Right road (vertical) - connects top and bottom roads (no markings - corners covered by horizontal)
    createRoadSegment(k, PLAZA.X + PLAZA.W, PLAZA.Y - roadWidth, roadWidth, PLAZA.H + roadWidth * 2);
    
    // === Roads leading to buildings (all doors at bottom) ===
    // Building positions and door locations:
    // - About: x=284, y=30, w=72, h=48 → door at y=78, center x=320
    // - Projects: x=16, y=185, w=56, h=110 → door at y=295, center x=44  
    // - Skills: x=568, y=185, w=56, h=110 → door at y=295, center x=596
    // - Experience: x=100, y=390, w=72, h=64 → door at y=454, center x=136
    // - Contact: x=468, y=400, w=64, h=44 → door at y=444, center x=500
    // PLAZA bottom road is at y=320-352
    
    // About Me building - vertical road from top of plaza UP to building door (y=78)
    createRoadSegment(k, WORLD_W / 2 - roadWidth / 2, 78, roadWidth, PLAZA.Y - roadWidth - 78);
    createVerticalRoadMarkings(k, WORLD_W / 2, 80, PLAZA.Y - roadWidth);
    
    // Projects building - path from bottom road UP to door at y=295
    // Horizontal connector from left side of bottom road
    createRoadSegment(k, 28, PLAZA.Y + PLAZA.H, PLAZA.X - roadWidth - 28 + roadWidth, roadWidth);
    // Vertical road UP from y=320 to door at y=295 (road goes from 295 to 320)
    createRoadSegment(k, 28, 295, roadWidth, PLAZA.Y + PLAZA.H - 295);
    createVerticalRoadMarkings(k, 28 + T, 297, PLAZA.Y + PLAZA.H);
    
    // Skills building - path from bottom road UP to door at y=295
    // Horizontal connector from right side of bottom road
    createRoadSegment(k, PLAZA.X + PLAZA.W, PLAZA.Y + PLAZA.H, 580 + roadWidth - (PLAZA.X + PLAZA.W), roadWidth);
    // Vertical road UP from y=320 to door at y=295
    createRoadSegment(k, 580, 295, roadWidth, PLAZA.Y + PLAZA.H - 295);
    createVerticalRoadMarkings(k, 580 + T, 297, PLAZA.Y + PLAZA.H);
    
    // Experience building - path down from horizontal connector to door at y=454
    // Door center x=136, road centered: 136 - roadWidth/2 = 120
    // Start from y=320 (same as horizontal connector) to ensure overlap, extend to door at y=454
    createRoadSegment(k, 120, PLAZA.Y + PLAZA.H, roadWidth, 454 - (PLAZA.Y + PLAZA.H));
    createVerticalRoadMarkings(k, 120 + T, PLAZA.Y + PLAZA.H + roadWidth + 4, 450);
    
    // Contact building - path down from horizontal connector to door at y=444
    // Door center x=500, road centered: 500 - roadWidth/2 = 484
    // Start from y=320 (same as horizontal connector) to ensure overlap, extend to door at y=444
    createRoadSegment(k, 484, PLAZA.Y + PLAZA.H, roadWidth, 444 - (PLAZA.Y + PLAZA.H));
    createVerticalRoadMarkings(k, 484 + T, PLAZA.Y + PLAZA.H + roadWidth + 4, 440);
    
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

    // === 6.5. Wandering Creatures in Plaza ===
    const plazaBounds = {
      minX: PLAZA.X + 20,
      maxX: PLAZA.X + PLAZA.W - 20,
      minY: PLAZA.Y + 20,
      maxY: PLAZA.Y + PLAZA.H - 20,
    };

    // Mouse wandering in plaza
    createWanderingCreature(k, {
      id: "plaza-mouse",
      sprite: "mouse",
      label: "Mouse",
      x: PLAZA.X + 40,
      y: PLAZA.Y + 40,
      bounds: plazaBounds,
      speed: 25,
      dialogueLines: [
        "Squeak!",
        "Looking for cheese...",
        "Nice weather today!",
        "Have you seen any cats?",
      ],
    });

    // Bat wandering in plaza (can fly through walls)
    createWanderingCreature(k, {
      id: "plaza-bat",
      sprite: "bat",
      label: "Bat",
      x: PLAZA.X + PLAZA.W - 40,
      y: PLAZA.Y + PLAZA.H - 40,
      bounds: plazaBounds,
      speed: 35,
      canFly: true, // Bats can fly through obstacles
      dialogueLines: [
        "Screech!",
        "It's too bright out here...",
        "I prefer the night.",
        "Echolocation is cool!",
      ],
    });

    // Pickle-loving elephant in plaza
    createWanderingCreature(k, {
      id: "plaza-elephant",
      sprite: "elephant",
      label: "Pickles",
      x: PLAZA.X + PLAZA.W / 2,
      y: PLAZA.Y + 30,
      bounds: plazaBounds,
      speed: 15, // Slow and steady
      dialogueLines: [
        "PICKLES!!!",
        "Did someone say pickles?!",
        "I'm Hatzo's GF",
        "I dream of pickles...",
        "I love this dude, hire him...",        
        "Dill, bread & butter, gherkins... I love them all!",
        "My pickle jar is never full enough.",
        "Want to start a pickle business with me?",
        "Crunch crunch crunch!",
        "The perfect pickle has the perfect crunch.",
        "I've tried 47 pickle recipes this week!",
        "Pickle juice is underrated.",
      ],
    });

    // === 7. Player ===
    const spawnX = startPos?.x ?? WORLD_W / 2;
    const spawnY = startPos?.y ?? PLAZA.Y + PLAZA.H / 2 + 50;
    const spawnDir = startPos?.dir ?? "down";
    const player = createPlayer(k, spawnX, spawnY, spawnDir);

    // === 8. Camera & Bounds ===
    setupCamera(k, player, WORLD_W, WORLD_H);
    setupWorldBounds(k, player, 16, 16, WORLD_W - 16, WORLD_H - 16);

    // === 9. Door Collision - Enter Buildings ===
    // Add a brief delay before door collisions are active to prevent immediate re-entry
    let doorCooldown = startPos ? 0.5 : 0; // Half second cooldown when returning from interior
    if (doorCooldown > 0) {
      const cooldownTimer = k.onUpdate(() => {
        doorCooldown -= k.dt();
        if (doorCooldown <= 0) {
          cooldownTimer.cancel();
        }
      });
    }
    
    player.onCollide("door", (door: GameObj) => {
      if (doorCooldown > 0) return; // Ignore collision during cooldown
      k.go(door.section, { returnPos: door.doorPos });
    });

    // === 10. Proximity Hint System ===
    // Create a hint text that follows player when near doors or creatures
    const hintText = k.add([
      k.text("Walk into door to enter", { size: 8, font: "gameFont" }),
      k.pos(0, 0),
      k.anchor("center"),
      k.color(255, 255, 100),
      k.opacity(0),
      k.z(1000),
      k.fixed(),
    ]);

    // Track current hint type
    let currentHintType: "door" | "creature" | null = null;

    // Check proximity to doors and creatures every frame
    player.onUpdate(() => {
      const doors = k.get("door");
      let nearDoor = false;
      
      for (const door of doors) {
        const dist = player.pos.dist(door.pos);
        if (dist < 50) {
          nearDoor = true;
          break;
        }
      }

      // Check for nearby wandering creatures
      const nearestCreature = findNearestWanderingCreature(k, player.pos, 50);
      const nearCreature = nearestCreature !== null;

      // Determine which hint to show (creature takes priority)
      if (nearCreature) {
        currentHintType = "creature";
        hintText.text = "Press SPACE to talk";
        hintText.opacity = Math.min(1, hintText.opacity + 0.1);
        hintText.pos = k.vec2(k.width() / 2, k.height() - 40);
      } else if (nearDoor) {
        currentHintType = "door";
        hintText.text = "Walk into door to enter";
        hintText.opacity = Math.min(1, hintText.opacity + 0.1);
        hintText.pos = k.vec2(k.width() / 2, k.height() - 40);
      } else {
        currentHintType = null;
        hintText.opacity = Math.max(0, hintText.opacity - 0.1);
      }
    });

    // === 10.5. Creature Interaction ===
    let canTalk = true;
    const talkCooldown = 1.5; // Prevent spam

    k.onKeyPress("space", () => {
      if (!canTalk) return;

      const nearestCreature = findNearestWanderingCreature(k, player.pos, 50);
      if (!nearestCreature) return;

      canTalk = false;
      k.wait(talkCooldown, () => {
        canTalk = true;
      });

      // Get dialogue and show chat bubble
      const dialogue = getNextDialogue(nearestCreature);
      showChatBubble(k, nearestCreature, dialogue, 2.5);
    });

    // === 11. UI ===
    createUIText(k, "Welcome to my Portfolio!", k.width() / 2, 10, 10);
    createUIText(k, "Use arrow keys or WASD to move", k.width() / 2, k.height() - 10, 8, [220, 220, 220]);
  });
}
