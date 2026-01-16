import type { KAPLAYCtx } from "./types";

// ============================================================================
// Sprite Animation Types
// ============================================================================

type AnimFrame = number | { from: number; to: number; loop: boolean; speed: number };

interface SpriteAnimConfig {
  sliceX: number;
  sliceY: number;
  anims: Record<string, AnimFrame>;
}

/**
 * Configuration for a sprite type (e.g., mushrooms, slimes, ghosts)
 * All sprites of the same type share the same animation structure
 */
export interface SpriteTypeConfig {
  /** Individual sprite names that belong to this type */
  sprites: string[];
  /** File paths corresponding to each sprite (same order as sprites) */
  paths: string[];
  /** Animation configuration shared by all sprites of this type */
  animConfig: SpriteAnimConfig;
  /** Animations to randomly cycle through while idle */
  standingAnims: string[];
  /** Animation to play when captured/interacted with */
  deathAnim: string;
}

// ============================================================================
// Sprite Registry - Add new sprite types here
// ============================================================================

/**
 * Registry of all creature sprite types
 * To add a new sprite type:
 * 1. Add sprite files to public/sprites/
 * 2. Add a new entry here with sprites, paths, animConfig, standingAnims, deathAnim
 */
export const SPRITE_REGISTRY: Record<string, SpriteTypeConfig> = {
  mushroom: {
    sprites: ["mushroom-green", "mushroom-blue", "mushroom-pink", "mushroom-purple"],
    paths: [
      "/sprites/Free Mushrooms/Mushroom_Spotted.png",
      "/sprites/Free Mushrooms/Mushroom_Reg.png",
      "/sprites/Free Mushrooms/Mushroom_spike.png",
      "/sprites/Free Mushrooms/Mush_Poison.png",
    ],
    animConfig: {
      sliceX: 10,
      sliceY: 5,
      anims: {
        idle: { from: 0, to: 3, loop: true, speed: 6 },
        heart: { from: 6, to: 9, loop: true, speed: 6 },
        jump: { from: 10, to: 18, loop: true, speed: 10 },
        swing: { from: 20, to: 29, loop: true, speed: 10 },
        spike: { from: 30, to: 39, loop: true, speed: 10 },
        die: { from: 40, to: 47, loop: false, speed: 12 },
      },
    },
    standingAnims: ["idle", "heart", "jump", "swing", "spike"],
    deathAnim: "die",
  },
  goblin: {
    sprites: ["goblin"],
    paths: ["/sprites/Heroes Fantasy_Goblin/goblin_spritesheet.png"],
    animConfig: {
      sliceX: 14,
      sliceY: 6,
      anims: {
        idle: { from: 0, to: 5, loop: true, speed: 8 },
        walk: { from: 14, to: 21, loop: true, speed: 10 },
        jump: { from: 28, to: 33, loop: true, speed: 10 },
        attack: { from: 42, to: 55, loop: true, speed: 12 },
        run: { from: 56, to: 63, loop: true, speed: 12 },
        die: { from: 70, to: 72, loop: false, speed: 8 },
      },
    },
    standingAnims: ["idle", "walk", "run"],
    deathAnim: "die",
  },
  mouse: {
    sprites: ["mouse"],
    paths: ["/sprites/MouseAdventure/mouse_walk-imageonline.co-merged (1).png"],
    animConfig: {
      sliceX: 5,
      sliceY: 3,
      anims: {
        idle: { from: 0, to: 4, loop: true, speed: 8 },
        jump: { from: 5, to: 7, loop: true, speed: 10 },
        walk: { from: 10, to: 14, loop: true, speed: 10 },
      },
    },
    standingAnims: ["idle", "walk"],
    deathAnim: "jump",
  },
  // Red and green blobs have 5 columns
  blobRG: {
    sprites: ["blob-red", "blob-green"],
    paths: [
      "/sprites/slime_pack/red_blob.png",
      "/sprites/slime_pack/green_blob.png",
    ],
    animConfig: {
      sliceX: 5,
      sliceY: 3,
      anims: {
        idle: { from: 0, to: 3, loop: true, speed: 6 },
        jump: { from: 5, to: 8, loop: true, speed: 8 },
        walk: { from: 10, to: 13, loop: true, speed: 8 },
      },
    },
    standingAnims: ["idle", "walk"],
    deathAnim: "jump",
  },
  // Blue blob has 4 columns
  blobBlue: {
    sprites: ["blob-blue"],
    paths: ["/sprites/slime_pack/blue_blob.png"],
    animConfig: {
      sliceX: 4,
      sliceY: 3,
      anims: {
        idle: { from: 0, to: 3, loop: true, speed: 6 },
        jump: { from: 4, to: 7, loop: true, speed: 8 },
        walk: { from: 8, to: 11, loop: true, speed: 8 },
      },
    },
    standingAnims: ["idle", "walk"],
    deathAnim: "jump",
  },
  elephant: {
    sprites: ["elephant"],
    paths: ["/sprites/tile_0159-removebg-preview.png"],
    animConfig: {
      sliceX: 1,
      sliceY: 1,
      anims: {
        idle: 0, // Single frame sprite
      },
    },
    standingAnims: ["idle"],
    deathAnim: "idle",
  },
  bat: {
    sprites: ["bat"],
    paths: ["/sprites/Bat/Bat.png"],
    animConfig: {
      sliceX: 4,
      sliceY: 1,
      anims: {
        fly: { from: 0, to: 3, loop: true, speed: 10 },
      },
    },
    standingAnims: ["fly"],
    deathAnim: "fly",
  },
};

// ============================================================================
// Sprite Registry Helpers
// ============================================================================

/**
 * Get the sprite type config for a given sprite name
 */
export function getSpriteTypeForSprite(spriteName: string): SpriteTypeConfig | null {
  for (const config of Object.values(SPRITE_REGISTRY)) {
    if (config.sprites.includes(spriteName)) {
      return config;
    }
  }
  return null;
}

/**
 * Get the sprite type key for a given sprite name
 */
export function getSpriteTypeKey(spriteName: string): string | null {
  for (const [key, config] of Object.entries(SPRITE_REGISTRY)) {
    if (config.sprites.includes(spriteName)) {
      return key;
    }
  }
  return null;
}

/**
 * Get all sprite names for a given sprite type
 */
export function getSpritesForType(spriteType: string): string[] {
  return SPRITE_REGISTRY[spriteType]?.sprites ?? [];
}

// ============================================================================
// Font Loading
// ============================================================================

/**
 * Load game fonts and set default
 */
export function loadFonts(k: KAPLAYCtx): void {
  // Load a clean, legible pixel font from Google Fonts
  k.loadFont("gameFont", "https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2");
}

// ============================================================================
// Sprite Loading
// ============================================================================

/**
 * Load all game sprites
 */
export function loadSprites(k: KAPLAYCtx): void {
  // Load fonts first
  loadFonts(k);

  // Player sprite with animations
  k.loadSprite("player", "/sprites/player.png", {
    sliceX: 44,
    sliceY: 4,
    anims: {
      "idle-down": 0,
      "idle-up": 44,
      "idle-left": 88,
      "idle-right": 132,
      "walk-down": { from: 0, to: 3, loop: true, speed: 8 },
      "walk-up": { from: 44, to: 47, loop: true, speed: 8 },
      "walk-left": { from: 88, to: 91, loop: true, speed: 8 },
      "walk-right": { from: 132, to: 135, loop: true, speed: 8 },
    },
  });

  // Tilemap sprite
  k.loadSprite("tiles", "/sprites/tilemap.png", {
    sliceX: 27,
    sliceY: 18,
  });

  // Load all creature sprites from registry
  for (const config of Object.values(SPRITE_REGISTRY)) {
    config.sprites.forEach((spriteName, index) => {
      k.loadSprite(spriteName, config.paths[index], config.animConfig);
    });
  }
}
