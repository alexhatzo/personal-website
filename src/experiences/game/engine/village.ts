import * as THREE from "three";
import { Batch, COL, mat, mesh, mulberry32, textTexture } from "./kit";
import { PLACES, PLACE, ROADS, SECRET_CAT } from "./places";

const PLACE_BEACH = PLACE.beach;
import { height, slopeAt, coastR } from "./terrain";
import type { WorldCtx } from "./ctx";

const box = new THREE.BoxGeometry(1, 1, 1);
const ico = new THREE.IcosahedronGeometry(1, 0);
const dode = new THREE.DodecahedronGeometry(1, 0);
const dome = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
const cyl6 = new THREE.CylinderGeometry(1, 1, 1, 7);
const cone = new THREE.ConeGeometry(1, 1, 7);
const frond = new THREE.BoxGeometry(0.55, 0.05, 3.2).translate(0, 0, 1.6);

export const roadPts: { x: number; z: number }[] = [];
export const roadChains: { x: number; z: number }[][] = [];
export function roadDist(x: number, z: number) {
  let d = Infinity;
  for (const p of roadPts) {
    const q = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (q < d) d = q;
  }
  return Math.sqrt(d);
}
function nearestRoad(x: number, z: number) {
  let best = roadPts[0];
  let d = Infinity;
  for (const p of roadPts) {
    const q = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (q < d) {
      d = q;
      best = p;
    }
  }
  return best;
}
const inPlace = (x: number, z: number, m: number) => PLACES.some((p) => Math.hypot(x - p.x, z - p.z) < p.flat + m);

/** world position from a local offset inside a rotated footprint */
export function local(x: number, z: number, ry: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  return [x + lx * c + lz * s, z - lx * s + lz * c];
}

export function buildRoads(ctx: WorldCtx) {
  roadPts.length = 0;
  roadChains.length = 0;
  const top = new THREE.MeshLambertMaterial({ color: "#e3d6bb", flatShading: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const edge = new THREE.MeshLambertMaterial({ color: "#b8a585", flatShading: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  for (const chain of ROADS) {
    const curve = new THREE.CatmullRomCurve3(chain.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const n = Math.ceil(curve.getLength() / 1.4);
    const pts = curve.getSpacedPoints(n);
    pts.forEach((p) => roadPts.push({ x: p.x, z: p.z }));
    roadChains.push(pts.map((p) => ({ x: p.x, z: p.z })));
    for (const [w, m, lift] of [[3.1, edge, 0.1], [2.4, top, 0.14]] as [number, THREE.Material, number][]) {
      const pos: number[] = [];
      const idx: number[] = [];
      pts.forEach((p, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(pts.length - 1, i + 1)];
        const tx = b.x - a.x;
        const tz = b.z - a.z;
        const l = Math.hypot(tx, tz) || 1;
        const nx = -tz / l;
        const nz = tx / l;
        for (const side of [-1, 1]) {
          const x = p.x + nx * w * side;
          const z = p.z + nz * w * side;
          pos.push(x, Math.max(height(x, z), 0.1) + lift, z);
        }
        if (i > 0) {
          const k = i * 2;
          idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const r = mesh(g, m, false);
      ctx.scene.add(r);
    }
  }
}

const ACCENTS = [COL.cobalt, COL.cobalt, "#2c8c8a", COL.terracotta, "#3f7f4a", COL.cobaltDeep];

export function buildHouses(ctx: WorldCtx) {
  const rnd = mulberry32(42);
  const wall = ctx.batch("wall", () => new Batch(box, mat("#ffffff")));
  const domes = ctx.batch("dome", () => new Batch(dome, mat(COL.cobalt)));
  const doors = ctx.batch("door", () => new Batch(box, mat("#ffffff"), false));
  const panes = ctx.batch("pane", () => new Batch(box, ctx.glow("#ffc56b", 0, 2.4), false));
  const bou = ctx.batch("bougain", () => new Batch(ico, mat("#ffffff")));
  const pots = ctx.batch("pot", () => new Batch(cyl6, mat(COL.terracotta)));
  const steps = ctx.batch("steps", () => new Batch(box, mat(COL.cream)));
  const zones: [number, number, number, number][] = [
    [0, 46, 24, 30],
    [-22, 2, 22, 26],
    [-34, -18, 16, 14],
    [10, -18, 16, 14],
    [-46, 34, 12, 10],
    [18, 34, 16, 14],
    [-14, -52, 14, 10],
    [24, 54, 12, 8],
    [-26, 44, 14, 12],
    [10, 10, 10, 8],
  ];
  const placed: { x: number; z: number; r: number }[] = [];
  for (const [zx, zz, zr, tries] of zones) {
    for (let k = 0; k < tries * 3 && tries > 0; k++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * zr;
      const x = zx + Math.cos(a) * r;
      const z = zz + Math.sin(a) * r;
      const w = 3.4 + rnd() * 3;
      const d = 3.4 + rnd() * 3;
      const rad = Math.hypot(w, d) / 2;
      const hh = height(x, z);
      if (hh < 1.4 || slopeAt(x, z) > 0.35) continue;
      if (roadDist(x, z) < rad + 3.2) continue;
      if (inPlace(x, z, rad + 1)) continue;
      if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + rad + 0.6)) continue;
      placed.push({ x, z, r: rad });
      const road = nearestRoad(x, z);
      const ry = Math.atan2(road.x - x, road.z - z);
      house(x, z, w, d, ry);
      if (placed.length > 120) break;
    }
  }

  function house(x: number, z: number, w: number, d: number, ry: number) {
    let base = Infinity;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const [cx, cz] = local(x, z, ry, (sx * w) / 2, (sz * d) / 2);
      base = Math.min(base, height(cx, cz));
    }
    base -= 0.3;
    const h = 2.9 + rnd() * 1.6;
    const tint = rnd() < 0.12 ? "#f3e2c4" : rnd() < 0.2 ? "#f9f5ee" : "#ffffff";
    wall.add(x, base + h / 2, z, w, h, d, ry, tint);
    // rooftop parapet lip
    wall.add(x, base + h + 0.12, z, w + 0.18, 0.24, d + 0.18, ry, tint);
    ctx.solid(x, base + h / 2, z, w / 2, h / 2, d / 2, ry);
    const accent = ACCENTS[Math.floor(rnd() * ACCENTS.length)];
    let top = base + h;
    if (rnd() < 0.5) {
      const w2 = w * (0.45 + rnd() * 0.2);
      const d2 = d * (0.5 + rnd() * 0.2);
      const ox = (rnd() < 0.5 ? -1 : 1) * (w - w2) * 0.5;
      const oz = -(d - d2) * 0.5;
      const h2 = 2.2 + rnd() * 0.8;
      const [cx, cz] = local(x, z, ry, ox, oz);
      wall.add(cx, top + h2 / 2, cz, w2, h2, d2, ry, tint);
      wall.add(cx, top + h2 + 0.1, cz, w2 + 0.16, 0.2, d2 + 0.16, ry, tint);
      const [wx, wz] = local(x, z, ry, ox, oz + d2 / 2 + 0.02);
      panes.add(wx, top + 1.2, wz, 0.7, 0.9, 0.08, ry);
      if (rnd() < 0.45) {
        const [dx, dz] = local(x, z, ry, ox, oz);
        const dr = Math.min(w2, d2) * 0.36;
        wall.add(dx, top + h2 + 0.35, dz, dr * 2.1, 0.7, dr * 2.1, ry, tint);
        domes.add(dx, top + h2 + 0.7, dz, dr, dr * 1.05, dr, 0);
      }
      top += h2;
    } else if (rnd() < 0.3) {
      const dr = Math.min(w, d) * 0.3;
      wall.add(x, top + 0.35, z, dr * 2.1, 0.7, dr * 2.1, ry, tint);
      domes.add(x, top + 0.7, z, dr, dr * 1.05, dr, 0);
    }
    // door + steps + pot
    const dx0 = (rnd() - 0.5) * (w - 1.6);
    const [ddx, ddz] = local(x, z, ry, dx0, d / 2 + 0.03);
    doors.add(ddx, base + 0.3 + 1.0, ddz, 1.0, 2.0, 0.1, ry, accent);
    const [stx, stz] = local(x, z, ry, dx0, d / 2 + 0.35);
    steps.add(stx, base + 0.35, stz, 1.6, 0.3, 0.6, ry);
    if (rnd() < 0.7) {
      const [px, pz] = local(x, z, ry, dx0 + 1.1, d / 2 + 0.45);
      pots.add(px, height(px, pz) + 0.3, pz, 0.9, 1, 0.9, 0);
      bou.add(px, height(px, pz) + 0.85, pz, 0.38, 0.32, 0.38, rnd() * 3, "#5f8a3a");
    }
    // windows with shutters
    const nWin = w > 4.5 ? 2 : 1;
    for (let i = 0; i < nWin; i++) {
      const lx = nWin === 1 ? (dx0 > 0 ? -w / 4 : w / 4) : (i === 0 ? -1 : 1) * w * 0.3;
      if (Math.abs(lx - dx0) < 1.2) continue;
      const [wx, wz] = local(x, z, ry, lx, d / 2 + 0.03);
      panes.add(wx, base + 2.0, wz, 0.75, 0.95, 0.08, ry);
      for (const sd of [-1, 1]) {
        const [sx, sz] = local(x, z, ry, lx + sd * 0.6, d / 2 + 0.05);
        doors.add(sx, base + 2.0, sz, 0.38, 1.0, 0.08, ry, accent);
      }
    }
    for (const sd of [-1, 1]) {
      if (rnd() < 0.6) {
        const [wx, wz] = local(x, z, ry, sd * (w / 2 + 0.03), (rnd() - 0.5) * d * 0.4);
        panes.add(wx, base + 2.0, wz, 0.08, 0.9, 0.7, ry);
      }
    }
    // bougainvillea spilling from a corner
    if (rnd() < 0.5) {
      const sx = rnd() < 0.5 ? -1 : 1;
      const cols = [COL.bougain, COL.bougain2, "#c42a6a", "#e0458c"];
      for (let i = 0; i < 6; i++) {
        const [bx, bz] = local(x, z, ry, sx * (w / 2 - 0.2 - rnd() * 1.4), d / 2 + 0.2 + rnd() * 0.3);
        const s = 0.45 + rnd() * 0.5;
        bou.add(bx, base + h - 0.3 - rnd() * 1.8 * (i / 6), bz, s, s * 0.8, s, rnd() * 3, cols[i % 4]);
      }
      const [lx, lz] = local(x, z, ry, sx * (w / 2 - 0.9), d / 2 + 0.15);
      bou.add(lx, base + h * 0.45, lz, 0.25, h * 0.45, 0.25, 0, COL.trunk);
    }
  }
}

export function buildChapelAndMills(ctx: WorldCtx) {
  // Blue-domed chapel on the hill
  const cx = 10;
  const cz = -50;
  const b = height(cx, cz) - 0.2;
  const g = new THREE.Group();
  g.position.set(cx, b, cz);
  g.rotation.y = 0.5;
  const white = mat("#ffffff");
  const wb = mesh(box, white);
  wb.scale.set(5, 4, 7);
  wb.position.y = 2;
  const drum = mesh(cyl6, white);
  drum.scale.set(1.9, 1.2, 1.9);
  drum.position.y = 4.6;
  const dm = mesh(new THREE.SphereGeometry(1.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(COL.cobalt));
  dm.position.y = 5.2;
  const cross = mesh(box, mat("#f6f1e7"));
  cross.scale.set(0.12, 1, 0.12);
  cross.position.y = 7.5;
  const crossH = mesh(box, mat("#f6f1e7"));
  crossH.scale.set(0.6, 0.12, 0.12);
  crossH.position.y = 7.7;
  const bell = mesh(box, white);
  bell.scale.set(1.6, 2, 0.6);
  bell.position.set(0, 5, 3.2);
  const door = mesh(box, mat(COL.cobalt));
  door.scale.set(1.2, 2.2, 0.1);
  door.position.set(0, 1.1, 3.52);
  g.add(wb, drum, dm, cross, crossH, bell, door);
  ctx.scene.add(g);
  ctx.solid(cx, b + 2, cz, 2.6, 2, 3.6, 0.5);

  // Windmills on the west ridge
  const mills: [number, number][] = [
    [-66, -14],
    [-70, -2],
    [-60, -28],
  ];
  mills.forEach(([x, z], i) => {
    const y = height(x, z) - 0.3;
    const m = new THREE.Group();
    m.position.set(x, y, z);
    m.rotation.y = Math.PI / 2 + 0.3 * i;
    const tower = mesh(new THREE.CylinderGeometry(2, 2.4, 6, 10), white);
    tower.position.y = 3;
    const roof = mesh(new THREE.ConeGeometry(2.3, 2, 10), mat("#8a6a48"));
    roof.position.y = 7;
    const door2 = mesh(box, mat(COL.cobalt));
    door2.scale.set(0.9, 1.8, 0.2);
    door2.position.set(0, 0.9, 2.3);
    const hub = new THREE.Group();
    hub.position.set(0, 6.4, 2.4);
    const sails = new THREE.Group();
    for (let k = 0; k < 8; k++) {
      const arm = new THREE.Group();
      arm.rotation.z = (k / 8) * Math.PI * 2;
      const spar = mesh(box, mat(COL.woodDark), false);
      spar.scale.set(0.12, 5.4, 0.12);
      spar.position.y = 2.7;
      const sail = mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(1.4, 4.8, 0), new THREE.Vector3(0, 5.2, 0)]), new THREE.MeshLambertMaterial({ color: "#fbf5e8", side: THREE.DoubleSide }), false);
      sail.geometry.computeVertexNormals();
      arm.add(spar, sail);
      sails.add(arm);
    }
    hub.add(sails);
    m.add(tower, roof, door2, hub);
    ctx.scene.add(m);
    ctx.circle(x, z, 2.5);
    ctx.updaters.push((f) => (sails.rotation.z -= f.dt * (0.6 + i * 0.1)));
  });
}

export function buildNature(ctx: WorldCtx) {
  const rnd = mulberry32(99);
  const trunk = ctx.batch("trunk", () => new Batch(cyl6, mat(COL.trunk)));
  const leaf = ctx.batch("leaf", () => new Batch(ico, mat("#ffffff")));
  const cyp = ctx.batch("cypress", () => new Batch(cone, mat(COL.cypress)));
  const fr = ctx.batch("frond", () => new Batch(frond, mat("#ffffff")));
  const rocks = ctx.batch("rock", () => new Batch(dode, mat("#ffffff")));
  const walls = ctx.batch("drywall", () => new Batch(box, mat("#ffffff")));
  const ok = (x: number, z: number, m: number) => ctx.clear(x, z, m) && roadDist(x, z) > 4.2;
  const olive = (x: number, z: number, s: number) => {
    const y = height(x, z);
    const lean = (rnd() - 0.5) * 0.3;
    trunk.add(x, y + 0.9 * s, z, 0.24 * s, 1.8 * s, 0.24 * s, rnd() * 3, undefined, lean, -lean);
    const shades = ["#8f9c5e", "#7e8d4f", "#9eaa6c"];
    for (let k = 0; k < 3; k++) {
      const a = rnd() * Math.PI * 2;
      leaf.add(x + Math.cos(a) * 0.8 * s, y + (2.1 + rnd() * 0.6) * s, z + Math.sin(a) * 0.8 * s, 1.3 * s, 0.85 * s, 1.3 * s, rnd() * 3, shades[k]);
    }
    ctx.circle(x, z, 0.5 * s);
  };
  const cypress = (x: number, z: number, s: number) => {
    const y = height(x, z);
    trunk.add(x, y + 0.4, z, 0.2, 0.8, 0.2);
    cyp.add(x, y + 0.6 + 3 * s, z, 0.85 * s, 6 * s, 0.85 * s, rnd() * 3);
    ctx.circle(x, z, 0.6 * s);
  };
  const palm = (x: number, z: number, s: number) => {
    const y = height(x, z);
    const lean = 0.1 + rnd() * 0.18;
    const dir = rnd() * Math.PI * 2;
    let px = x;
    let pz = z;
    let py = y;
    for (let k = 0; k < 5; k++) {
      const l = 1.3 * s;
      const tilt = lean * (1 + k * 0.35);
      const cx = px + Math.sin(dir) * Math.sin(tilt) * l * 0.5;
      const cz = pz + Math.cos(dir) * Math.sin(tilt) * l * 0.5;
      trunk.add(cx, py + Math.cos(tilt) * l * 0.5, cz, 0.2 * s * (1 - k * 0.08), l * 1.05, 0.2 * s * (1 - k * 0.08), dir, k % 2 ? "#9a7a55" : "#86684a", tilt);
      px += Math.sin(dir) * Math.sin(tilt) * l;
      pz += Math.cos(dir) * Math.sin(tilt) * l;
      py += Math.cos(tilt) * l;
    }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + rnd() * 0.3;
      fr.add(px, py, pz, s, s, s, a, k % 2 ? "#4f8a3a" : "#5f9a44", 0.35 + rnd() * 0.35);
    }
    ctx.circle(x, z, 0.5);
  };

  // Olive groves on the plateaus, cypress clusters near the hill, palms on the shore.
  let n = 0;
  for (let k = 0; k < 2600 && n < 150; k++) {
    const x = (rnd() - 0.5) * 190;
    const z = (rnd() - 0.5) * 190;
    const h = height(x, z);
    if (h < 2 || slopeAt(x, z) > 0.5 || !ok(x, z, 2) || inPlace(x, z, 2)) continue;
    if (Math.hypot(x - SECRET_CAT.x, z - SECRET_CAT.z) < 5) continue;
    const wild = Math.sin(x * 0.05 + 1) * Math.cos(z * 0.07) > -0.2;
    if (!wild) continue;
    if (rnd() < 0.22 && z < 10) cypress(x, z, 0.8 + rnd() * 0.5);
    else olive(x, z, 0.8 + rnd() * 0.5);
    n++;
  }
  // cypress lines framing the chapel and lighthouse paths
  for (let i = 0; i < 6; i++) if (ok(14 + i * 2.6, -56 + i * 0.6, 1)) cypress(14 + i * 2.6, -56 + i * 0.6, 1.1);
  for (let i = 0; i < 5; i++) if (ok(-14 - i * 2, -54 - i * 2.4, 1)) cypress(-14 - i * 2, -54 - i * 2.4, 1.2);
  // grass tufts and wildflowers for texture up close
  const tuft = ctx.batch("tuft", () => new Batch(new THREE.ConeGeometry(0.16, 0.45, 3), mat("#ffffff"), false));
  const flower = ctx.batch("flower", () => new Batch(new THREE.IcosahedronGeometry(0.11, 0), mat("#ffffff"), false));
  const tuftCols = ["#a3a55a", "#8f9a4c", "#b9ad62", "#7f8f45"];
  const flowerCols = ["#fbf5e8", "#f2c14e", "#e85a9a", "#c86bff", "#fbf5e8"];
  for (let k = 0; k < 9000 && tuft.mats.length < 2600; k++) {
    const x = (rnd() - 0.5) * 200;
    const z = (rnd() - 0.5) * 200;
    const h = height(x, z);
    if (h < 1.3 || roadDist(x, z) < 3.3 || !ctx.clear(x, z, 0.4) || inPlace(x, z, -2)) continue;
    const n = 2 + Math.floor(rnd() * 3);
    for (let j = 0; j < n; j++) {
      const tx = x + (rnd() - 0.5) * 0.8;
      const tz = z + (rnd() - 0.5) * 0.8;
      const s = 0.6 + rnd() * 0.8;
      tuft.add(tx, height(tx, tz) + 0.16 * s, tz, s, s, s, rnd() * 3, tuftCols[(k + j) % 4], (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.4);
    }
    if (rnd() < 0.35) flower.add(x + 0.3, h + 0.35, z, 1, 1, 1, 0, flowerCols[k % flowerCols.length]);
  }
  // palms
  let pcount = 0;
  for (let k = 0; k < 4000 && pcount < 48; k++) {
    const a = rnd() * Math.PI * 2;
    const r = coastR(Math.cos(a), Math.sin(a)) * (0.7 + rnd() * 0.12);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = height(x, z);
    if (h < 0.5 || h > 2.6 || z < -10 || !ok(x, z, 2.5)) continue;
    const beach = Math.hypot(x - PLACE_BEACH.x, z - PLACE_BEACH.z) < 26;
    if (!beach && inPlace(x, z, 4)) continue;
    palm(x, z, 0.9 + rnd() * 0.35);
    pcount++;
  }
  // coastal rocks
  for (let k = 0; k < 3000; k++) {
    const a = rnd() * Math.PI * 2;
    const r = coastR(Math.cos(a), Math.sin(a)) * (0.82 + rnd() * 0.16);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = height(x, z);
    if (h > 0.6 || h < -2.5) continue;
    if (Math.abs(x) < 6 && z > 70) continue;
    const s = 0.6 + rnd() * 1.8;
    const tone = ["#b5a387", "#a39278", "#c4b496"][k % 3];
    rocks.add(x, h + s * 0.2, z, s, s * 0.7, s * 1.1, rnd() * 3, tone, rnd(), rnd());
    if (rocks.mats.length > 140) break;
  }
  // dry-stone walls along the fields
  for (let w = 0, tries = 0; w < 18 && tries < 400; tries++) {
    let x = (rnd() - 0.5) * 160;
    let z = (rnd() - 0.5) * 160;
    const dir = rnd() * Math.PI;
    const segs: [number, number][] = [];
    for (let s = 0; s < 6; s++) {
      if (height(x, z) < 1.8 || !ok(x, z, 1.2) || inPlace(x, z, 3)) break;
      segs.push([x, z]);
      x += Math.cos(dir) * 3.8;
      z -= Math.sin(dir) * 3.8;
    }
    if (segs.length < 3) continue;
    for (const [sx, sz] of segs) {
      const y = height(sx, sz);
      walls.add(sx, y + 0.3, sz, 4, 0.75, 0.6, dir, rnd() < 0.5 ? "#cbbd9f" : "#bfae8e");
      ctx.solid(sx, y + 0.3, sz, 2, 0.4, 0.3, dir);
    }
    w++;
  }
}

/** Street lamps with warm pools of light at night. */
export function buildLamps(ctx: WorldCtx) {
  const post = ctx.batch("lamppost", () => new Batch(cyl6, mat("#2b2f3a")));
  const lamp = ctx.batch("lamp", () => new Batch(box, ctx.glow("#ffd37a", 0.15, 2.2), false));
  const poolTex = textTexture(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,200,120,0.85)");
    g.addColorStop(1, "rgba(255,200,120,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const pools: THREE.Matrix4[] = [];
  let last = { x: 1e9, z: 1e9 };
  roadPts.forEach((p, i) => {
    if (Math.hypot(p.x - last.x, p.z - last.z) < 18) return;
    const q = roadPts[Math.min(i + 1, roadPts.length - 1)];
    const tx = q.x - p.x;
    const tz = q.z - p.z;
    const l = Math.hypot(tx, tz) || 1;
    const x = p.x - (tz / l) * 3.4;
    const z = p.z + (tx / l) * 3.4;
    if (height(x, z) < 0.6 || !ctx.clear(x, z, 0.5) || roadDist(x, z) < 3.2) return;
    last = p;
    const y = height(x, z);
    post.add(x, y + 1.7, z, 0.09, 3.4, 0.09);
    lamp.add(x, y + 3.55, z, 0.38, 0.5, 0.38);
    ctx.circle(x, z, 0.25);
    pools.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.25, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), new THREE.Vector3(9, 9, 1)));
  });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), poolMat, pools.length);
  pools.forEach((m, i) => im.setMatrixAt(i, m));
  im.renderOrder = 2;
  ctx.scene.add(im);
  ctx.updaters.push((f) => {
    poolMat.opacity = f.night * 0.9;
    im.visible = f.night > 0.02;
  });
}

/** Drifting clouds and a sailboat circling the island: life for the wide shots. */
export function buildAmbient(ctx: WorldCtx) {
  const rnd = mulberry32(77);
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({ color: "#fff6ea", flatShading: true, emissive: "#ffd9b0", emissiveIntensity: 0.25 });
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    const a = (i / 14) * Math.PI * 2 + rnd();
    const r = 125 + rnd() * 90;
    c.position.set(Math.cos(a) * r, 26 + rnd() * 22, Math.sin(a) * r);
    for (let k = 0; k < 4 + Math.floor(rnd() * 3); k++) {
      const p = new THREE.Mesh(ico, cloudMat);
      const sz = 3 + rnd() * 4;
      p.scale.set(sz * 1.4, sz * 0.7, sz);
      p.position.set((k - 2) * 3.5 + rnd() * 2, rnd() * 1.5, rnd() * 3);
      c.add(p);
    }
    clouds.add(c);
  }
  ctx.scene.add(clouds);
  const boat = new THREE.Group();
  const hull = mesh(new THREE.BoxGeometry(1.6, 0.7, 5), mat("#f6f1e7"));
  hull.position.y = 0.2;
  const stripe = mesh(new THREE.BoxGeometry(1.62, 0.18, 5.02), mat(COL.cobalt));
  stripe.position.y = 0.35;
  const mast = mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 5), mat(COL.woodDark));
  mast.position.y = 3.4;
  const sail = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.8, -1.8), new THREE.Vector3(0, 6.2, 0), new THREE.Vector3(0, 0.8, 0.1)]),
    new THREE.MeshLambertMaterial({ color: "#fffaf0", side: THREE.DoubleSide }),
  );
  sail.geometry.computeVertexNormals();
  sail.castShadow = true;
  boat.add(hull, stripe, mast, sail);
  ctx.scene.add(boat);
  ctx.updaters.push((f) => {
    clouds.rotation.y = f.t * 0.004;
    const a = f.t * 0.02 + 2;
    boat.position.set(Math.cos(a) * 128, Math.sin(f.t * 1.3) * 0.1 - 0.1, Math.sin(a) * 128);
    boat.rotation.y = -a;
    boat.rotation.z = 0.12 + Math.sin(f.t) * 0.03;
  });
}
