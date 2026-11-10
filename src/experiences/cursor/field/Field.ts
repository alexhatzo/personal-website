import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  FloatType,
  HalfFloatType,
  LinearFilter,
  PerspectiveCamera,
  Points,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { GPUComputationRenderer, type Variable } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import type { Shape } from "./shapes";
import {
  displayFragment,
  pointsFragment,
  pointsVertex,
  positionShader,
  quadVertex,
  trailFragment,
  velocityShader,
} from "./shaders";

export type Pointer = { x: number; y: number; vx: number; vy: number; active: number; down: boolean; downAt: number };
type Rect = { x: number; y: number; w: number; h: number };

const FOV = 35;
const VIEW_H = 10; // world units visible vertically at z = 0

// Pixel regions the formation fits into. Mirrors the panel / sheet geometry in cursor.css.
export function regionFor(W: number, H: number, active: boolean): Rect {
  if (W < 760) {
    return active
      ? { x: W * 0.12, y: H * 0.075, w: W * 0.76, h: H * 0.31 }
      : { x: W * 0.06, y: H * 0.26, w: W * 0.88, h: H * 0.26 };
  }
  if (!active) return { x: W * 0.1, y: H * 0.3, w: W * 0.8, h: H * 0.36 };
  const panel = Math.min(500, Math.max(340, W * 0.34));
  const right = W - 24 - panel - 40;
  return { x: W * 0.05, y: H * 0.26, w: right - W * 0.05, h: H * 0.48 };
}

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export class Field {
  readonly count: number;
  private renderer: WebGLRenderer;
  private camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private scene = new Scene();
  private gpu: GPUComputationRenderer;
  private posVar: Variable;
  private velVar: Variable;
  private points: Points;
  private pMat: ShaderMaterial;
  private rtCur: WebGLRenderTarget;
  private rtAcc: [WebGLRenderTarget, WebGLRenderTarget];
  private accIdx = 0;
  private trail: FullScreenQuad;
  private display: FullScreenQuad;
  private textures = new Map<string, { tex: DataTexture; shape: Shape }>();
  private cloud: DataTexture;
  private fromId = "cloud";
  private toId = "cloud";
  private toActive = false;
  private fromActive = false;
  private morphT = 99;
  private time = 0;
  private W = 1;
  private H = 1;
  private accent = hex("#ff6a3d");
  private accentGoal = hex("#ff6a3d");
  private camPos = new Vector2();
  private hold = 0;
  private shockT = 99;
  private snapNext = false;
  private fade = { t: 1, pending: null as null | (() => void) };
  private focus = new Vector4();
  private focusGoal = -1;
  private idle = 0;

  constructor(canvas: HTMLCanvasElement, opts: { side: number; reduced: boolean }) {
    this.reduced = opts.reduced;
    const side = opts.side;
    this.count = side * side;
    const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    this.renderer = renderer;
    renderer.setClearColor(0x050506, 1);
    renderer.autoClear = false;

    this.camera.position.set(0, 0, VIEW_H / 2 / Math.tan((FOV * Math.PI) / 360));

    this.gpu = new GPUComputationRenderer(side, side, renderer);
    const seeds = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) seeds[i] = i % 13 === 0 ? -1 - Math.random() : 0.001 + Math.random();
    this.seeds = seeds;

    const cloudData = new Float32Array(this.count * 4);
    for (let i = 0; i < this.count; i++) {
      // Intro: a deep, sparse drift of dust that the wordmark condenses out of.
      const a = Math.random() * Math.PI * 2, r = 2 + Math.sqrt(Math.random()) * 11;
      cloudData.set([Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.8, -Math.random() * 14 + 2, 0.05], i * 4);
    }
    this.cloud = this.dataTex(cloudData);
    const pos0 = this.gpu.createTexture();
    (pos0.image.data as Float32Array).set(cloudData);
    const vel0 = this.gpu.createTexture();

    this.velVar = this.gpu.addVariable("tVel", velocityShader, vel0);
    this.posVar = this.gpu.addVariable("tPos", positionShader, pos0);
    this.gpu.setVariableDependencies(this.velVar, [this.posVar, this.velVar]);
    this.gpu.setVariableDependencies(this.posVar, [this.posVar, this.velVar]);
    const ident = new Vector3(0, 0, 1);
    Object.assign(this.velVar.material.uniforms, {
      tFrom: { value: this.cloud },
      tTo: { value: this.cloud },
      uFromX: { value: ident.clone() },
      uToX: { value: ident.clone() },
      uMorphT: { value: 99 },
      uTime: { value: 0 },
      uDt: { value: 0.016 },
      uPointer: { value: new Vector3(0, 0, 0) },
      uPointerVel: { value: new Vector2() },
      uRadius: { value: 0.9 },
      uHold: { value: 0 },
      uShock: { value: new Vector4(0, 0, 0, 0) },
      uBurst: { value: new Vector3() },
      uIdle: { value: 0 },
      uFocus: { value: this.focus },
      uCalm: { value: opts.reduced ? 1 : 0 },
      uSnap: { value: 0 },
      uSpin: { value: 0 },
    });
    Object.assign(this.posVar.material.uniforms, {
      uDt: { value: 0.016 },
      uSnap: { value: 0 },
      tTo: { value: this.cloud },
      uToX: { value: ident.clone() },
      uSpin: { value: 0 },
    });
    const err = this.gpu.init();
    if (err) throw new Error(err);

    const geo = new BufferGeometry();
    const ref = new Float32Array(this.count * 2);
    for (let i = 0; i < this.count; i++) {
      ref[i * 2] = ((i % side) + 0.5) / side;
      ref[i * 2 + 1] = (Math.floor(i / side) + 0.5) / side;
    }
    geo.setAttribute("position", new BufferAttribute(new Float32Array(this.count * 3), 3));
    geo.setAttribute("aRef", new BufferAttribute(ref, 2));
    geo.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    this.pMat = new ShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      uniforms: {
        tPos: { value: null },
        tVel: { value: null },
        uSize: { value: side > 300 ? 2.3 : 2.8 },
        uPR: { value: 1 },
        uBase: { value: hex("#efe8dc") },
        uAccent: { value: this.accent },
        uPointer: { value: this.velVar.material.uniforms.uPointer.value },
        uRadius: { value: 0.9 },
        uGain: { value: 0.16 },
        uOpacity: { value: 1 },
      },
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    this.points = new Points(geo, this.pMat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    const rt = () => new WebGLRenderTarget(1, 1, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });
    this.rtCur = rt();
    this.rtAcc = [rt(), rt()];
    this.trail = new FullScreenQuad(
      new ShaderMaterial({
        vertexShader: quadVertex,
        fragmentShader: trailFragment,
        uniforms: { tCur: { value: null }, tPrev: { value: null }, uDecay: { value: 0.86 } },
        depthTest: false,
      }),
    );
    this.display = new FullScreenQuad(
      new ShaderMaterial({
        vertexShader: quadVertex,
        fragmentShader: displayFragment,
        uniforms: {
          tAccum: { value: null },
          uRes: { value: new Vector2() },
          uLight: { value: new Vector2(0.5, 0.5) },
          uLightAmt: { value: 0 },
          uAccent: { value: this.accent },
          uTime: { value: 0 },
        },
        depthTest: false,
      }),
    );
  }

  readonly seeds: Float32Array;
  private reduced: boolean;

  static supported() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      return !!gl && !!gl.getExtension("EXT_color_buffer_float");
    } catch {
      return false;
    }
  }

  private dataTex(data: Float32Array) {
    const side = Math.sqrt(this.count);
    const t = new DataTexture(data, side, side, RGBAFormat, FloatType);
    t.needsUpdate = true;
    return t;
  }

  setShapes(shapes: Record<string, Shape>) {
    for (const [id, shape] of Object.entries(shapes)) this.textures.set(id, { tex: this.dataTex(shape.data), shape });
  }

  // World-space transform (offset xy, scale) that fits a shape into the current pixel region.
  private xform(id: string, active: boolean) {
    const entry = this.textures.get(id);
    if (!entry) return new Vector3(0, 0, 1);
    const { W, H } = this;
    const r = regionFor(W, H, active);
    const [x0, y0, x1, y1] = entry.shape.bbox;
    const k = VIEW_H / H;
    const s = Math.min((r.w * k) / (x1 - x0), (r.h * k) / (y1 - y0));
    const cx = (r.x + r.w / 2 - W / 2) * k, cy = (H / 2 - (r.y + r.h / 2)) * k;
    return new Vector3(cx - ((x0 + x1) / 2) * s, cy - ((y0 + y1) / 2) * s, s);
  }

  private applyTargets() {
    const u = this.velVar.material.uniforms, pu = this.posVar.material.uniforms;
    const from = this.textures.get(this.fromId)?.tex ?? this.cloud;
    const to = this.textures.get(this.toId)?.tex ?? this.cloud;
    u.tFrom.value = from;
    u.tTo.value = to;
    u.uFromX.value = this.fromId === "cloud" ? new Vector3(0, 0, 1) : this.xform(this.fromId, this.fromActive);
    u.uToX.value = this.toId === "cloud" ? new Vector3(0, 0, 1) : this.xform(this.toId, this.toActive);
    pu.tTo.value = to;
    pu.uToX.value = u.uToX.value;
    // Auto-exposure: the same particle count spread over a big wordmark or a thin wreath should glow alike.
    const shape = this.textures.get(this.toId)?.shape;
    if (!shape) this.gainGoal = 0.16;
    else {
      const px = (u.uToX.value as Vector3).z * (this.H / VIEW_H);
      const density = (this.count * 0.92) / (shape.area * px * px);
      this.gainGoal = 0.42 * Math.min(2.2, Math.max(0.55, Math.pow(2 / density, 0.5)));
    }
  }
  private gainGoal = 0.16;

  // Morph the whole field to another formation. `active` = a panel is open (different layout region).
  setTarget(id: string, active: boolean, accent: string, snap = false) {
    this.accentGoal = hex(accent);
    if (id === this.toId && active === this.toActive) return;
    const go = () => {
      this.fromId = this.toId;
      this.fromActive = this.toActive;
      this.toId = id;
      this.toActive = active;
      this.morphT = 0;
      this.applyTargets();
      if (snap || this.reduced) {
        this.snapNext = true;
        this.morphT = 99;
      }
    };
    if (this.reduced && !snap && this.fromId !== "cloud") {
      this.fade.pending = go;
    } else go();
    if (snap) this.accent.copy(this.accentGoal);
  }

  setFocus(nodeIndex: number) {
    this.focusGoal = nodeIndex;
  }

  shock(px: number, py: number) {
    const w = this.toWorld(px, py);
    this.velVar.material.uniforms.uShock.value.set(w.x, w.y, 0, 1);
    this.shockT = 0;
  }

  burst(px: number, py: number, amount: number) {
    const w = this.toWorld(px, py);
    this.velVar.material.uniforms.uBurst.value.set(w.x, w.y, amount);
  }

  resize(W: number, H: number) {
    this.W = W;
    this.H = H;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(W, H, false);
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    const w = Math.round(W * pr), h = Math.round(H * pr);
    this.rtCur.setSize(w, h);
    this.rtAcc[0].setSize(w, h);
    this.rtAcc[1].setSize(w, h);
    this.pMat.uniforms.uPR.value = pr * Math.min(1.25, Math.max(0.75, H / 900));
    (this.display.material as ShaderMaterial).uniforms.uRes.value.set(w, h);
    this.applyTargets();
  }

  private ray = new Vector3();
  toWorld(px: number, py: number) {
    const v = this.ray.set((px / this.W) * 2 - 1, -(py / this.H) * 2 + 1, 0.5).unproject(this.camera);
    v.sub(this.camera.position).normalize();
    const t = -this.camera.position.z / v.z;
    return new Vector2(this.camera.position.x + v.x * t, this.camera.position.y + v.y * t);
  }

  frame(dtRaw: number, p: Pointer, idle: boolean) {
    const dt = Math.min(dtRaw, 1 / 30);
    this.time += dt;
    this.morphT += dt;
    const u = this.velVar.material.uniforms, pu = this.posVar.material.uniforms;
    const ease = (k: number) => 1 - Math.exp(-dt * k);

    // Reduced motion: fade out, swap formation, snap, fade in.
    const op = this.pMat.uniforms.uOpacity;
    if (this.fade.pending) {
      op.value = Math.max(0, op.value - dt * 5);
      if (op.value === 0) {
        this.fade.pending();
        this.fade.pending = null;
      }
    } else op.value = Math.min(1, op.value + dt * 3);

    this.accent.lerp(this.accentGoal, ease(4));
    const gain = this.pMat.uniforms.uGain;
    gain.value += (this.gainGoal - gain.value) * (this.snapNext ? 1 : ease(3));

    // Parallax camera.
    const nx = p.active ? (p.x / this.W) * 2 - 1 : 0, ny = p.active ? (p.y / this.H) * 2 - 1 : 0;
    if (!this.reduced) {
      this.camPos.x += (nx * 0.9 - this.camPos.x) * ease(2.5);
      this.camPos.y += (-ny * 0.6 - this.camPos.y) * ease(2.5);
    }
    this.camera.position.x = this.camPos.x;
    this.camera.position.y = this.camPos.y;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    const w = this.toWorld(p.x, p.y);
    const k = VIEW_H / this.H;
    const pres = u.uPointer.value as Vector3;
    pres.set(w.x, w.y, pres.z + ((p.active ? 1 : 0) - pres.z) * ease(6));
    // Brush scales with the viewport so a thumb on a phone doesn't wipe the whole formation.
    const brush = Math.min(1, Math.max(0.45, (this.W * 0.065) / 94));
    (u.uPointerVel.value as Vector2).set(p.vx * k * brush, -p.vy * k * brush);
    const spd = Math.hypot(p.vx, p.vy) * k;
    u.uRadius.value = (1.0 + Math.min(spd, 20) * 0.04) * brush;
    this.pMat.uniforms.uRadius.value = u.uRadius.value;

    const holding = p.down && performance.now() - p.downAt > 160 && !this.reduced;
    this.hold += ((holding ? 1 : 0) - this.hold) * ease(holding ? 3 : 12);
    u.uHold.value = this.hold;

    this.shockT += dt;
    const sh = u.uShock.value as Vector4;
    sh.z = this.shockT * 13;
    sh.w = Math.exp(-this.shockT * 2.4) * (this.shockT < 3 ? 1 : 0);

    this.idle += ((idle && !this.reduced ? 1 : 0) - this.idle) * ease(0.8);
    u.uIdle.value = this.idle;
    if (this.toId === "offhours" && !this.reduced) u.uSpin.value += dt * 0.55;
    pu.uSpin.value = u.uSpin.value;

    // Project-row hover: one node of the constellation pulses toward you.
    const nodes = this.textures.get("projects")?.shape.nodes;
    const fx = this.textures.get("projects") && this.toId === "projects" ? (u.uToX.value as Vector3) : null;
    if (fx && nodes && this.focusGoal >= 0 && nodes[this.focusGoal] && !this.reduced) {
      const [x, y, z] = nodes[this.focusGoal];
      this.focus.x = x * fx.z + fx.x;
      this.focus.y = y * fx.z + fx.y;
      this.focus.z = z * fx.z;
      this.focus.w += (1 - this.focus.w) * ease(8);
    } else this.focus.w += (0 - this.focus.w) * ease(6);

    u.uTime.value = this.time;
    u.uDt.value = dt;
    u.uMorphT.value = this.morphT;
    pu.uDt.value = dt;
    pu.uSnap.value = u.uSnap.value = this.snapNext ? 1 : 0;
    this.snapNext = false;

    this.gpu.compute();
    (u.uBurst.value as Vector3).z = 0;

    this.pMat.uniforms.tPos.value = this.gpu.getCurrentRenderTarget(this.posVar).texture;
    this.pMat.uniforms.tVel.value = this.gpu.getCurrentRenderTarget(this.velVar).texture;

    const r = this.renderer;
    r.setRenderTarget(this.rtCur);
    r.setClearColor(0x000000, 1);
    r.clear();
    r.render(this.scene, this.camera);

    const prev = this.rtAcc[this.accIdx], next = this.rtAcc[1 - this.accIdx];
    const tm = this.trail.material as ShaderMaterial;
    tm.uniforms.tCur.value = this.rtCur.texture;
    tm.uniforms.tPrev.value = prev.texture;
    tm.uniforms.uDecay.value = this.reduced ? 0 : Math.pow(0.84, dt * 60);
    r.setRenderTarget(next);
    this.trail.render(r);
    this.accIdx = 1 - this.accIdx;

    const dm = this.display.material as ShaderMaterial;
    dm.uniforms.tAccum.value = next.texture;
    dm.uniforms.uTime.value = this.time;
    const L = dm.uniforms.uLight.value as Vector2;
    L.x += (p.x / this.W - L.x) * ease(10);
    L.y += (1 - p.y / this.H - L.y) * ease(10);
    dm.uniforms.uLightAmt.value += ((p.active ? 1 : 0) - dm.uniforms.uLightAmt.value) * ease(3);
    r.setRenderTarget(null);
    this.display.render(r);
  }

  dispose() {
    this.gpu.dispose();
    this.points.geometry.dispose();
    this.pMat.dispose();
    this.rtCur.dispose();
    this.rtAcc.forEach((t) => t.dispose());
    this.trail.dispose();
    this.display.dispose();
    (this.trail.material as ShaderMaterial).dispose();
    (this.display.material as ShaderMaterial).dispose();
    this.textures.forEach(({ tex }) => tex.dispose());
    this.cloud.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
