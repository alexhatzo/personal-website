import type { KAPLAYCtx, GameObj } from "../types";
import { calculateDirection, createLifetimeTracker, createCleanup } from "./projectileBase";

const ARROW_SPEED = 250;
const ARROW_LENGTH = 12;
const ARROW_WIDTH = 3;

/**
 * Shoot an arrow toward a target creature
 */
export function shootArrow(
  k: KAPLAYCtx,
  from: { x: number; y: number },
  target: GameObj,
  onHit: (creature: GameObj) => void
): GameObj {
  // Calculate direction to target using shared utility
  const dir = calculateDirection(from, target.pos);

  // Create arrow shaft (rectangle)
  const shaft = k.add([
    k.rect(ARROW_LENGTH, ARROW_WIDTH),
    k.pos(from.x, from.y),
    k.anchor("center"),
    k.rotate(k.rad2deg(dir.angle)),
    k.color(139, 90, 43), // Brown wooden color
    k.outline(1, k.Color.fromArray([80, 50, 20])),
    k.z(200),
    "arrow-shaft",
  ]);

  // Create arrow head (triangle shape using polygon)
  const headSize = 6;
  const arrowHead = k.add([
    k.polygon([
      k.vec2(0, -headSize / 2),
      k.vec2(headSize, 0),
      k.vec2(0, headSize / 2),
    ]),
    k.pos(from.x + dir.x * (ARROW_LENGTH / 2 + headSize / 2), from.y + dir.y * (ARROW_LENGTH / 2 + headSize / 2)),
    k.anchor("center"),
    k.rotate(k.rad2deg(dir.angle)),
    k.color(120, 120, 130), // Metal gray
    k.outline(1, k.Color.fromArray([60, 60, 70])),
    k.z(201),
    "arrow-head",
  ]);

  // Create fletching (feathers at back)
  const fletching = k.add([
    k.polygon([
      k.vec2(0, -4),
      k.vec2(-6, 0),
      k.vec2(0, 4),
    ]),
    k.pos(from.x - dir.x * (ARROW_LENGTH / 2), from.y - dir.y * (ARROW_LENGTH / 2)),
    k.anchor("center"),
    k.rotate(k.rad2deg(dir.angle)),
    k.color(180, 50, 50), // Red feathers
    k.z(199),
    "arrow-fletching",
  ]);

  // Add collision area to shaft
  const arrow = k.add([
    k.rect(ARROW_LENGTH + headSize, ARROW_WIDTH * 2),
    k.pos(from.x, from.y),
    k.anchor("center"),
    k.rotate(k.rad2deg(dir.angle)),
    k.area(),
    k.opacity(0),
    k.z(200),
    "arrow",
    { velocity: { x: dir.x * ARROW_SPEED, y: dir.y * ARROW_SPEED } },
  ]);

  // Create cleanup function using shared utility
  const cleanup = createCleanup(arrow, shaft, arrowHead, fletching);

  // Movement and collision detection using shared lifetime tracker
  const lifetimeTracker = createLifetimeTracker();

  arrow.onUpdate(() => {
    // Check lifetime expiration
    if (lifetimeTracker.update(k.dt())) {
      cleanup();
      return;
    }

    // Move arrow
    arrow.pos.x += arrow.velocity.x * k.dt();
    arrow.pos.y += arrow.velocity.y * k.dt();

    // Update visual parts
    shaft.pos.x = arrow.pos.x;
    shaft.pos.y = arrow.pos.y;
    arrowHead.pos.x = arrow.pos.x + dir.x * (ARROW_LENGTH / 2 + headSize / 2);
    arrowHead.pos.y = arrow.pos.y + dir.y * (ARROW_LENGTH / 2 + headSize / 2);
    fletching.pos.x = arrow.pos.x - dir.x * (ARROW_LENGTH / 2);
    fletching.pos.y = arrow.pos.y - dir.y * (ARROW_LENGTH / 2);
  });

  // Collision with creatures
  arrow.onCollide("creature", (creature: GameObj) => {
    onHit(creature);
    cleanup();
  });

  return arrow;
}

/**
 * Create hit effect when arrow hits creature
 */
export function createArrowHitEffect(
  k: KAPLAYCtx,
  pos: { x: number; y: number }
): void {
  // Create impact burst
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const spark = k.add([
      k.rect(4, 2),
      k.pos(pos.x, pos.y),
      k.anchor("center"),
      k.rotate(k.rand(0, 360)),
      k.color(200, 150, 100),
      k.opacity(1),
      k.z(301),
    ]);

    const speed = 40 + k.rand(0, 20);
    spark.onUpdate(() => {
      spark.pos.x += Math.cos(angle) * speed * k.dt();
      spark.pos.y += Math.sin(angle) * speed * k.dt();
      spark.opacity -= k.dt() * 3;
      if (spark.opacity <= 0) spark.destroy();
    });
  }
}
