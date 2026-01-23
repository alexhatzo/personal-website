import type { KAPLAYCtx, GameObj } from "../types";
import { PROJECTILE } from "../constants";
import { createCleanup } from "./projectileBase";

const HAMMER_HEAD_W = 16;
const HAMMER_HEAD_H = 10;
const HAMMER_HANDLE_W = 4;
const HAMMER_HANDLE_H = 14;
const SWING_DURATION = 0.3; // seconds
const SWING_RANGE = 50; // pixels - how far the hammer reaches

/**
 * Swing a hammer in front of the player
 * Returns true if a creature was hit
 */
export function swingHammer(
  k: KAPLAYCtx,
  playerPos: { x: number; y: number },
  playerDir: string,
  onHit: (creature: GameObj) => void
): void {
  // Determine swing direction based on player facing direction
  let swingAngleStart: number;
  let swingAngleEnd: number;
  let hammerOffsetX = 0;
  let hammerOffsetY = 0;

  switch (playerDir) {
    case "right":
      swingAngleStart = -90;
      swingAngleEnd = 90;
      hammerOffsetX = 20;
      break;
    case "left":
      swingAngleStart = 90;
      swingAngleEnd = -90;
      hammerOffsetX = -20;
      break;
    case "up":
      swingAngleStart = 180;
      swingAngleEnd = 0;
      hammerOffsetY = -20;
      break;
    case "down":
    default:
      swingAngleStart = 0;
      swingAngleEnd = 180;
      hammerOffsetY = 20;
      break;
  }

  const hammerX = playerPos.x + hammerOffsetX;
  const hammerY = playerPos.y + hammerOffsetY;

  // Create hammer handle
  const handle = k.add([
    k.rect(HAMMER_HANDLE_W, HAMMER_HANDLE_H),
    k.pos(hammerX, hammerY),
    k.anchor("bot"),
    k.rotate(swingAngleStart),
    k.color(139, 90, 43), // Brown wood
    k.outline(1, k.Color.fromArray([80, 50, 20])),
    k.z(200),
    "hammer-handle",
  ]);

  // Create hammer head
  const head = k.add([
    k.rect(HAMMER_HEAD_W, HAMMER_HEAD_H),
    k.pos(hammerX, hammerY - HAMMER_HANDLE_H),
    k.anchor("center"),
    k.rotate(swingAngleStart),
    k.color(100, 100, 110), // Metal gray
    k.outline(2, k.Color.fromArray([60, 60, 70])),
    k.z(201),
    "hammer-head",
  ]);

  // Create collision area for the hammer swing
  const hitArea = k.add([
    k.circle(SWING_RANGE),
    k.pos(hammerX, hammerY),
    k.anchor("center"),
    k.area(),
    k.opacity(0),
    k.z(199),
    "hammer-hitarea",
  ]);

  // Track which creatures we've already hit
  const hitCreatures = new Set<GameObj>();

  // Create cleanup function using shared utility
  const cleanup = createCleanup(handle, head, hitArea);

  // Animate the swing
  let swingTime = 0;
  const swingUpdate = k.onUpdate(() => {
    swingTime += k.dt();
    const progress = Math.min(swingTime / SWING_DURATION, 1);

    // Ease-out swing animation
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentAngle = swingAngleStart + (swingAngleEnd - swingAngleStart) * easeProgress;

    // Update handle rotation
    handle.angle = currentAngle;

    // Update head position and rotation based on handle
    const radians = k.deg2rad(currentAngle);
    const headOffsetX = Math.sin(radians) * HAMMER_HANDLE_H;
    const headOffsetY = -Math.cos(radians) * HAMMER_HANDLE_H;
    head.pos.x = hammerX + headOffsetX;
    head.pos.y = hammerY + headOffsetY;
    head.angle = currentAngle;

    // Check for creature hits during swing
    const creatures = k.get("creature");
    for (const creature of creatures) {
      if (hitCreatures.has(creature)) continue;
      
      const dist = Math.sqrt(
        Math.pow(creature.pos.x - head.pos.x, 2) + 
        Math.pow(creature.pos.y - head.pos.y, 2)
      );
      
      if (dist < SWING_RANGE * PROJECTILE.HAMMER_HIT_RANGE) {
        hitCreatures.add(creature);
        onHit(creature);
        createHammerHitEffect(k, creature.pos);
      }
    }

    // End swing
    if (progress >= 1) {
      swingUpdate.cancel();
      cleanup();
    }
  });
}

/**
 * Create impact effect when hammer hits
 */
export function createHammerHitEffect(
  k: KAPLAYCtx,
  pos: { x: number; y: number }
): void {
  // Create impact star/burst
  const burst = k.add([
    k.polygon([
      k.vec2(0, -12),
      k.vec2(4, -4),
      k.vec2(12, 0),
      k.vec2(4, 4),
      k.vec2(0, 12),
      k.vec2(-4, 4),
      k.vec2(-12, 0),
      k.vec2(-4, -4),
    ]),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(255, 200, 100),
    k.opacity(1),
    k.scale(0.5),
    k.z(300),
  ]);

  // Animate burst
  burst.onUpdate(() => {
    burst.scale.x += k.dt() * 4;
    burst.scale.y += k.dt() * 4;
    burst.opacity -= k.dt() * 3;
    if (burst.opacity <= 0) burst.destroy();
  });

  // Add some debris particles
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + k.rand(-0.3, 0.3);
    const particle = k.add([
      k.rect(4, 4),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(150, 150, 160),
      k.opacity(1),
      k.z(299),
    ]);

    const speed = 50 + k.rand(0, 30);
    particle.onUpdate(() => {
      particle.pos.x += Math.cos(angle) * speed * k.dt();
      particle.pos.y += Math.sin(angle) * speed * k.dt();
      particle.opacity -= k.dt() * 2.5;
      if (particle.opacity <= 0) particle.destroy();
    });
  }
}
