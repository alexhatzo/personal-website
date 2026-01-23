import type { KAPLAYCtx, GameObj } from "../types";
import { calculateDirection, createLifetimeTracker, createCleanup } from "./projectileBase";

const POKEBALL_SPEED = 200;
const POKEBALL_SIZE = 8;

/**
 * Throw a pokeball toward a target creature
 */
export function throwPokeball(
  k: KAPLAYCtx,
  from: { x: number; y: number },
  target: GameObj,
  onHit: (creature: GameObj) => void
): GameObj {
  // Calculate direction to target using shared utility
  const dir = calculateDirection(from, target.pos);

  // Create pokeball as two semicircles (red top, white bottom)
  const pokeball = k.add([
    k.circle(POKEBALL_SIZE),
    k.pos(from.x, from.y),
    k.anchor("center"),
    k.area({ scale: 1.5 }),
    k.color(220, 50, 50), // Red color
    k.outline(1, k.Color.fromArray([30, 30, 30])),
    k.z(200),
    "pokeball",
    { velocity: { x: dir.x * POKEBALL_SPEED, y: dir.y * POKEBALL_SPEED } },
  ]);

  // Add white bottom half indicator (small rect)
  const whiteHalf = k.add([
    k.rect(POKEBALL_SIZE * 2, POKEBALL_SIZE),
    k.pos(from.x, from.y + POKEBALL_SIZE / 2),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(199),
    "pokeball-white",
  ]);

  // Add center button
  const centerBtn = k.add([
    k.circle(POKEBALL_SIZE / 3),
    k.pos(from.x, from.y),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.outline(1, k.Color.fromArray([30, 30, 30])),
    k.z(201),
    "pokeball-center",
  ]);

  // Create cleanup function using shared utility
  const cleanup = createCleanup(pokeball, whiteHalf, centerBtn);

  // Movement and collision detection using shared lifetime tracker
  const lifetimeTracker = createLifetimeTracker();

  pokeball.onUpdate(() => {
    // Check lifetime expiration
    if (lifetimeTracker.update(k.dt())) {
      cleanup();
      return;
    }

    // Move pokeball
    pokeball.pos.x += pokeball.velocity.x * k.dt();
    pokeball.pos.y += pokeball.velocity.y * k.dt();

    // Update visual parts
    whiteHalf.pos.x = pokeball.pos.x;
    whiteHalf.pos.y = pokeball.pos.y + POKEBALL_SIZE / 2;
    centerBtn.pos.x = pokeball.pos.x;
    centerBtn.pos.y = pokeball.pos.y;
  });

  // Collision with creatures
  pokeball.onCollide("creature", (creature: GameObj) => {
    onHit(creature);
    cleanup();
  });

  return pokeball;
}

/**
 * Create capture effect at creature position
 */
export function createCaptureEffect(
  k: KAPLAYCtx,
  pos: { x: number; y: number }
): void {
  // Create expanding ring effect
  const ring = k.add([
    k.circle(10),
    k.pos(pos.x, pos.y),
    k.anchor("center"),
    k.color(255, 215, 0), // Gold color
    k.opacity(1),
    k.outline(3, k.Color.fromArray([255, 180, 0])),
    k.z(300),
  ]);

  // Create sparkle particles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const sparkle = k.add([
      k.circle(3),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.color(255, 255, 200),
      k.opacity(1),
      k.z(301),
    ]);

    const speed = 60;
    sparkle.onUpdate(() => {
      sparkle.pos.x += Math.cos(angle) * speed * k.dt();
      sparkle.pos.y += Math.sin(angle) * speed * k.dt();
      sparkle.opacity -= k.dt() * 2;
      if (sparkle.opacity <= 0) sparkle.destroy();
    });
  }

  // Animate ring expansion and fade
  ring.onUpdate(() => {
    ring.radius += 80 * k.dt();
    ring.opacity -= k.dt() * 2;
    if (ring.opacity <= 0) ring.destroy();
  });
}
