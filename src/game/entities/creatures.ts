import type { KAPLAYCtx, GameObj } from "../types";

// Mushroom sprite names mapped to job indices
export const MUSHROOM_SPRITES = [
  "mushroom-green",  // Senior Dev
  "mushroom-blue",   // Engineer
  "mushroom-pink",   // Junior
] as const;

export type MushroomSprite = typeof MUSHROOM_SPRITES[number];

export interface CreatureConfig {
  id: string;
  sprite: MushroomSprite;
  label: string;
  x: number;
  y: number;
}

/**
 * Create a capturable creature entity
 */
export function createCreature(
  k: KAPLAYCtx,
  config: CreatureConfig
): GameObj {
  const { id, sprite, label, x, y } = config;

  // Create creature sprite with idle animation
  const creature = k.add([
    k.sprite(sprite, { anim: "idle" }),
    k.pos(x, y),
    k.area({ scale: 0.8 }),
    k.anchor("bot"),  // Anchor at bottom so the full sprite is visible above the position
    k.scale(1),
    k.z(80),  // Higher z-index to render above floor/furniture
    "creature",
    { creatureId: id, creatureLabel: label },
  ]);

  // Add floating label above creature (sprite is ~32px tall, anchored at bottom)
  const labelObj = k.add([
    k.text(label, { size: 8 }),
    k.pos(x, y - 40),  // Position above the sprite
    k.anchor("center"),
    k.color(255, 255, 255),
    k.outline(1, k.Color.fromArray([0, 0, 0])),
    k.z(81),
    "creature-label",
    { parentCreature: creature },
  ]);

  // Simple bobbing animation
  let bobTime = Math.random() * Math.PI * 2; // Random start phase
  creature.onUpdate(() => {
    bobTime += k.dt() * 3;
    creature.pos.y = y + Math.sin(bobTime) * 2;
    labelObj.pos.y = creature.pos.y - 40;  // Keep label above sprite
    labelObj.pos.x = creature.pos.x;
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
