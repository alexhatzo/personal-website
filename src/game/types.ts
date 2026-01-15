import type { KAPLAYCtx, GameObj } from "kaplay";

// Re-export kaplay types for convenience
export type { KAPLAYCtx, GameObj };

// Position types
export interface Position {
  x: number;
  y: number;
}

export interface SpawnPosition extends Position {
  dir: Direction;
}

// Direction for player facing
export type Direction = "up" | "down" | "left" | "right";

// Building configuration
export interface BuildingConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  section: SectionType;
  label: string;
  color: readonly [number, number, number];
}

// Section types (portfolio sections)
export type SectionType = "about" | "projects" | "skills" | "experience" | "contact";

// Building content for interiors
export interface BuildingContent {
  title: string;
  lines: string[];
}

// Scene data passed between scenes
export interface CitySceneData {
  x: number;
  y: number;
  dir: Direction;
}

export interface InteriorSceneData {
  returnPos: Position;
}

// Decoration position with optional variant
export interface DecorationPosition extends Position {
  variant?: number;
}

// Car configuration
export interface CarConfig extends Position {
  type: "blue" | "red" | "yellow";
}
