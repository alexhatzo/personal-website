import type { KAPLAYCtx, GameObj, Direction } from "../types";
import { SIZES } from "../constants";

// Shared state for mobile controls
export const mobileInput = {
  left: false,
  right: false,
  up: false,
  down: false,
};

// Shared state for action button
export const mobileAction = {
  pressed: false,
  callback: null as (() => void) | null,
  label: "Chat" as string,
  trigger() {
    if (this.callback) {
      this.callback();
    }
  },
  setLabel(newLabel: string) {
    this.label = newLabel;
  },
  setCallback(cb: (() => void) | null) {
    this.callback = cb;
  },
};

export interface PlayerOptions {
  onAction?: () => void;
}

/**
 * Create player entity with movement controls
 */
export function createPlayer(
  k: KAPLAYCtx,
  x: number,
  y: number,
  initialDir: Direction = "down",
  options: PlayerOptions = {}
): GameObj {
  const player = k.add([
    k.sprite("player", { anim: `idle-${initialDir}` }),
    k.pos(x, y),
    k.area({ scale: 0.5 }),
    k.body(),
    k.anchor("center"),
    k.z(100),
    "player",
  ]);

  let currentAnim = `idle-${initialDir}`;
  let direction: Direction = initialDir;

  // Register action callback for mobile controls
  if (options.onAction) {
    mobileAction.callback = options.onAction;

    // Listen for spacebar press (action key)
    k.onKeyPress("space", () => {
      if (player.exists() && options.onAction) {
        options.onAction();
      }
    });
  }

  // Movement update loop
  k.onUpdate(() => {
    if (!player.exists()) return;

    let moving = false;
    let dx = 0;
    let dy = 0;

    // Check keyboard and mobile input
    if (k.isKeyDown("left") || k.isKeyDown("a") || mobileInput.left) {
      dx = -SIZES.PLAYER_SPEED * k.dt();
      direction = "left";
      moving = true;
    }
    if (k.isKeyDown("right") || k.isKeyDown("d") || mobileInput.right) {
      dx = SIZES.PLAYER_SPEED * k.dt();
      direction = "right";
      moving = true;
    }
    if (k.isKeyDown("up") || k.isKeyDown("w") || mobileInput.up) {
      dy = -SIZES.PLAYER_SPEED * k.dt();
      direction = "up";
      moving = true;
    }
    if (k.isKeyDown("down") || k.isKeyDown("s") || mobileInput.down) {
      dy = SIZES.PLAYER_SPEED * k.dt();
      direction = "down";
      moving = true;
    }

    // Apply movement
    player.move(dx / k.dt(), dy / k.dt());

    // Update animation
    const newAnim = moving ? `walk-${direction}` : `idle-${direction}`;
    if (newAnim !== currentAnim) {
      player.play(newAnim);
      currentAnim = newAnim;
    }
  });

  return player;
}

/**
 * Setup camera to follow player within world bounds
 */
export function setupCamera(
  k: KAPLAYCtx,
  player: GameObj,
  worldW: number,
  worldH: number
): void {
  player.onUpdate(() => {
    const camX = Math.max(k.width() / 2, Math.min(worldW - k.width() / 2, player.pos.x));
    const camY = Math.max(k.height() / 2, Math.min(worldH - k.height() / 2, player.pos.y));
    k.setCamPos(camX, camY);
  });
}

/**
 * Clamp player position to world/room bounds
 */
export function setupWorldBounds(
  _k: KAPLAYCtx,
  player: GameObj,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): void {
  player.onUpdate(() => {
    player.pos.x = Math.max(minX, Math.min(maxX, player.pos.x));
    player.pos.y = Math.max(minY, Math.min(maxY, player.pos.y));
  });
}
