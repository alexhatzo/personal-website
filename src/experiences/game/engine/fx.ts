import * as THREE from "three";

const N = 260;

/** Pooled particles: dust puffs, splashes, pickup sparkles. */
export class Particles {
  mesh: THREE.InstancedMesh;
  private p = new Float32Array(N * 3);
  private v = new Float32Array(N * 3);
  private life = new Float32Array(N);
  private max = new Float32Array(N);
  private size = new Float32Array(N);
  private grav = new Float32Array(N);
  private next = 0;
  private m = new THREE.Matrix4();
  private c = new THREE.Color();

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }), N);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < N; i++) {
      this.m.makeScale(0, 0, 0);
      this.mesh.setMatrixAt(i, this.m);
      this.mesh.setColorAt(i, this.c.set("#ffffff"));
    }
    scene.add(this.mesh);
  }

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color: string, gravity = 0) {
    const i = this.next;
    this.next = (this.next + 1) % N;
    this.p.set([x, y, z], i * 3);
    this.v.set([vx, vy, vz], i * 3);
    this.life[i] = life;
    this.max[i] = life;
    this.size[i] = size;
    this.grav[i] = gravity;
    this.mesh.setColorAt(i, this.c.set(color));
    this.mesh.instanceColor!.needsUpdate = true;
  }

  burst(x: number, y: number, z: number, n: number, color: string, speed = 4, size = 0.15, gravity = 9) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const u = Math.random() * 0.8 + 0.2;
      this.emit(x, y, z, Math.cos(a) * speed * u, speed * (0.6 + Math.random()), Math.sin(a) * speed * u, 0.6 + Math.random() * 0.5, size, color, gravity);
    }
  }

  update(dt: number) {
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.mesh.setMatrixAt(i, this.m.makeScale(0, 0, 0));
        continue;
      }
      const k = i * 3;
      this.v[k + 1] -= this.grav[i] * dt;
      this.v[k] *= 1 - dt * 1.5;
      this.v[k + 2] *= 1 - dt * 1.5;
      this.p[k] += this.v[k] * dt;
      this.p[k + 1] += this.v[k + 1] * dt;
      this.p[k + 2] += this.v[k + 2] * dt;
      const t = Math.max(0, this.life[i] / this.max[i]);
      const s = this.size[i] * (this.grav[i] === 0 ? 1 + (1 - t) * 2.2 : 1) * Math.min(1, t * 3);
      this.m.makeScale(s, s, s).setPosition(this.p[k], this.p[k + 1], this.p[k + 2]);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
