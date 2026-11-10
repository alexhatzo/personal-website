import * as THREE from "three";

export const COL = {
  white: "#f6f1e7",
  cream: "#efe4cf",
  marble: "#eee4d0",
  cobalt: "#1d4fb0",
  cobaltDeep: "#163c8a",
  terracotta: "#c8643c",
  clay: "#d9773f",
  bougain: "#d9367f",
  bougain2: "#f06aa6",
  olive: "#8a9a52",
  oliveDark: "#6d7c3c",
  cypress: "#3d5a2c",
  palm: "#4f8a3a",
  trunk: "#7a5a3e",
  sand: "#ecd6a3",
  stone: "#d9ccb1",
  rock: "#a8987f",
  wood: "#9a6a43",
  woodDark: "#6e4a2f",
  yellow: "#f2c14e",
  ink: "#1b2340",
  steel: "#5d6670",
};

const matCache = new Map<string, THREE.Material>();
/** Flat-shaded Lambert, cached by color. */
export function mat(color: string, opts: { emissive?: string; ei?: number } = {}) {
  const key = color + (opts.emissive ?? "") + (opts.ei ?? "");
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      emissive: opts.emissive ?? "#000000",
      emissiveIntensity: opts.ei ?? 1,
    });
    matCache.set(key, m);
  }
  return m;
}
export function clearMatCache() {
  matCache.forEach((m) => m.dispose());
  matCache.clear();
}

export function mesh(geo: THREE.BufferGeometry, material: THREE.Material, shadow = true) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

/** Collects transforms and turns them into one InstancedMesh. */
export class Batch {
  geo: THREE.BufferGeometry;
  material: THREE.Material;
  mats: THREE.Matrix4[] = [];
  cols: (THREE.Color | null)[] = [];
  cast: boolean;
  constructor(geo: THREE.BufferGeometry, material: THREE.Material, cast = true) {
    this.geo = geo;
    this.material = material;
    this.cast = cast;
  }
  add(x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, color?: string, rx = 0, rz = 0) {
    _e.set(rx, ry, rz, "YXZ");
    _q.setFromEuler(_e);
    this.mats.push(new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)));
    this.cols.push(color ? new THREE.Color(color) : null);
  }
  addMatrix(m: THREE.Matrix4, color?: string) {
    this.mats.push(m.clone());
    this.cols.push(color ? new THREE.Color(color) : null);
  }
  build() {
    const im = new THREE.InstancedMesh(this.geo, this.material, Math.max(1, this.mats.length));
    im.count = this.mats.length;
    const white = new THREE.Color("#ffffff");
    const anyColor = this.cols.some(Boolean);
    this.mats.forEach((m, i) => {
      im.setMatrixAt(i, m);
      if (anyColor) im.setColorAt(i, this.cols[i] ?? white);
    });
    im.castShadow = this.cast;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    return im;
  }
}
export { _m as tmpMatrix };

export const FONT = '"Bricolage Grotesque", "Avenir Next", "Trebuchet MS", sans-serif';

/** Canvas text texture. lines: [text, sizePx, color, weight?] */
export function textTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** A board with centered text lines. */
export function signTexture(lines: { t: string; s: number; c?: string; w?: number }[], bg: string, fg: string, w = 512, h = 256) {
  return textTexture(w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const total = lines.reduce((a, l) => a + l.s * 1.15, 0);
    let y = (h - total) / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const l of lines) {
      ctx.fillStyle = l.c ?? fg;
      ctx.font = `${l.w ?? 700} ${l.s}px ${FONT}`;
      let size = l.s;
      while (ctx.measureText(l.t).width > w * 0.9 && size > 10) {
        size -= 2;
        ctx.font = `${l.w ?? 700} ${size}px ${FONT}`;
      }
      ctx.fillText(l.t, w / 2, y + (l.s - size) / 2);
      y += l.s * 1.15;
    }
  });
}

/** Floating label sprite (name tags above places and projects). */
export function labelSprite(text: string, color: string, scale = 1, sub?: string) {
  const w = 512;
  const h = sub ? 168 : 120;
  const tex = textTexture(w, h, (ctx) => {
    ctx.font = `800 54px ${FONT}`;
    const tw = Math.min(w - 20, Math.max(ctx.measureText(text).width, sub ? 200 : 0) + 64);
    const x = (w - tw) / 2;
    roundRect(ctx, x, 8, tw, h - 16, 26);
    ctx.fillStyle = "rgba(27,35,64,0.82)";
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(x + 22, 30, 10, sub ? 64 : 58);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff8ec";
    let size = 54;
    while (ctx.measureText(text).width > tw - 70 && size > 20) {
      size -= 2;
      ctx.font = `800 ${size}px ${FONT}`;
    }
    ctx.fillText(text, w / 2 + 8, sub ? 64 : h / 2);
    if (sub) {
      ctx.font = `600 30px ${FONT}`;
      ctx.fillStyle = "rgba(255,248,236,0.72)";
      ctx.fillText(sub, w / 2 + 8, 118);
    }
  });
  const sm = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
  const s = new THREE.Sprite(sm);
  s.scale.set(7 * scale, (7 * scale * h) / w, 1);
  s.renderOrder = 10;
  return s;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
