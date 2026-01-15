// Verified tile indices from tilemap (27 columns x 18 rows)
// Only including tiles we've actually verified work
export const TILES = {
  // Two-tile trees (top + bottom, stacked vertically)
  // Round green trees
  ROUND_TOP: 233,       // Round tree canopy (top half)
  ROUND_BOTTOM: 260,    // Round tree with trunk (bottom half)
  ROUND_TOP_2: 233,     // Same top, different bottom
  ROUND_BOTTOM_2: 259,  // Variant bottom
  
  // Pine trees (triangular)
  PINE_TOP: 232,        // Pine tree top (triangular)
  PINE_BOTTOM: 261,     // Pine tree trunk (narrow)
  
  // Autumn/orange trees
  AUTUMN_TOP: 313,      // Autumn tree top (orange)
  AUTUMN_BOTTOM: 340,   // Autumn tree trunk
  
  // Single-tile small trees/bushes
  SMALL_PINE: 234,      // Complete small pine
  SMALL_ROUND: 264,     // Complete small round tree
  BUSH_GREEN: 286,      // Green bush
  
  // Interior walls (for rooms only)
  WALL_DARK: 189,       // Dark interior wall
  DOOR: 216,            // Door tile
} as const;

// Game dimensions and settings
export const SIZES = {
  TILE: 16,
  WORLD_W: 640,
  WORLD_H: 480,
  ROOM_W: 280,
  ROOM_H: 220,
  PLAYER_SPEED: 100,
  CANVAS_W: 480,
  CANVAS_H: 320,
} as const;

// CSS Colors (much more reliable than tilemap)
export const CSS_COLORS = {
  // Ground
  GRASS: [124, 172, 96],        // Nice green grass
  GRASS_DARK: [108, 156, 80],   // Darker grass variation
  PLAZA_STONE: [180, 170, 160], // Stone plaza
  ROAD: [80, 80, 90],           // Dark gray road
  ROAD_MARKING: [255, 255, 200],// Yellow road marking
  SIDEWALK: [160, 155, 150],    // Light gray sidewalk
  
  // Decorations (CSS fallback)
  TREE_TRUNK: [100, 70, 50],
  TREE_LEAVES: [80, 140, 60],
  BENCH_WOOD: [139, 90, 43],
  LAMP_POST: [60, 60, 70],
  LAMP_LIGHT: [255, 240, 180],
  CAR_RED: [180, 60, 60],
  CAR_BLUE: [60, 100, 180],
  CAR_YELLOW: [220, 180, 60],
  FOUNTAIN_WATER: [100, 150, 200],
  FOUNTAIN_EDGE: [80, 80, 90],
} as const;

// Building colors [R, G, B]
export const COLORS = {
  ABOUT: [180, 60, 60] as const,
  PROJECTS: [60, 160, 80] as const,
  SKILLS: [60, 120, 180] as const,
  EXPERIENCE: [180, 140, 60] as const,
  CONTACT: [140, 60, 180] as const,
} as const;

// Plaza configuration
export const PLAZA = {
  X: 200,
  Y: 160,
  W: 240,
  H: 160,
} as const;
