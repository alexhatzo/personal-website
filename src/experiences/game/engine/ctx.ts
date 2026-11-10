import * as THREE from "three";
import { Batch } from "./kit";
import type { Physics } from "./physics";
import type { PortfolioData } from "../../../types/portfolio";

/** 2D footprint the scooter can't drive through. Box: half extents + yaw. Circle: r. */
export type Obstacle = { kind: "box"; x: number; z: number; hw: number; hd: number; ry: number } | { kind: "circle"; x: number; z: number; r: number };

export interface Frame {
  t: number;
  dt: number;
  px: number;
  pz: number;
  speed: number;
  night: number;
  bass: number;
  playing: boolean;
}

export interface Glow {
  mat: THREE.MeshLambertMaterial;
  day: number;
  night: number;
}

export class WorldCtx {
  scene: THREE.Scene;
  phys: Physics;
  data: PortfolioData;
  obstacles: Obstacle[] = [];
  updaters: ((f: Frame) => void)[] = [];
  glows: Glow[] = [];
  /** objects only visible at night (beams, light pools) */
  nightOnly: THREE.Object3D[] = [];
  batches = new Map<string, Batch>();
  disposables: { dispose(): void }[] = [];
  constructor(scene: THREE.Scene, phys: Physics, data: PortfolioData) {
    this.scene = scene;
    this.phys = phys;
    this.data = data;
  }
  batch(key: string, make: () => Batch) {
    let b = this.batches.get(key);
    if (!b) {
      b = make();
      this.batches.set(key, b);
    }
    return b;
  }
  box(x: number, z: number, hw: number, hd: number, ry = 0) {
    this.obstacles.push({ kind: "box", x, z, hw, hd, ry });
  }
  circle(x: number, z: number, r: number) {
    this.obstacles.push({ kind: "circle", x, z, r });
  }
  /** Solid box for the scooter (2D) and for physics props (3D). */
  solid(x: number, y: number, z: number, hw: number, hh: number, hd: number, ry = 0) {
    this.box(x, z, hw, hd, ry);
    this.phys.addStaticBox(x, y, z, hw, hh, hd, ry);
  }
  glow(color: string, day: number, night: number) {
    const m = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: day, flatShading: true });
    this.glows.push({ mat: m, day, night });
    return m;
  }
  flush() {
    this.batches.forEach((b) => this.scene.add(b.build()));
    this.batches.clear();
  }
  /** true if (x,z) is clear of all obstacles by margin m */
  clear(x: number, z: number, m: number) {
    for (const o of this.obstacles) {
      if (o.kind === "circle") {
        if (Math.hypot(x - o.x, z - o.z) < o.r + m) return false;
      } else {
        const dx = x - o.x;
        const dz = z - o.z;
        const c = Math.cos(o.ry);
        const s = Math.sin(o.ry);
        const lx = dx * c - dz * s;
        const lz = dx * s + dz * c;
        if (Math.abs(lx) < o.hw + m && Math.abs(lz) < o.hd + m) return false;
      }
    }
    return true;
  }
}
