import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export type Body = RAPIER.RigidBody;

export interface Home {
  p: THREE.Vector3;
  q: THREE.Quaternion;
}

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const ONE = new THREE.Vector3(1, 1, 1);

/** A group of identical dynamic props rendered as one InstancedMesh. */
export class PropSet {
  mesh: THREE.InstancedMesh;
  bodies: Body[] = [];
  homes: Home[] = [];
  tag: string;
  constructor(mesh: THREE.InstancedMesh, tag: string) {
    this.mesh = mesh;
    this.tag = tag;
  }
  sync() {
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      const t = b.translation();
      const r = b.rotation();
      _m.compose(_p.set(t.x, t.y, t.z), _q.set(r.x, r.y, r.z, r.w), ONE);
      this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/** A single dynamic object driving an Object3D (the big letters). */
export interface SoloProp {
  obj: THREE.Object3D;
  body: Body;
  home: Home;
  tag: string;
}

export class Physics {
  world: RAPIER.World;
  sets: PropSet[] = [];
  solos: SoloProp[] = [];
  scooter: Body;
  private scooterCol: RAPIER.Collider;
  private cool = new Map<number, number>();

  constructor() {
    this.world = new RAPIER.World({ x: 0, y: -18, z: 0 });
    this.world.timestep = 1 / 60;
    this.scooter = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    this.scooterCol = this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.65, 1.05).setTranslation(0, 0.75, 0), this.scooter);
  }

  static async create() {
    await RAPIER.init();
    return new Physics();
  }

  addTrimesh(v: Float32Array, idx: Uint32Array) {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    this.world.createCollider(RAPIER.ColliderDesc.trimesh(v, idx).setFriction(0.9), body);
  }

  addStaticBox(x: number, y: number, z: number, hx: number, hy: number, hz: number, ry = 0) {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z).setRotation(q));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);
  }

  addStaticCylinder(x: number, y: number, z: number, r: number, hh: number) {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z));
    this.world.createCollider(RAPIER.ColliderDesc.cylinder(hh, r), body);
  }

  /** Creates a dynamic body with one or more colliders. */
  dynamic(p: THREE.Vector3, q: THREE.Quaternion, colliders: RAPIER.ColliderDesc[], opts: { ccd?: boolean; damping?: number } = {}) {
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(p.x, p.y, p.z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(opts.damping ?? 0.15)
      .setAngularDamping(0.3)
      .setCcdEnabled(opts.ccd ?? false);
    const b = this.world.createRigidBody(desc);
    for (const c of colliders) this.world.createCollider(c, b);
    return b;
  }

  moveScooter(x: number, y: number, z: number, yaw: number) {
    this.scooter.setNextKinematicTranslation({ x, y, z });
    _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    this.scooter.setNextKinematicRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w });
  }

  teleportScooter(x: number, y: number, z: number) {
    this.scooter.setTranslation({ x, y, z }, true);
  }

  /** Fixed ~1/60 s substeps; `pose(t)` places the kinematic scooter along its path (t in 0..1). */
  step(dt: number, pose: (t: number) => void) {
    const n = Math.max(1, Math.ceil(dt * 60 - 0.01));
    this.world.timestep = dt / n;
    for (let i = 1; i <= n; i++) {
      pose(i / n);
      this.world.step();
    }
    for (const s of this.sets) s.sync();
    for (const s of this.solos) {
      const t = s.body.translation();
      const r = s.body.rotation();
      s.obj.position.set(t.x, t.y, t.z);
      s.obj.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  /** Arcade kick: props the scooter touches get flung along its velocity with lift and spin. Returns kicked masses. */
  kick(vx: number, vz: number, t: number) {
    const speed = Math.hypot(vx, vz);
    const hits: number[] = [];
    if (speed < 2.5) return hits;
    this.world.contactPairsWith(this.scooterCol, (c) => {
      const b = c.parent();
      if (!b || !b.isDynamic() || (this.cool.get(b.handle) ?? 0) > t) return;
      let touching = false;
      this.world.contactPair(this.scooterCol, c, (m) => {
        if (m.numContacts() > 0) touching = true;
      });
      if (!touching) return;
      this.cool.set(b.handle, t + 0.6);
      const m = b.mass();
      const k = Math.min(1.3, speed / 14);
      b.applyImpulse({ x: vx * 0.35 * m * k, y: (2.5 + speed * 0.3) * m * k, z: vz * 0.35 * m * k }, true);
      b.applyTorqueImpulse({ x: (Math.random() - 0.5) * m * 2 * k, y: (Math.random() - 0.5) * m * k, z: (Math.random() - 0.5) * m * 2 * k }, true);
      hits.push(m);
    });
    return hits;
  }

  /** Puts props that fell into the sea back where they started. */
  rescue() {
    const fix = (b: Body, h: Home) => {
      if (b.translation().y < -4) {
        b.setTranslation(h.p, true);
        b.setRotation(h.q, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    };
    for (const s of this.sets) s.bodies.forEach((b, i) => fix(b, s.homes[i]));
    for (const s of this.solos) fix(s.body, s.home);
  }

  dispose() {
    this.world.free();
  }
}

export const tilt = (b: Body) => {
  const r = b.rotation();
  return 1 - 2 * (r.x * r.x + r.z * r.z); // world-up component of the body's up axis
};

export { RAPIER };
