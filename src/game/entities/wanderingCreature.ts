import type { KAPLAYCtx, GameObj } from "../types";
import { getSpriteTypeForSprite } from "../sprites";

// ============================================================================
// Types
// ============================================================================

export interface WanderingCreatureConfig {
  /** Unique identifier */
  id: string;
  /** Sprite name to use */
  sprite: string;
  /** Display label */
  label: string;
  /** Starting X position */
  x: number;
  /** Starting Y position */
  y: number;
  /** Bounding box for movement */
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  /** Movement speed (pixels per second) */
  speed?: number;
  /** Dialogue lines to show when talked to */
  dialogueLines?: string[];
  /** If true, creature ignores walls/obstacles (flying creatures) */
  canFly?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a random standing animation for a sprite
 */
function getRandomStandingAnim(sprite: string): string {
  const typeConfig = getSpriteTypeForSprite(sprite);
  if (!typeConfig || typeConfig.standingAnims.length === 0) {
    return "idle";
  }
  const anims = typeConfig.standingAnims;
  return anims[Math.floor(Math.random() * anims.length)];
}

// ============================================================================
// Wandering Creature Creation
// ============================================================================

/**
 * Create a creature that wanders randomly within bounds
 * Can be interacted with to show dialogue
 */
export function createWanderingCreature(
  k: KAPLAYCtx,
  config: WanderingCreatureConfig
): GameObj {
  const { id, sprite, label, x, y, bounds, speed = 30, dialogueLines = ["..."], canFly = false } = config;

  const startAnim = getRandomStandingAnim(sprite);

  // Base components for all creatures
  const components: any[] = [
    k.sprite(sprite, { anim: startAnim }),
    k.pos(x, y),
    k.area({ scale: 0.6 }),
    k.anchor("bot"),
    k.scale(1),
    k.z(80),
    "wandering-creature",
    {
      creatureId: id,
      creatureLabel: label,
      creatureSprite: sprite,
      dialogueLines,
      currentDialogueIndex: 0,
      isMoving: false,
      moveDir: { x: 0, y: 0 },
      moveTimer: 0,
      pauseTimer: 0,
      canFly,
    },
  ];

  // Add body for non-flying creatures so they collide with walls
  if (!canFly) {
    components.push(k.body());
  }

  // Create creature sprite
  const creature = k.add(components);

  // Add floating label above creature
  const labelObj = k.add([
    k.text(label, { size: 6, font: "gameFont" }),
    k.pos(x, y - 40),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.outline(1, k.Color.fromArray([0, 0, 0])),
    k.z(1000),
    "wandering-creature-label",
    { parentCreature: creature },
  ]);

  // Movement state
  let moveTimer = k.rand(1, 3);
  let pauseTimer = 0;
  let isMoving = false;
  let moveDir = { x: 0, y: 0 };

  // Animation timer
  let animTimer = 2 + k.rand(0, 3);

  creature.onUpdate(() => {
    // Update label position
    labelObj.pos.x = creature.pos.x;
    labelObj.pos.y = creature.pos.y - 40;

    // Handle movement state machine
    if (isMoving) {
      // Move in current direction
      const newX = creature.pos.x + moveDir.x * speed * k.dt();
      const newY = creature.pos.y + moveDir.y * speed * k.dt();

      // Clamp to bounds
      creature.pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
      creature.pos.y = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

      // Check if hit bounds, reverse direction
      if (newX <= bounds.minX || newX >= bounds.maxX) {
        moveDir.x *= -1;
      }
      if (newY <= bounds.minY || newY >= bounds.maxY) {
        moveDir.y *= -1;
      }

      moveTimer -= k.dt();
      if (moveTimer <= 0) {
        isMoving = false;
        pauseTimer = k.rand(1, 3);
      }
    } else {
      // Paused, waiting to move again
      pauseTimer -= k.dt();
      if (pauseTimer <= 0) {
        isMoving = true;
        moveTimer = k.rand(1, 3);
        // Pick random direction
        const angle = k.rand(0, Math.PI * 2);
        moveDir = {
          x: Math.cos(angle),
          y: Math.sin(angle),
        };
      }
    }

    // Switch animation periodically
    animTimer -= k.dt();
    if (animTimer <= 0) {
      const newAnim = getRandomStandingAnim(sprite);
      creature.play(newAnim);
      animTimer = 2 + k.rand(0, 3);
    }
  });

  // Handle collisions for non-flying creatures
  if (!canFly) {
    creature.onCollide("", () => {
      // When hitting any obstacle, pick a new random direction
      const angle = k.rand(0, Math.PI * 2);
      moveDir = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };
      // Also pause briefly after collision
      isMoving = false;
      pauseTimer = k.rand(0.5, 1.5);
    });
  }

  // Clean up label when creature is destroyed
  creature.onDestroy(() => {
    if (labelObj.exists()) {
      labelObj.destroy();
    }
  });

  return creature;
}

/**
 * Find nearest wandering creature to a position
 */
export function findNearestWanderingCreature(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  maxDistance: number = 60
): GameObj | null {
  const creatures = k.get("wandering-creature");
  let nearest: GameObj | null = null;
  let nearestDist = maxDistance;

  for (const creature of creatures) {
    const dist = Math.sqrt(
      Math.pow(creature.pos.x - pos.x, 2) + Math.pow(creature.pos.y - pos.y, 2)
    );
    if (dist < nearestDist) {
      nearest = creature;
      nearestDist = dist;
    }
  }

  return nearest;
}
