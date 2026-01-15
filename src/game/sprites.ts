import type { KAPLAYCtx } from "./types";

/**
 * Load all game sprites
 */
export function loadSprites(k: KAPLAYCtx): void {
  // Player sprite with animations
  // Sprite sheet is 44 columns x 4 rows
  // Row 0: Down, Row 1: Up, Row 2: Left, Row 3: Right
  k.loadSprite("player", "/sprites/player.png", {
    sliceX: 44,
    sliceY: 4,
    anims: {
      // Idle frames (first frame of each row)
      "idle-down": 0,
      "idle-up": 44,
      "idle-left": 88,
      "idle-right": 132,
      // Walk animations (frames 0-3 of each row)
      "walk-down": { from: 0, to: 3, loop: true, speed: 8 },
      "walk-up": { from: 44, to: 47, loop: true, speed: 8 },
      "walk-left": { from: 88, to: 91, loop: true, speed: 8 },
      "walk-right": { from: 132, to: 135, loop: true, speed: 8 },
    },
  });

  // Tilemap sprite (27 columns x 18 rows = 486 tiles)
  k.loadSprite("tiles", "/sprites/tilemap.png", {
    sliceX: 27,
    sliceY: 18,
  });

  // Mushroom creatures for Experience building
  // Sprite sheets are 10 columns x 6 rows of 32x32 sprites
  // Row 3 (frames 30-32) for full-body idle - frame 33 has extra elements
  const mushroomAnimConfig = {
    sliceX: 10,
    sliceY: 6,
    anims: {
      idle: { from: 30, to: 32, loop: true, speed: 6 },
    },
  };

  k.loadSprite("mushroom-green", "/sprites/Free Mushrooms/Mushroom_Spotted.png", mushroomAnimConfig);
  k.loadSprite("mushroom-blue", "/sprites/Free Mushrooms/Mushroom_Reg.png", mushroomAnimConfig);
  k.loadSprite("mushroom-pink", "/sprites/Free Mushrooms/Mushroom_spike.png", mushroomAnimConfig);
}
