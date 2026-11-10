import * as THREE from "three";
import type { PortfolioData } from "../../../types/portfolio";
import { Physics, tilt, type PropSet, type SoloProp } from "./physics";
import { WorldCtx, type Frame } from "./ctx";
import { buildTerrain, buildWater, buildSky, buildStars } from "./env";
import { buildRoads, buildHouses, buildNature, buildLamps, buildChapelAndMills, buildAmbient, roadChains } from "./village";
import { buildPort, buildSquare, buildAtelier, buildHarbor } from "./districtsA";
import { buildAgora, buildWorkshop, buildBeach, buildTennis, buildLighthouse, buildCat, buildSignposts, buildMarkers, type Marker } from "./districtsB";
import { buildTokens, type Token } from "./tokens";
import { Scooter, type DriveInput } from "./player";
import { Particles } from "./fx";
import { Sound } from "./audio";
import { Input } from "./input";
import { PLACES, PLACE, SECRET_CAT, type PlaceId } from "./places";
import { height, clamp, lerp, coastR } from "./terrain";
import { ACHIEVEMENTS, loadProgress, saveProgress, type AchId, type Progress } from "./progress";
import { clearMatCache, FONT } from "./kit";

export interface Toast {
  kind: "ach" | "skill" | "place" | "info";
  title: string;
  body?: string;
  color?: string;
}

export interface GameCallbacks {
  onLoad(pct: number, label: string): void;
  onReady(): void;
  onNear(id: PlaceId | null): void;
  onProgress(p: Progress): void;
  onToast(t: Toast): void;
  onMusic(playing: boolean): void;
  onInteract(id: PlaceId): void;
  onKey(code: string, e: KeyboardEvent): void;
  onMap(state: MapState): void;
}

export interface MapState {
  x: number;
  z: number;
  yaw: number;
}

export interface GameOptions {
  night: boolean;
  overview: boolean;
  reducedMotion: boolean;
  mobile: boolean;
}

const DAY = {
  sun: new THREE.Color("#ffcf96"),
  sunI: 2.6,
  hemiSky: new THREE.Color("#bcd7f0"),
  hemiGround: new THREE.Color("#d8a878"),
  hemiI: 1.25,
  fog: new THREE.Color("#f2bf92"),
  top: new THREE.Color("#4a8cd6"),
  horizon: new THREE.Color("#ffc391"),
};
const NIGHT = {
  sun: new THREE.Color("#8ea8ff"),
  sunI: 0.8,
  hemiSky: new THREE.Color("#3a4f96"),
  hemiGround: new THREE.Color("#241f33"),
  hemiI: 0.85,
  fog: new THREE.Color("#18203f"),
  top: new THREE.Color("#050918"),
  horizon: new THREE.Color("#22305e"),
};

function inBox(o: { x: number; z: number; hw: number; hd: number; ry: number }, x: number, z: number, m: number) {
  const dx = x - o.x;
  const dz = z - o.z;
  const c = Math.cos(o.ry);
  const s = Math.sin(o.ry);
  return Math.abs(dx * c - dz * s) < o.hw + m && Math.abs(dx * s + dz * c) < o.hd + m;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private data: PortfolioData;
  private cb: GameCallbacks;
  private opts: GameOptions;
  renderer!: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
  private sun = new THREE.DirectionalLight();
  private hemi = new THREE.HemisphereLight();
  private sunDir = new THREE.Vector3(-0.72, 0.42, 0.55).normalize();
  private sky!: THREE.Mesh;
  private stars!: THREE.Points;
  private water!: THREE.Mesh;
  private phys!: Physics;
  private ctx!: WorldCtx;
  private scooter = new Scooter();
  private fx!: Particles;
  sound = new Sound();
  private input: Input;
  private markers: Marker[] = [];
  private tokens: Token[] = [];
  private updateTokens: (t: number, dt: number) => void = () => {};
  private containers!: PropSet;
  private letters: SoloProp[] = [];
  private balls!: PropSet;
  private progress: Progress;
  private knockedSet = new Set<number>();
  private lettersDown = new Set<number>();
  private ballCooldown: number[] = [];

  private raf = 0;
  private last = 0;
  private t = 0;
  private started = false;
  private paused = false;
  private ready = false;
  private disposed = false;
  private night = 0;
  private nightTarget = 0;
  private near: PlaceId | null = null;
  private camYaw = 0;
  private camPos = new THREE.Vector3(0, 60, 160);
  private camLook = new THREE.Vector3(0, 0, 0);
  private shake = 0;
  private slowTick = 0;
  private mapTick = 0;
  private respawnAt = 0;
  private lastPlace: PlaceId | null = null;

  constructor(canvas: HTMLCanvasElement, data: PortfolioData, cb: GameCallbacks, opts: GameOptions) {
    this.canvas = canvas;
    this.data = data;
    this.cb = cb;
    this.opts = opts;
    this.progress = loadProgress();
    this.sound.muted = this.progress.muted;
    this.sound.onMusicChange = (p) => {
      cb.onMusic(p);
      if (p) this.unlock("dj");
    };
    this.input = new Input((code, e) => this.key(code, e));
    this.nightTarget = this.night = opts.night ? 1 : 0;
  }

  async init() {
    const step = async (pct: number, label: string) => {
      this.cb.onLoad(pct, label);
      await new Promise((r) => setTimeout(r, 0));
    };
    await step(5, "Loading fonts");
    try {
      await Promise.race([document.fonts.load(`800 64px ${FONT}`), new Promise((r) => setTimeout(r, 1500))]);
    } catch {
      /* fall back to the system stack */
    }
    if (this.disposed) return;
    await step(12, "Waking up the physics");
    this.phys = await Physics.create();
    if (this.disposed) return;

    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(window.devicePixelRatio, this.opts.mobile ? 1.5 : 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.08;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    this.renderer = r;
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.visibility);

    const s = this.scene;
    s.fog = new THREE.Fog(DAY.fog, 110, 420);
    this.sun.castShadow = true;
    const sm = this.opts.mobile ? 1024 : 2048;
    this.sun.shadow.mapSize.set(sm, sm);
    const sc = this.sun.shadow.camera;
    sc.left = -48;
    sc.right = 48;
    sc.top = 48;
    sc.bottom = -48;
    sc.near = 1;
    sc.far = 260;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    s.add(this.sun, this.sun.target, this.hemi);

    await step(25, "Raising the island");
    this.sky = buildSky();
    this.stars = buildStars();
    s.add(this.sky, this.stars);
    const terrain = buildTerrain();
    s.add(terrain.mesh);
    this.phys.addTrimesh(terrain.physVerts, terrain.physIdx);
    this.water = buildWater();
    s.add(this.water);

    this.ctx = new WorldCtx(s, this.phys, this.data);
    await step(40, "Paving roads, whitewashing houses");
    buildRoads(this.ctx);
    // set pieces first so the village keeps clear of them
    await step(55, "Building the districts");
    const port = buildPort(this.ctx);
    this.letters = port.letters;
    buildSquare(this.ctx);
    buildAtelier(this.ctx);
    this.containers = buildHarbor(this.ctx).containers;
    buildAgora(this.ctx);
    buildWorkshop(this.ctx);
    buildBeach(this.ctx);
    this.balls = buildTennis(this.ctx).balls;
    this.ballCooldown = this.balls.bodies.map(() => 0);
    buildLighthouse(this.ctx);
    buildCat(this.ctx);
    buildSignposts(this.ctx);
    await step(72, "Planting olives & bougainvillea");
    buildHouses(this.ctx);
    buildChapelAndMills(this.ctx);
    buildNature(this.ctx);
    buildLamps(this.ctx);
    buildAmbient(this.ctx);
    this.markers = buildMarkers(this.ctx);
    await step(86, "Scattering skill tokens");
    const tk = buildTokens(this.ctx, new Set(this.progress.skills));
    this.tokens = tk.tokens;
    this.updateTokens = tk.update;
    this.ctx.flush();
    this.fx = new Particles(s);
    s.add(this.scooter.root);
    this.place("port");
    this.applyNight();
    await step(96, "Fuelling the scooter");
    r.compile(s, this.camera);
    this.ready = true;
    this.cb.onProgress({ ...this.progress });
    this.cb.onLoad(100, "Ready");
    this.cb.onReady();
    this.last = performance.now();
    this.loop();
  }

  // ---------- public controls ----------
  /** snap = skip the swoop from the intro orbit (debug/autostart) */
  start(snap = false) {
    this.started = true;
    this.sound.init();
    if (snap) this.snapCamera();
  }
  setPaused(p: boolean) {
    this.paused = p;
    this.input.enabled = !p;
    if (p) this.input.keys.clear();
  }
  setNight(n: boolean) {
    this.nightTarget = n ? 1 : 0;
    if (n) this.unlock("night");
  }
  setMuted(m: boolean) {
    this.sound.setMuted(m);
    this.progress.muted = m;
    saveProgress(this.progress);
  }
  setJoystick(x: number, y: number, active: boolean) {
    this.input.joy.x = x;
    this.input.joy.y = y;
    this.input.joy.active = active;
  }
  jump() {
    this.input.jumpQueued = true;
  }
  horn() {
    this.sound.init();
    this.sound.horn();
    this.shake = Math.max(this.shake, 0.08);
  }
  toggleMusic() {
    this.sound.toggleMusic();
  }
  interact() {
    if (this.near) this.openPlace(this.near);
  }
  /** teleport next to a place; snaps the camera */
  teleport(id: PlaceId) {
    this.place(id);
  }
  openedPanel(id: PlaceId) {
    this.visit(id);
    this.sound.open();
  }
  resetProgress() {
    this.progress = { ...loadProgress(), visited: [], skills: [], ach: [], knocked: 0, hits: 0 };
    saveProgress(this.progress);
    this.tokens.forEach((t) => (t.taken = false));
    this.cb.onProgress({ ...this.progress });
  }

  private openPlace(id: PlaceId) {
    if (id === "beach" && !this.sound.playing) this.sound.toggleMusic();
    this.cb.onInteract(id);
  }

  private key(code: string, e: KeyboardEvent) {
    if (!this.started && this.ready && !this.paused) {
      // any drive key also starts audio once the intro is gone
      this.sound.init();
    }
    if (!this.paused && this.started) {
      if (code === "KeyE" || code === "Enter") {
        const t = e.target as HTMLElement | null;
        if (!(code === "Enter" && t && (t.tagName === "BUTTON" || t.tagName === "A"))) this.interact();
      }
      if (code === "KeyH") this.horn();
    }
    this.cb.onKey(code, e);
  }

  /** Start on a road ~12 m short of the place, facing its marker: the camera behind stays on open road. */
  private spawnFor(id: PlaceId) {
    const P = PLACE[id];
    if (id === "port") return { x: 0, z: 78, yaw: 0 };
    if (P.spawn) return { x: P.spawn[0], z: P.spawn[1], yaw: Math.atan2(-(P.mx - P.spawn[0]), -(P.mz - P.spawn[1])) };
    let best: { x: number; z: number; score: number } | null = null;
    for (const chain of roadChains) {
      chain.forEach((p, i) => {
        const dm = Math.hypot(p.x - P.mx, p.z - P.mz);
        if (dm < 9 || dm > 17) return;
        // camera spot: one step further along the road, away from the marker
        const q = chain[Math.min(chain.length - 1, i + 1)];
        const r = chain[Math.max(0, i - 1)];
        const away = Math.hypot(q.x - P.mx, q.z - P.mz) > Math.hypot(r.x - P.mx, r.z - P.mz) ? q : r;
        const ux = away.x - p.x;
        const uz = away.z - p.z;
        const l = Math.hypot(ux, uz) || 1;
        const cx = p.x + (ux / l) * 9;
        const cz = p.z + (uz / l) * 9;
        if (!this.ctx.clear(p.x, p.z, 1) || !this.ctx.clear(cx, cz, 0.5) || height(p.x, p.z) < 0.6) return;
        const score = Math.abs(dm - 12);
        if (!best || score < best.score) best = { x: p.x, z: p.z, score };
      });
    }
    const s = (best as { x: number; z: number } | null) ?? { x: P.mx, z: P.mz + 10 };
    return { x: s.x, z: s.z, yaw: Math.atan2(-(P.mx - s.x), -(P.mz - s.z)) };
  }

  private place(id: PlaceId) {
    const s = this.spawnFor(id);
    this.scooter.place(s.x, s.z, s.yaw);
    this.phys.teleportScooter(s.x, this.scooter.pos.y, s.z);
    this.camYaw = s.yaw;
    this.snapCamera();
  }

  private snapCamera() {
    const d = this.chaseDesired();
    this.camPos.copy(d.pos);
    this.camLook.copy(d.look);
  }

  private unlock(id: AchId) {
    if (this.progress.ach.includes(id)) return;
    this.progress.ach.push(id);
    saveProgress(this.progress);
    const a = ACHIEVEMENTS.find((x) => x.id === id)!;
    this.cb.onToast({ kind: "ach", title: a.name, body: a.desc });
    this.cb.onProgress({ ...this.progress });
    this.sound.achievement();
  }

  private visit(id: PlaceId) {
    if (this.progress.visited.includes(id)) return;
    this.progress.visited.push(id);
    saveProgress(this.progress);
    this.cb.onProgress({ ...this.progress });
    if (this.progress.visited.length >= PLACES.length) this.unlock("tourist");
  }

  // ---------- loop ----------
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    this.t += dt;
    this.tick(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private driveInput(): DriveInput {
    const i = this.input;
    const live = this.started && !this.paused;
    const jump = live && i.jumpQueued;
    i.jumpQueued = false;
    if (!live) return { throttle: 0, steer: 0, boost: false, jump: false };
    let throttle = (i.has("KeyW", "ArrowUp") ? 1 : 0) - (i.has("KeyS", "ArrowDown") ? 1 : 0);
    let steer = (i.has("KeyA", "ArrowLeft") ? 1 : 0) - (i.has("KeyD", "ArrowRight") ? 1 : 0);
    const boost = i.has("ShiftLeft", "ShiftRight");
    if (i.joy.active) {
      const mag = Math.min(1, Math.hypot(i.joy.x, i.joy.y));
      if (mag > 0.15) {
        // joystick = desired direction relative to the camera
        const fx = -Math.sin(this.camYaw);
        const fz = -Math.cos(this.camYaw);
        const wx = fx * i.joy.y + -fz * i.joy.x;
        const wz = fz * i.joy.y + fx * i.joy.x;
        const want = Math.atan2(-wx, -wz);
        const diff = Math.atan2(Math.sin(want - this.scooter.yaw), Math.cos(want - this.scooter.yaw));
        steer = clamp(diff * 2.2, -1, 1);
        throttle = mag * (Math.abs(diff) > 2.4 ? 0.5 : 1);
      }
      return { throttle, steer, boost: mag > 0.97, jump };
    }
    return { throttle, steer, boost, jump };
  }

  private tick(dt: number) {
    if (!this.ready) return;
    const sc = this.scooter;
    const inp = this.driveInput();
    const from = sc.pos.clone();
    const yaw0 = sc.yaw;
    const ev = sc.update(dt, inp, this.ctx.obstacles);
    const speed = Math.hypot(sc.vel.x, sc.vel.y);

    // feedback
    if (ev.bump > 4) {
      this.sound.thud(ev.bump);
      this.shake = Math.max(this.shake, Math.min(0.6, ev.bump / 20));
      this.fx.burst(sc.pos.x, sc.pos.y + 0.6, sc.pos.z, 8, "#f6f1e7", 3, 0.12);
    }
    if (ev.jumped) this.sound.jump();
    if (ev.landed > 3) {
      this.sound.land(ev.landed);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        this.fx.emit(sc.pos.x, sc.pos.y + 0.15, sc.pos.z, Math.cos(a) * 3, 0.6, Math.sin(a) * 3, 0.7, 0.28, "#e9d6ae");
      }
      this.shake = Math.max(this.shake, Math.min(0.4, ev.landed / 30));
    }
    if (ev.airtime >= 1) this.unlock("air");
    if (ev.splash) {
      this.sound.splash();
      this.fx.burst(sc.pos.x, 0.2, sc.pos.z, 30, "#e8fbff", 6, 0.2, 14);
      this.respawnAt = this.t + 1.1;
    }
    if (this.respawnAt && this.t > this.respawnAt) {
      this.respawnAt = 0;
      this.place("port");
      this.cb.onToast({ kind: "info", title: "Splash!", body: "The harbor master fished you out. Back at the port." });
    }
    if (Math.hypot(sc.pos.x, sc.pos.z) > 150) this.place("port");

    // wheel dust: drifting, hard launches, boosting
    const slip = Math.abs(sc.slip);
    if (sc.grounded && sc.pos.y > 0.3 && (slip > 2.2 || (inp.throttle > 0 && speed < 6 && speed > 0.5) || (inp.boost && speed > 10))) {
      const n = slip > 4 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const bx = sc.pos.x + Math.sin(sc.yaw) * 0.7 + (Math.random() - 0.5) * 0.4;
        const bz = sc.pos.z + Math.cos(sc.yaw) * 0.7 + (Math.random() - 0.5) * 0.4;
        this.fx.emit(bx, sc.pos.y + 0.15, bz, (Math.random() - 0.5) * 1.2 - sc.vel.x * 0.08, 0.8 + Math.random(), (Math.random() - 0.5) * 1.2 - sc.vel.y * 0.08, 0.55 + Math.random() * 0.3, 0.14 + Math.random() * 0.12, sc.pos.y < 1.6 ? "#efdcae" : "#d9c69c");
      }
    }

    // physics
    const jumpTp = from.distanceToSquared(sc.pos) > 25; // teleported this frame
    this.phys.step(dt, (k) => {
      if (jumpTp) return;
      this.phys.moveScooter(lerp(from.x, sc.pos.x, k), lerp(from.y, sc.pos.y, k), lerp(from.z, sc.pos.z, k), lerp(yaw0, sc.yaw, k));
    });
    this.fx.update(dt);
    for (const m of this.phys.kick(sc.vel.x, sc.vel.y, this.t)) {
      this.sound.thud(Math.min(12, 2 + Math.sqrt(m) * 1.5));
      this.shake = Math.max(this.shake, Math.min(0.35, 0.05 + m * 0.01));
    }

    // tokens
    for (const tk of this.tokens) {
      if (tk.taken) continue;
      const dx = tk.x - sc.pos.x;
      const dz = tk.z - sc.pos.z;
      if (dx * dx + dz * dz < 4.8 && Math.abs(tk.y - (sc.pos.y + 1)) < 2.5) {
        tk.taken = true;
        tk.pop = 0.35;
        this.progress.skills.push(tk.key);
        saveProgress(this.progress);
        this.sound.pickup(this.progress.skills.length);
        const col = ["#ff5a8a", "#4f8cff", "#ffb02e", "#2ec4b6"][tk.cat % 4];
        this.fx.burst(tk.x, tk.y, tk.z, 14, col, 4, 0.1, 6);
        this.cb.onToast({ kind: "skill", title: tk.name, body: this.data.skills.categories[tk.cat]?.name, color: col });
        this.cb.onProgress({ ...this.progress });
        this.unlock("first");
        if (this.tokens.every((t) => t.taken)) this.unlock("allskills");
      }
    }
    this.updateTokens(this.t, dt);

    // tennis hits (need per-frame proximity)
    this.balls.bodies.forEach((b, i) => {
      if (this.ballCooldown[i] > this.t) return;
      const p = b.translation();
      const v = b.linvel();
      if ((p.x - sc.pos.x) ** 2 + (p.z - sc.pos.z) ** 2 < 4 && v.x * v.x + v.z * v.z > 30) {
        this.ballCooldown[i] = this.t + 1.2;
        this.progress.hits++;
        this.sound.hit();
        if (this.progress.hits >= 5) this.unlock("ace");
        this.cb.onProgress({ ...this.progress });
      }
    });

    // slow checks
    this.slowTick += dt;
    if (this.slowTick > 0.25) {
      this.slowTick = 0;
      this.phys.rescue();
      this.containers.bodies.forEach((b, i) => {
        const h = this.containers.homes[i];
        const p = b.translation();
        if (tilt(b) < 0.6 || Math.hypot(p.x - h.p.x, p.z - h.p.z) > 3 || p.y < h.p.y - 1.5) this.knockedSet.add(i);
      });
      if (this.knockedSet.size > this.progress.knocked) {
        this.progress.knocked = this.knockedSet.size;
        saveProgress(this.progress);
        this.cb.onProgress({ ...this.progress });
        if (this.progress.knocked >= 8) this.unlock("chaos");
      }
      this.letters.forEach((l, i) => {
        if (tilt(l.body) < 0.5) this.lettersDown.add(i);
      });
      if (this.lettersDown.size >= this.letters.length) this.unlock("kerning");
      if (Math.hypot(sc.pos.x - SECRET_CAT.x, sc.pos.z - SECRET_CAT.z) < 5) this.unlock("cat");
      // which district are we in?
      const inPlace = PLACES.find((p) => Math.hypot(sc.pos.x - p.x, sc.pos.z - p.z) < p.flat + 2);
      if (inPlace && inPlace.id !== this.lastPlace && this.started) {
        if (!this.progress.visited.includes(inPlace.id)) this.cb.onToast({ kind: "place", title: inPlace.name, body: inPlace.tagline, color: inPlace.color });
        this.visit(inPlace.id);
      }
      this.lastPlace = inPlace?.id ?? null;
    }

    // nearest marker
    let near: PlaceId | null = null;
    let best = 6.5;
    for (const m of this.markers) {
      const d = Math.hypot(m.group.position.x - sc.pos.x, m.group.position.z - sc.pos.z);
      if (d < best) {
        best = d;
        near = m.place.id;
      }
    }
    if (near !== this.near) {
      this.near = near;
      this.cb.onNear(near);
    }
    for (const m of this.markers) {
      const d = Math.hypot(m.group.position.x - sc.pos.x, m.group.position.z - sc.pos.z);
      const hot = m.place.id === near;
      m.gem.rotation.y += dt * (hot ? 4 : 1.2);
      m.gem.position.y = 2.6 + Math.sin(this.t * 2 + m.group.position.x) * 0.25 + (hot ? 0.4 : 0);
      const target = hot ? 1.5 : 1;
      m.gem.scale.x += (target - m.gem.scale.x) * Math.min(1, dt * 6);
      m.gem.scale.z = m.gem.scale.x;
      m.gem.scale.y = m.gem.scale.x * 1.5;
      (m.beam.material as THREE.MeshBasicMaterial).opacity = clamp((d - 8) / 30, 0.08, 0.55) * (this.opts.overview ? 1 : 1);
      const rs = 1 + ((this.t * 0.8 + m.group.position.z) % 1) * (hot ? 0.6 : 0.25);
      m.ring.scale.set(rs, rs, rs);
      (m.ring.material as THREE.MeshBasicMaterial).opacity = hot ? 0.95 : 0.6;
      m.label.visible = d > 13;
    }

    // night
    this.night += (this.nightTarget - this.night) * Math.min(1, dt * 1.5);
    if (Math.abs(this.nightTarget - this.night) > 0.001) this.applyNight();

    // updaters
    const bass = this.sound.bass();
    const f: Frame = { t: this.t, dt, px: sc.pos.x, pz: sc.pos.z, speed, night: this.night, bass, playing: this.sound.playing };
    for (const u of this.ctx.updaters) u(f);
    const wu = (this.water.material as THREE.ShaderMaterial).uniforms;
    wu.uTime.value = this.t;

    // sound
    const shore = clamp(1 - Math.abs(Math.hypot(sc.pos.x, sc.pos.z) / coastR(sc.pos.x, sc.pos.z) - 0.86) * 6, 0, 1);
    this.sound.engine(clamp(speed / 22, 0, 1), this.started && !this.paused ? inp.throttle : 0, inp.boost, shore);

    this.updateCamera(dt, speed, inp.boost);

    // map
    this.mapTick += dt;
    if (this.mapTick > 0.1) {
      this.mapTick = 0;
      this.cb.onMap({ x: sc.pos.x, z: sc.pos.z, yaw: sc.yaw });
    }
  }

  private chaseDesired() {
    const sc = this.scooter;
    const portrait = this.camera.aspect < 0.8;
    const speed = Math.hypot(sc.vel.x, sc.vel.y);
    const full = (portrait ? 13 : 10) + speed * 0.16;
    const fx = -Math.sin(this.camYaw);
    const fz = -Math.cos(this.camYaw);
    // pull in when a building sits between the scooter and the camera
    let dist = full;
    const big = this.ctx.obstacles.filter((o) => o.kind === "box" && Math.max(o.hw, o.hd) > 1.2 && Math.abs(o.x - sc.pos.x) < full + 8 && Math.abs(o.z - sc.pos.z) < full + 8);
    for (let d = 1.5; d <= full; d += 0.75) {
      const x = sc.pos.x - fx * d;
      const z = sc.pos.z - fz * d;
      if (big.some((o) => o.kind === "box" && inBox(o, x, z, 0.6))) {
        dist = Math.max(2.8, d - 0.9);
        break;
      }
    }
    const hgt = (portrait ? 7 : 5.2) + speed * 0.04 + (full - dist) * 0.18;
    const pos = new THREE.Vector3(sc.pos.x - fx * dist, sc.pos.y + hgt, sc.pos.z - fz * dist);
    const ahead = clamp(sc.forwardSpeed, -4, 25) * 0.35;
    const look = new THREE.Vector3(sc.pos.x - Math.sin(sc.yaw) * ahead, sc.pos.y + 1.2, sc.pos.z - Math.cos(sc.yaw) * ahead);
    return { pos, look };
  }

  private updateCamera(dt: number, speed: number, boost: boolean) {
    const cam = this.camera;
    const sc = this.scooter;
    if (this.opts.overview) {
      cam.position.set(10, 175, 168);
      cam.lookAt(0, 0, 8);
      cam.fov = 40;
      cam.updateProjectionMatrix();
      this.sunFollow(0, 0, true);
      this.sky.position.copy(cam.position);
      this.stars.position.copy(cam.position);
      return;
    }
    if (!this.started) {
      // intro: slow orbit around the island
      const a = this.t * (this.opts.reducedMotion ? 0.01 : 0.05) + 0.4;
      cam.position.set(Math.sin(a) * 120, 58, Math.cos(a) * 120);
      cam.lookAt(0, 4, 6);
      cam.fov = this.camera.aspect < 0.8 ? 62 : 46;
      cam.updateProjectionMatrix();
      this.camPos.copy(cam.position);
      this.camLook.set(0, 4, 6);
      this.sunFollow(0, 0, true);
      this.sky.position.copy(cam.position);
      this.stars.position.copy(cam.position);
      return;
    }
    if (sc.forwardSpeed > -1) {
      let d = sc.yaw - this.camYaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.camYaw += d * Math.min(1, dt * 2.6);
    }
    const des = this.chaseDesired();
    this.camPos.lerp(des.pos, 1 - Math.exp(-dt * 4.5));
    const floor = height(this.camPos.x, this.camPos.z) + 1.4;
    if (this.camPos.y < floor) this.camPos.y = floor;
    this.camLook.lerp(des.look, 1 - Math.exp(-dt * 9));
    cam.position.copy(this.camPos);
    if (this.shake > 0.001 && !this.opts.reducedMotion) {
      cam.position.x += (Math.random() - 0.5) * this.shake;
      cam.position.y += (Math.random() - 0.5) * this.shake;
      this.shake *= Math.exp(-dt * 8);
    }
    cam.lookAt(this.camLook);
    const portrait = cam.aspect < 0.8;
    const fov = (portrait ? 66 : 55) + (this.opts.reducedMotion ? 0 : speed * 0.35 + (boost ? 5 : 0));
    cam.fov = lerp(cam.fov, fov, Math.min(1, dt * 3));
    cam.updateProjectionMatrix();
    this.sunFollow(sc.pos.x, sc.pos.z, false);
    this.sky.position.copy(cam.position);
    this.stars.position.copy(cam.position);
  }

  private sunFollow(x: number, z: number, wide: boolean) {
    const sc = this.sun.shadow.camera;
    const ext = wide ? 140 : 48;
    if (sc.right !== ext) {
      sc.left = -ext;
      sc.right = ext;
      sc.top = ext;
      sc.bottom = -ext;
      sc.updateProjectionMatrix();
    }
    // snap to shadow texels to avoid shimmering
    const step = (ext * 2) / this.sun.shadow.mapSize.x;
    x = Math.round(x / step) * step;
    z = Math.round(z / step) * step;
    this.sun.target.position.set(x, 0, z);
    this.sun.position.set(x + this.sunDir.x * 120, this.sunDir.y * 120, z + this.sunDir.z * 120);
  }

  private applyNight() {
    const n = this.night;
    this.sun.color.copy(DAY.sun).lerp(NIGHT.sun, n);
    this.sun.intensity = lerp(DAY.sunI, NIGHT.sunI, n);
    this.hemi.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, n);
    this.hemi.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, n);
    this.hemi.intensity = lerp(DAY.hemiI, NIGHT.hemiI, n);
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(DAY.fog).lerp(NIGHT.fog, n);
    fog.near = this.opts.overview ? 300 : 110;
    fog.far = this.opts.overview ? 900 : 420;
    const su = (this.sky.material as THREE.ShaderMaterial).uniforms;
    su.uTop.value.copy(DAY.top).lerp(NIGHT.top, n);
    su.uHorizon.value.copy(DAY.horizon).lerp(NIGHT.horizon, n);
    su.uNight.value = n;
    su.uSun.value.copy(this.sunDir).lerp(new THREE.Vector3(0.3, 0.6, -0.7), n);
    su.uSunCol.value.set(n > 0.5 ? "#c8d4ff" : "#ffcf8a");
    (this.stars.material as THREE.PointsMaterial).opacity = clamp(n * 1.4 - 0.3, 0, 1);
    const wu = (this.water.material as THREE.ShaderMaterial).uniforms;
    wu.uNight.value = n;
    wu.uSun.value.copy(su.uSun.value);
    for (const g of this.ctx.glows) g.mat.emissiveIntensity = lerp(g.day, g.night, n);
    this.scooter.headlight.intensity = n * 40;
    this.scooter.headlightMat.emissiveIntensity = 0.4 + n * 2;
    this.renderer.toneMappingExposure = lerp(1.08, 1.25, n);
  }

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.sound.ctx?.suspend();
    } else if (!this.raf && this.ready && !this.disposed) {
      this.last = performance.now();
      this.sound.ctx?.resume();
      this.loop();
    }
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.visibility);
    this.input.dispose();
    this.sound.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const x of mats) {
        for (const v of Object.values(x)) if (v instanceof THREE.Texture) v.dispose();
        x.dispose();
      }
    });
    clearMatCache();
    this.renderer?.dispose();
    this.phys?.dispose();
  }
}
