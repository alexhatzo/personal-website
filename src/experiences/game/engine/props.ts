import * as THREE from "three";
import { PropSet, RAPIER } from "./physics";
import type { WorldCtx } from "./ctx";

export interface PropItem {
  x: number;
  y: number;
  z: number;
  ry?: number;
  rx?: number;
  rz?: number;
  color?: string;
}

/** Builds a set of identical dynamic props (one InstancedMesh, one rigid body each). */
export function propSet(
  ctx: WorldCtx,
  tag: string,
  geo: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  items: PropItem[],
  collider: () => RAPIER.ColliderDesc,
  opts: { ccd?: boolean; damping?: number; shadow?: boolean } = {},
) {
  const im = new THREE.InstancedMesh(geo, material, items.length);
  im.castShadow = opts.shadow ?? true;
  im.receiveShadow = true;
  im.frustumCulled = false;
  const set = new PropSet(im, tag);
  const e = new THREE.Euler();
  items.forEach((it, i) => {
    const q = new THREE.Quaternion().setFromEuler(e.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0));
    const p = new THREE.Vector3(it.x, it.y, it.z);
    set.bodies.push(ctx.phys.dynamic(p, q, [collider()], opts));
    set.homes.push({ p, q });
    if (it.color) im.setColorAt(i, new THREE.Color(it.color));
  });
  set.sync();
  ctx.scene.add(im);
  ctx.phys.sets.push(set);
  return set;
}

export const cuboid = (hx: number, hy: number, hz: number, density = 1, restitution = 0.15, friction = 0.7) => () =>
  RAPIER.ColliderDesc.cuboid(hx, hy, hz).setDensity(density).setRestitution(restitution).setFriction(friction);
export const ball = (r: number, density = 1, restitution = 0.6) => () =>
  RAPIER.ColliderDesc.ball(r).setDensity(density).setRestitution(restitution).setFriction(0.5);
export const cylinder = (hh: number, r: number, density = 1) => () =>
  RAPIER.ColliderDesc.cylinder(hh, r).setDensity(density).setRestitution(0.1).setFriction(0.8);
