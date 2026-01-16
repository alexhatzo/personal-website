import type { KAPLAYCtx, GameObj } from "../types";
import { getSpriteTypeForSprite, getSpritesForType } from "../sprites";

// ============================================================================
// Types
// ============================================================================

export interface CreatureConfig {
  /** Unique identifier for this creature (used for callbacks) */
  id: string;
  /** The sprite name to use (must be registered in SPRITE_REGISTRY) */
  sprite: string;
  /** Label displayed above the creature */
  label: string;
  /** X position */
  x: number;
  /** Y position */
  y: number;
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
    return "idle"; // Fallback
  }
  const anims = typeConfig.standingAnims;
  return anims[Math.floor(Math.random() * anims.length)];
}

/**
 * Get the death animation name for a sprite
 */
function getDeathAnim(sprite: string): string {
  const typeConfig = getSpriteTypeForSprite(sprite);
  return typeConfig?.deathAnim ?? "die"; // Fallback
}

// ============================================================================
// Creature Creation
// ============================================================================

/**
 * Create a capturable creature entity
 * Works with any sprite type registered in SPRITE_REGISTRY
 */
export function createCreature(
  k: KAPLAYCtx,
  config: CreatureConfig
): GameObj {
  const { id, sprite, label, x, y } = config;

  // Start with a random standing animation for this sprite type
  const startAnim = getRandomStandingAnim(sprite);

  // Create creature sprite with random starting animation
  const creature = k.add([
    k.sprite(sprite, { anim: startAnim }),
    k.pos(x, y),
    k.area({ scale: 0.8 }),
    k.anchor("bot"),
    k.scale(1),
    k.z(80),
    "creature",
    { 
      creatureId: id, 
      creatureLabel: label, 
      creatureSprite: sprite,  // Store sprite name for animation lookup
      isDying: false 
    },
  ]);

  // Add floating label above creature
  const labelObj = k.add([
    k.text(label, { size: 6, font: "gameFont" }),
    k.pos(x, y - 40),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.outline(1, k.Color.fromArray([0, 0, 0])),
    k.z(1000),
    "creature-label",
    { parentCreature: creature },
  ]);

  // Timer to switch animations randomly
  let animTimer = 2 + Math.random() * 3;
  
  // Simple bobbing animation
  let bobTime = Math.random() * Math.PI * 2;
  creature.onUpdate(() => {
    if (creature.isDying) return;
    
    // Bob up and down
    bobTime += k.dt() * 3;
    creature.pos.y = y + Math.sin(bobTime) * 2;
    labelObj.pos.y = creature.pos.y - 40;
    labelObj.pos.x = creature.pos.x;
    
    // Switch animation periodically
    animTimer -= k.dt();
    if (animTimer <= 0) {
      const newAnim = getRandomStandingAnim(sprite);
      creature.play(newAnim);
      animTimer = 2 + Math.random() * 3;
    }
  });

  // Clean up label when creature is destroyed
  creature.onDestroy(() => {
    if (labelObj.exists()) {
      labelObj.destroy();
    }
  });

  return creature;
}

/**
 * Play the death/capture animation on a creature and call callback when done
 * Automatically uses the correct death animation for the sprite type
 */
export function playDeathAnimation(
  k: KAPLAYCtx,
  creature: GameObj,
  onComplete: () => void
): void {
  // Mark as dying to stop other animations
  creature.isDying = true;
  
  // Get the death animation for this sprite type
  const deathAnim = getDeathAnim(creature.creatureSprite as string);
  
  // Play death animation
  creature.play(deathAnim);
  
  // Listen for animation end
  creature.onAnimEnd((anim: string) => {
    if (anim === deathAnim) {
      onComplete();
    }
  });
}

/**
 * Find the nearest creature to a position
 */
export function findNearestCreature(
  k: KAPLAYCtx,
  pos: { x: number; y: number },
  maxDistance: number = 100
): GameObj | null {
  const creatures = k.get("creature");
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
