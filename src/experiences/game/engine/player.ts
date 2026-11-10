import * as THREE from "three";
import { COL, mat, mesh } from "./kit";
import { groundHeight, clamp } from "./terrain";
import type { Obstacle } from "./ctx";

export interface DriveInput {
  throttle: number; // -1..1
  steer: number; // -1..1 (positive = left)
  boost: boolean;
  jump: boolean; // edge
}

export interface DriveEvents {
  bump: number;
  landed: number;
  jumped: boolean;
  splash: boolean;
  airtime: number;
}

const box = new THREE.BoxGeometry(1, 1, 1);
const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 14).rotateZ(Math.PI / 2);

/** Box stretched between two points (limbs). */
function limb(a: THREE.Vector3, b: THREE.Vector3, w: number, material: THREE.Material) {
  const m = mesh(box, material);
  const d = b.clone().sub(a);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.scale.set(w, w, d.length());
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize());
  return m;
}

export class Scooter {
  root = new THREE.Group();
  body = new THREE.Group();
  steerGroup = new THREE.Group();
  wheels: THREE.Mesh[] = [];
  headlight: THREE.SpotLight;
  headlightMat: THREE.MeshLambertMaterial;
  rider = new THREE.Group();

  // state
  pos = new THREE.Vector3();
  vel = new THREE.Vector2(); // x,z world
  yaw = 0;
  vy = 0;
  grounded = true;
  air = 0;
  lean = 0;
  pitch = 0;
  susp = 0;
  suspV = 0;
  steerVis = 0;
  slip = 0;
  forwardSpeed = 0;
  yawRate = 0;
  sinking = 0;

  constructor() {
    const yellow = mat(COL.yellow);
    const cream = mat("#f6f1e7");
    const dark = mat("#22252c");
    const chrome = mat("#c9ced6");
    const b = this.body;
    const part = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rx = 0, parent: THREE.Object3D = b) => {
      const o = mesh(geo, m);
      o.position.set(x, y, z);
      o.scale.set(sx, sy, sz);
      o.rotation.x = rx;
      parent.add(o);
      return o;
    };
    const sphere = new THREE.SphereGeometry(1, 12, 9);
    // scooter body
    part(box, dark, 0, 0.36, -0.05, 0.5, 0.1, 1.0);
    part(sphere, yellow, 0, 0.66, 0.5, 0.36, 0.34, 0.62);
    part(box, yellow, 0, 0.5, 0.35, 0.56, 0.3, 0.9);
    part(box, mat("#5a3a26"), 0, 0.98, 0.38, 0.4, 0.12, 0.78);
    part(box, yellow, 0, 0.78, -0.56, 0.62, 0.86, 0.12, -0.22);
    part(box, cream, 0, 0.42, -0.58, 0.64, 0.12, 0.16, -0.22);
    part(sphere, yellow, 0, 0.42, -0.74, 0.22, 0.2, 0.36);
    part(box, chrome, 0, 0.94, 0.86, 0.36, 0.06, 0.3);
    const tail = part(box, mat("#ff4a3a", { emissive: "#ff2a1a", ei: 0.6 }), 0, 0.75, 1.1, 0.2, 0.08, 0.05);
    void tail;
    // steering column + handlebar + headlight + front wheel
    this.steerGroup.position.set(0, 0, -0.66);
    b.add(this.steerGroup);
    const s = this.steerGroup;
    part(box, yellow, 0, 0.95, -0.04, 0.12, 0.7, 0.12, -0.2, s);
    part(box, chrome, 0, 1.3, 0.02, 0.92, 0.06, 0.06, 0, s);
    part(box, dark, -0.43, 1.3, 0.02, 0.12, 0.09, 0.09, 0, s);
    part(box, dark, 0.43, 1.3, 0.02, 0.12, 0.09, 0.09, 0, s);
    part(box, yellow, 0, 1.25, -0.06, 0.3, 0.18, 0.22, 0, s);
    this.headlightMat = new THREE.MeshLambertMaterial({ color: "#fff7d6", emissive: "#fff2c0", emissiveIntensity: 0.4 });
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12).rotateX(Math.PI / 2), this.headlightMat);
    hl.position.set(0, 1.25, -0.18);
    s.add(hl);
    for (const sx of [-1, 1]) {
      part(box, chrome, sx * 0.36, 1.48, 0.06, 0.02, 0.3, 0.02, 0, s);
      part(sphere, chrome, sx * 0.38, 1.62, 0.06, 0.07, 0.05, 0.03, 0, s);
    }
    const fw = mesh(wheelGeo, dark);
    fw.position.set(0, 0.26, -0.08);
    s.add(fw);
    this.wheels.push(fw);
    part(box, yellow, 0, 0.5, -0.08, 0.2, 0.08, 0.5, 0, s);
    const rw = mesh(wheelGeo, dark);
    rw.position.set(0, 0.26, 0.62);
    b.add(rw);
    this.wheels.push(rw);
    for (const w of this.wheels) {
      const hub = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8).rotateZ(Math.PI / 2), chrome);
      w.add(hub);
    }
    // headlight beam
    this.headlight = new THREE.SpotLight("#ffe7b0", 0, 28, 0.55, 0.6, 1.2);
    this.headlight.position.set(0, 1.25, -0.9);
    this.headlight.target.position.set(0, 0, -10);
    b.add(this.headlight, this.headlight.target);

    // rider: Alex
    const skin = mat("#c99a76");
    const tee = mat("#f6f1e7");
    const shorts = mat("#24345e");
    const hair = mat("#2a1f1a");
    const r = this.rider;
    b.add(r);
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    part(box, shorts, 0, 1.12, 0.38, 0.42, 0.22, 0.36, 0, r);
    part(box, tee, 0, 1.46, 0.3, 0.42, 0.5, 0.26, -0.18, r);
    part(box, mat(COL.cobalt), 0, 1.46, 0.43, 0.43, 0.08, 0.02, -0.18, r);
    part(box, skin, 0, 1.76, 0.22, 0.12, 0.1, 0.12, 0, r);
    const head = new THREE.Group();
    head.position.set(0, 1.92, 0.2);
    r.add(head);
    part(box, skin, 0, 0, 0, 0.27, 0.3, 0.28, 0, head);
    part(box, hair, 0, 0.15, 0.03, 0.29, 0.1, 0.3, 0, head);
    part(box, hair, 0, 0.04, 0.14, 0.29, 0.22, 0.06, 0, head);
    part(box, mat("#101215"), 0, 0.03, -0.145, 0.27, 0.07, 0.02, 0, head);
    part(box, skin, 0, -0.04, -0.15, 0.05, 0.06, 0.03, 0, head);
    for (const sx of [-1, 1]) {
      // arms: shoulder to grip
      r.add(limb(V(sx * 0.25, 1.62, 0.28), V(sx * 0.32, 1.42, -0.12), 0.11, tee));
      r.add(limb(V(sx * 0.32, 1.42, -0.12), V(sx * 0.42, 1.3, -0.62), 0.09, skin));
      // legs: hip to knee to foot
      r.add(limb(V(sx * 0.15, 1.1, 0.3), V(sx * 0.2, 1.02, -0.18), 0.15, shorts));
      r.add(limb(V(sx * 0.2, 1.0, -0.18), V(sx * 0.18, 0.46, -0.22), 0.11, skin));
      part(box, mat("#f6f1e7"), sx * 0.18, 0.45, -0.28, 0.12, 0.08, 0.24, 0, r);
    }
    b.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
    });
    this.root.add(b);
  }

  forward() {
    return new THREE.Vector2(-Math.sin(this.yaw), -Math.cos(this.yaw));
  }

  place(x: number, z: number, yaw: number) {
    this.pos.set(x, groundHeight(x, z), z);
    this.vel.set(0, 0);
    this.vy = 0;
    this.yaw = yaw;
    this.sinking = 0;
    this.grounded = true;
  }

  update(dt: number, inp: DriveInput, obstacles: Obstacle[]): DriveEvents {
    const ev: DriveEvents = { bump: 0, landed: 0, jumped: false, splash: false, airtime: 0 };
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    let vf = this.vel.x * fx + this.vel.y * fz;

    // steering: needs speed, reverses when backing up
    const sp = Math.abs(vf);
    const steerAuth = clamp(sp / 5, 0, 1) * (1 - 0.3 * clamp((sp - 12) / 12, 0, 1));
    const targetRate = inp.steer * 2.5 * steerAuth * Math.sign(vf || 1) * (this.grounded ? 1 : 0.4);
    this.yawRate += (targetRate - this.yawRate) * Math.min(1, dt * 10);
    this.yaw += this.yawRate * dt;

    // decompose velocity against the new heading -> slip happens naturally
    const nfx = -Math.sin(this.yaw);
    const nfz = -Math.cos(this.yaw);
    const rx = -nfz;
    const rz = nfx;
    vf = this.vel.x * nfx + this.vel.y * nfz;
    let vr = this.vel.x * rx + this.vel.y * rz;

    const maxF = inp.boost ? 25 : 16;
    if (this.grounded) {
      if (inp.throttle > 0) {
        if (vf < 0) vf += 26 * dt;
        else vf += inp.throttle * (inp.boost ? 20 : 13) * dt * clamp(1 - vf / maxF, 0, 1) + (vf > maxF ? -6 * dt : 0);
      } else if (inp.throttle < 0) {
        if (vf > 0.4) vf -= 26 * dt;
        else vf = Math.max(-6, vf + inp.throttle * 9 * dt);
      } else {
        vf -= Math.sign(vf) * Math.min(Math.abs(vf), 3.5 * dt);
      }
      vf *= Math.exp(-0.15 * dt);
      const drifting = Math.abs(inp.steer) > 0.5 && sp > 10;
      const grip = drifting ? (inp.boost ? 1.6 : 3.2) : 9;
      vr *= Math.exp(-grip * dt);
    }
    this.slip = vr;
    this.forwardSpeed = vf;
    this.vel.set(nfx * vf + rx * vr, nfz * vf + rz * vr);

    // integrate
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.y * dt;

    // collisions (2D)
    const R = 0.8;
    for (const o of obstacles) {
      const dx = this.pos.x - o.x;
      const dz = this.pos.z - o.z;
      if (o.kind === "circle") {
        const d = Math.hypot(dx, dz);
        if (d < o.r + R && d > 1e-4) this.resolve(dx / d, dz / d, o.r + R - d, ev);
      } else {
        if (Math.abs(dx) > o.hw + o.hd + R || Math.abs(dz) > o.hw + o.hd + R) continue;
        const c = Math.cos(o.ry);
        const s = Math.sin(o.ry);
        const lx = dx * c - dz * s;
        const lz = dx * s + dz * c;
        const cx = clamp(lx, -o.hw, o.hw);
        const cz = clamp(lz, -o.hd, o.hd);
        let nx = lx - cx;
        let nz = lz - cz;
        let d = Math.hypot(nx, nz);
        let pen: number;
        if (d < 1e-4) {
          // center inside: push out along the shallow axis
          const px = o.hw - Math.abs(lx);
          const pz = o.hd - Math.abs(lz);
          if (px < pz) {
            nx = Math.sign(lx) || 1;
            nz = 0;
            pen = px + R;
          } else {
            nx = 0;
            nz = Math.sign(lz) || 1;
            pen = pz + R;
          }
          d = 1;
        } else {
          if (d >= R) continue;
          pen = R - d;
          nx /= d;
          nz /= d;
        }
        // back to world space
        const wx = nx * c + nz * s;
        const wz = -nx * s + nz * c;
        this.resolve(wx, wz, pen, ev);
      }
    }

    // vertical
    const gh = groundHeight(this.pos.x, this.pos.z);
    if (this.grounded) {
      if (inp.jump) {
        this.vy = 7.5 + Math.max(0, this.vy);
        this.grounded = false;
        ev.jumped = true;
      } else if (this.pos.y - gh > 0.3) {
        // ground fell away (ramp lip, ledge): keep the climb rate and fly
        this.grounded = false;
      } else {
        const ahead = groundHeight(this.pos.x + this.vel.x * 0.05, this.pos.z + this.vel.y * 0.05);
        this.vy = (ahead - gh) / 0.05;
        this.pos.y = gh;
      }
    }
    if (!this.grounded) {
      this.vy -= 24 * dt;
      this.pos.y += this.vy * dt;
      this.air += dt;
      if (this.pos.y <= gh) {
        ev.landed = Math.max(0, -this.vy);
        ev.airtime = this.air;
        this.suspV -= Math.min(6, -this.vy * 0.35);
        this.pos.y = gh;
        this.vy = 0;
        this.grounded = true;
        this.air = 0;
      }
    }

    // water
    if (gh < 0.15 && this.pos.y < 0.4) {
      this.vel.multiplyScalar(Math.exp(-2.5 * dt));
      if (gh < -0.8) {
        if (this.sinking === 0) ev.splash = true;
        this.sinking += dt;
      }
    }

    // visual: lean, pitch, suspension, wheel spin, steer
    const leanTarget = clamp(-this.yawRate * Math.abs(vf) * 0.045, -0.55, 0.55) * (this.grounded ? 1 : 0.5);
    this.lean += (leanTarget - this.lean) * Math.min(1, dt * 8);
    const e = 0.9;
    const slope = (groundHeight(this.pos.x + nfx * e, this.pos.z + nfz * e) - groundHeight(this.pos.x - nfx * e, this.pos.z - nfz * e)) / (2 * e);
    const pitchTarget = this.grounded ? Math.atan(slope) : clamp(this.vy * 0.04, -0.4, 0.3);
    this.pitch += (pitchTarget - this.pitch) * Math.min(1, dt * 10);
    this.suspV += (-this.susp * 160 - this.suspV * 12) * dt;
    if (this.grounded && sp > 3) this.suspV += (Math.random() - 0.5) * sp * 0.05;
    this.susp += this.suspV * dt;
    this.steerVis += (inp.steer * 0.45 - this.steerVis) * Math.min(1, dt * 10);
    for (const w of this.wheels) w.rotation.x -= (vf * dt) / 0.26;

    this.root.position.copy(this.pos);
    this.root.rotation.set(0, this.yaw, 0);
    this.body.rotation.set(this.pitch, 0, this.lean, "YXZ");
    this.body.position.y = clamp(this.susp, -0.2, 0.2);
    this.steerGroup.rotation.y = this.steerVis;
    this.rider.rotation.x = clamp(vf / maxF, 0, 1) * -0.12 + (inp.boost ? -0.06 : 0);
    return ev;
  }

  private resolve(nx: number, nz: number, pen: number, ev: DriveEvents) {
    this.pos.x += nx * pen;
    this.pos.z += nz * pen;
    const vn = this.vel.x * nx + this.vel.y * nz;
    if (vn < 0) {
      this.vel.x -= 1.25 * vn * nx;
      this.vel.y -= 1.25 * vn * nz;
      this.vel.multiplyScalar(0.92);
      ev.bump = Math.max(ev.bump, -vn);
    }
  }
}
