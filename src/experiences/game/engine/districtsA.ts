import * as THREE from "three";
import { COL, Batch, mat, mesh, signTexture, textTexture, mulberry32, FONT } from "./kit";
import { PLACE } from "./places";
import { height, DECKS } from "./terrain";
import { RAPIER, type SoloProp, type PropSet } from "./physics";
import { propSet, cuboid, cylinder } from "./props";
import type { WorldCtx } from "./ctx";

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 12);

export function addBox(ctx: WorldCtx, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, ry = 0, solid = false) {
  const m = mesh(box, mat(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.rotation.y = ry;
  ctx.scene.add(m);
  if (solid) ctx.solid(x, y, z, sx / 2, sy / 2, sz / 2, ry);
  return m;
}

/** A flat sign board with a canvas texture on both faces. */
export function board(tex: THREE.Texture, w: number, h: number, emissive = 0) {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ map: tex, emissive: "#ffffff", emissiveMap: emissive ? tex : null, emissiveIntensity: emissive });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  front.position.z = 0.06;
  const back = front.clone();
  back.rotation.y = Math.PI;
  back.position.z = -0.06;
  const frame = mesh(box, mat(COL.woodDark));
  frame.scale.set(w + 0.2, h + 0.2, 0.1);
  g.add(frame, front, back);
  return { group: g, material: m };
}

// ---------- HATZO letters ----------
type Stroke = [number, number, number, number, number?]; // cx, cy, w, h, rotZ
const S = 0.62;
const LETTERS: Record<string, Stroke[]> = {
  H: [[-0.8, 1.5, S, 3], [0.8, 1.5, S, 3], [0, 1.5, 1.0, S]],
  A: [[-0.8, 1.35, S, 2.7], [0.8, 1.35, S, 2.7], [0, 2.69, 2.22, S], [0, 1.35, 1.0, S * 0.9]],
  T: [[0, 2.69, 2.4, S], [0, 1.2, S, 2.4]],
  Z: [[0, 2.69, 2.2, S], [0, 0.31, 2.2, S], [0, 1.5, S, 2.6, -0.62]],
  O: [[-0.8, 1.5, S, 3], [0.8, 1.5, S, 3], [0, 2.69, 1.0, S], [0, 0.31, 1.0, S]],
};

export function buildPort(ctx: WorldCtx) {
  const P = PLACE.port;
  const base = height(P.x, P.z);
  const letters: SoloProp[] = [];
  const word = "HATZO";
  const depth = 0.8;
  const letterMat = new THREE.MeshLambertMaterial({ color: COL.cobalt, emissive: "#3f7dff", emissiveIntensity: 0, flatShading: true });
  ctx.glows.push({ mat: letterMat, day: 0, night: 0.55 });
  word.split("").forEach((ch, i) => {
    const g = new THREE.Group();
    const m = letterMat;
    const cols: RAPIER.ColliderDesc[] = [];
    for (const [cx, cy, w, h, rz = 0] of LETTERS[ch]) {
      const b = mesh(box, m);
      b.scale.set(w, h, depth);
      b.position.set(cx, cy, 0);
      b.rotation.z = rz;
      g.add(b);
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rz);
      cols.push(RAPIER.ColliderDesc.cuboid(w / 2, h / 2, depth / 2).setTranslation(cx, cy, 0).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }).setDensity(0.6).setFriction(0.8));
    }
    const p = new THREE.Vector3((i - 2) * 3.1, base + 0.02, 54);
    const q = new THREE.Quaternion();
    g.position.copy(p);
    ctx.scene.add(g);
    const body = ctx.phys.dynamic(p, q, cols, { damping: 0.1 });
    const solo = { obj: g, body, home: { p: p.clone(), q }, tag: "letter" };
    ctx.phys.solos.push(solo);
    letters.push(solo);
  });

  // welcome board
  const tex = signTexture(
    [
      { t: "WELCOME TO", s: 34, c: COL.terracotta, w: 700 },
      { t: "HATZO ISLAND", s: 74, w: 800 },
      { t: ctx.data.about.name, s: 34, w: 600 },
      { t: "drive to a glowing marker · press E", s: 26, c: "#5a6a8a", w: 500 },
    ],
    "#fbf5e8",
    COL.ink,
    640,
    320,
  );
  const wb = board(tex, 5, 2.5);
  wb.group.position.set(P.mx + 1, base + 3.2, P.mz - 4.5);
  wb.group.rotation.y = -0.5;
  ctx.scene.add(wb.group);
  for (const sx of [-2.2, 2.2]) {
    const post = mesh(box, mat(COL.woodDark));
    post.scale.set(0.2, 3.2, 0.2);
    post.position.set(sx, -1.6, 0);
    wb.group.add(post);
  }
  ctx.box(P.mx + 1, P.mz - 4.5, 2.6, 0.3, -0.5);

  // pier
  const pier = DECKS[0];
  const deck = mesh(box, mat(COL.wood));
  deck.scale.set(pier.hw * 2, 0.35, pier.hd * 2);
  deck.position.set(pier.x, pier.y0 - 0.17, pier.z);
  ctx.scene.add(deck);
  const posts = ctx.batch("pierpost", () => new Batch(cyl, mat(COL.woodDark)));
  for (let z = pier.z - pier.hd + 2; z <= pier.z + pier.hd; z += 4)
    for (const sx of [-1, 1]) posts.add(pier.x + sx * (pier.hw - 0.1), pier.y0 - 2.5, z, 0.22, 5, 0.22);
  for (let z = pier.z - pier.hd + 4; z <= pier.z + pier.hd; z += 6) {
    for (const sx of [-1, 1]) {
      posts.add(pier.x + sx * (pier.hw - 0.3), pier.y0 + 0.35, z, 0.18, 0.7, 0.18);
      ctx.circle(pier.x + sx * (pier.hw - 0.3), z, 0.25);
    }
  }
  // the pier edges stop the scooter only at the very end
  ctx.box(pier.x, pier.z + pier.hd + 0.4, pier.hw, 0.3);

  // boats
  const boatColors: [string, string][] = [
    [COL.cobalt, "#f6f1e7"],
    [COL.terracotta, "#f6f1e7"],
    ["#2c8c8a", "#f2c14e"],
  ];
  const boats: [number, number, number][] = [
    [-6.5, 96, 0.08],
    [6.8, 104, -0.1],
    [-6.2, 110, 0.15],
  ];
  boats.forEach(([x, z, ry], i) => {
    const b = kaiki(boatColors[i][0], boatColors[i][1]);
    b.position.set(x, 0, z);
    b.rotation.y = ry;
    ctx.scene.add(b);
    ctx.box(x, z, 1.4, 4, ry);
    ctx.updaters.push((f) => {
      b.position.y = Math.sin(f.t * 1.1 + i * 2) * 0.12 - 0.15;
      b.rotation.z = Math.sin(f.t * 0.9 + i) * 0.04;
      b.rotation.x = Math.sin(f.t * 0.7 + i * 3) * 0.025;
    });
  });

  // crates on the quay
  const crateTex = textTexture(128, 128, (c) => {
    c.fillStyle = "#c89a62";
    c.fillRect(0, 0, 128, 128);
    c.strokeStyle = "#8a5f36";
    c.lineWidth = 10;
    c.strokeRect(5, 5, 118, 118);
    c.beginPath();
    c.moveTo(8, 8);
    c.lineTo(120, 120);
    c.stroke();
  });
  const crateMat = new THREE.MeshLambertMaterial({ map: crateTex });
  const crates = [
    { x: 7, z: 78 },
    { x: 8.3, z: 78 },
    { x: 7.6, z: 79.3 },
    { x: 7.6, z: 78.6, up: 1 },
    { x: -9, z: 76 },
    { x: -10.3, z: 76.4 },
    { x: 26, z: 8 },
    { x: 27.3, z: 8 },
    { x: 26.6, z: 8.2, up: 1 },
  ].map((c) => ({ x: c.x, y: height(c.x, c.z) + 0.6 + (c.up ? 1.2 : 0), z: c.z, ry: (c.x * 7) % 1 }));
  propSet(ctx, "crate", new THREE.BoxGeometry(1.2, 1.2, 1.2), crateMat, crates, cuboid(0.6, 0.6, 0.6, 0.5));

  // bollards + lamp on quay edge
  for (let x = -16; x <= 16; x += 8) {
    if (Math.abs(x) < 4) continue;
    const z = 82;
    const b = mesh(cyl, mat("#3a3f4a"));
    b.scale.set(0.3, 0.7, 0.3);
    b.position.set(x, height(x, z) + 0.35, z);
    ctx.scene.add(b);
    ctx.circle(x, z, 0.35);
  }
  return { letters };
}

function kaiki(hullCol: string, stripe: string) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-4, 0.6);
  shape.quadraticCurveTo(-3.6, -0.6, -1.5, -0.7);
  shape.lineTo(2.2, -0.7);
  shape.quadraticCurveTo(3.8, -0.4, 4.3, 1.1);
  shape.lineTo(-4, 0.9);
  const hull = mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: false }).translate(0, 0, -1.2), mat("#f6f1e7"));
  hull.rotation.y = Math.PI / 2;
  const band = mesh(new THREE.BoxGeometry(2.46, 0.25, 7.6), mat(hullCol));
  band.position.y = 0.55;
  const band2 = mesh(new THREE.BoxGeometry(2.46, 0.12, 7.4), mat(stripe));
  band2.position.y = 0.3;
  const deck = mesh(new THREE.BoxGeometry(2.2, 0.1, 7.4), mat(COL.wood));
  deck.position.y = 0.7;
  const cabin = mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), mat("#f6f1e7"));
  cabin.position.set(0, 1.3, 1.2);
  const roof = mesh(new THREE.BoxGeometry(1.8, 0.15, 1.9), mat(hullCol));
  roof.position.set(0, 1.95, 1.2);
  const mast = mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 5), mat(COL.woodDark));
  mast.position.set(0, 2.2, -1.5);
  g.add(hull, band, band2, deck, cabin, roof, mast);
  return g;
}

export function buildSquare(ctx: WorldCtx) {
  const P = PLACE.skills;
  const base = height(P.x, P.z);
  const plaza = mesh(new THREE.CylinderGeometry(11.5, 11.8, 0.4, 28), mat("#e6dcc6"), false);
  plaza.position.set(P.x, base - 0.05, P.z);
  ctx.scene.add(plaza);
  const ring = mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.42, 28), mat("#d2c3a3"), false);
  ring.position.set(P.x, base, P.z);
  ctx.scene.add(ring);
  // fountain
  const f1 = mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.8, 16), mat(COL.marble));
  f1.position.set(P.x, base + 0.4, P.z);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.1, 16), new THREE.MeshLambertMaterial({ color: "#4fd6cf", emissive: "#2ab3b0", emissiveIntensity: 0.35 }));
  water.position.set(P.x, base + 0.75, P.z);
  const col = mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8), mat(COL.marble));
  col.position.set(P.x, base + 1.6, P.z);
  const bowl = mesh(new THREE.CylinderGeometry(1.2, 0.5, 0.5, 14), mat(COL.marble));
  bowl.position.set(P.x, base + 2.7, P.z);
  ctx.scene.add(f1, water, col, bowl);
  ctx.solid(P.x, base + 0.5, P.z, 2.5, 0.6, 2.5);
  ctx.obstacles.pop();
  ctx.circle(P.x, P.z, 2.8);
  // spray droplets
  const drops: THREE.Mesh[] = [];
  const dropMat = new THREE.MeshBasicMaterial({ color: "#d8fbff" });
  for (let i = 0; i < 16; i++) {
    const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), dropMat);
    ctx.scene.add(d);
    drops.push(d);
  }
  ctx.updaters.push((f) => {
    drops.forEach((d, i) => {
      const a = (i / drops.length) * Math.PI * 2;
      const t = (f.t * 0.9 + i * 0.37) % 1;
      const r = 0.4 + t * 1.3;
      d.position.set(P.x + Math.cos(a) * r, base + 2.9 + t * 1.2 - t * t * 2.4, P.z + Math.sin(a) * r);
    });
  });

  // café: tables + blue chairs you can scatter
  const chairs: { x: number; y: number; z: number; ry: number; color: string }[] = [];
  const tables: [number, number][] = [
    [-6.5, 31],
    [-7.5, 24],
    [6.5, 31.5],
  ];
  const rnd = mulberry32(5);
  for (const [tx, tz] of tables) {
    const t = mesh(cyl, mat("#f6f1e7"));
    t.scale.set(0.6, 0.06, 0.6);
    t.position.set(tx, base + 0.82, tz);
    const leg = mesh(cyl, mat("#2b2f3a"));
    leg.scale.set(0.06, 0.8, 0.06);
    leg.position.set(tx, base + 0.4, tz);
    ctx.scene.add(t, leg);
    ctx.circle(tx, tz, 0.5);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + rnd();
      chairs.push({ x: tx + Math.cos(a) * 1.1, y: base + 0.5, z: tz + Math.sin(a) * 1.1, ry: -a + Math.PI / 2, color: k % 2 ? COL.cobalt : "#2f6fd0" });
    }
  }
  const chairGeo = chairGeometry();
  propSet(ctx, "chair", chairGeo, mat("#ffffff"), chairs, cuboid(0.25, 0.5, 0.25, 0.4));

  // string lights over the plaza
  const poles: [number, number][] = [
    [-9, 18],
    [9, 18],
    [9, 34],
    [-9, 34],
  ];
  const bulbMat = ctx.glow("#ffe2a0", 0.3, 2.5);
  const bulbs = ctx.batch("bulb", () => new Batch(new THREE.IcosahedronGeometry(0.12, 0), bulbMat, false));
  const wire: THREE.Vector3[] = [];
  poles.forEach(([x, z], i) => {
    const pole = mesh(cyl, mat("#2b2f3a"));
    pole.scale.set(0.08, 4.4, 0.08);
    pole.position.set(x, base + 2.2, z);
    ctx.scene.add(pole);
    ctx.circle(x, z, 0.2);
    const [nx, nz] = poles[(i + 2) % 4];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      const px = x + (nx - x) * t;
      const pz = z + (nz - z) * t;
      const py = base + 4.3 - Math.sin(t * Math.PI) * 1.4;
      if (i < 2) {
        wire.push(new THREE.Vector3(px, py, pz));
        if (k % 2 === 0) bulbs.add(px, py - 0.15, pz, 1, 1, 1);
      }
    }
  });
  const line = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(wire.flatMap((p, i) => (i % 17 === 16 ? [] : [p, wire[i + 1]]))),
    new THREE.LineBasicMaterial({ color: "#2b2f3a" }),
  );
  ctx.scene.add(line);

  // skills board (the marker)
  const cats = ctx.data.skills.categories;
  const total = cats.reduce((a, c) => a + c.skills.length, 0);
  const tex = textTexture(640, 400, (c) => {
    c.fillStyle = "#fbf5e8";
    c.fillRect(0, 0, 640, 400);
    c.fillStyle = COL.ink;
    c.font = `800 64px ${FONT}`;
    c.textAlign = "center";
    c.fillText("SKILL SQUARE", 320, 92);
    c.font = `600 28px ${FONT}`;
    c.fillStyle = "#5a6a8a";
    c.fillText(`${total} tokens hidden around the island`, 320, 140);
    cats.forEach((cat, i) => {
      const y = 190 + i * 50;
      c.fillStyle = TOKEN_COLORS[i % TOKEN_COLORS.length];
      c.beginPath();
      c.arc(150, y, 16, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = COL.ink;
      c.textAlign = "left";
      c.font = `700 30px ${FONT}`;
      c.fillText(`${cat.name}  ·  ${cat.skills.length}`, 182, y + 10);
      c.textAlign = "center";
    });
  });
  const sb = board(tex, 4.2, 2.6);
  sb.group.position.set(P.mx + 2.5, base + 2.4, P.mz - 1.5);
  sb.group.rotation.y = 0.6;
  ctx.scene.add(sb.group);
  for (const sx of [-1.9, 1.9]) {
    const post = mesh(box, mat(COL.woodDark));
    post.scale.set(0.18, 2.4, 0.18);
    post.position.set(sx, -1.2, 0);
    sb.group.add(post);
  }
  ctx.box(P.mx + 2.5, P.mz - 1.5, 2.2, 0.3, 0.6);
}

export const TOKEN_COLORS = ["#ff5a8a", "#4f8cff", "#ffb02e", "#2ec4b6", "#c86bff", "#b6e05a"];

function chairGeometry() {
  const parts = [
    new THREE.BoxGeometry(0.5, 0.06, 0.5).translate(0, 0, 0),
    new THREE.BoxGeometry(0.5, 0.55, 0.06).translate(0, 0.3, -0.22),
    ...[[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]].map(([x, z]) => new THREE.BoxGeometry(0.05, 0.45, 0.05).translate(x, -0.25, z)),
  ];
  return mergeGeos(parts);
}

/** Minimal geometry merge (positions + normals + uvs) so we don't pull BufferGeometryUtils for one call site. */
export function mergeGeos(geos: THREE.BufferGeometry[]) {
  const pos: number[] = [];
  const nor: number[] = [];
  for (const g0 of geos) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...(g.attributes.position.array as Float32Array));
    nor.push(...(g.attributes.normal.array as Float32Array));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  return out;
}

export function buildAtelier(ctx: WorldCtx) {
  const P = PLACE.oneoff;
  const base = height(P.x, P.z);
  const bx = P.x;
  const bz = P.z - 3;
  // boutique shell
  addBox(ctx, bx, base + 2.9, bz, 13, 5.8, 7, "#fbf8f2", 0, true);
  addBox(ctx, bx, base + 5.95, bz, 13.4, 0.3, 7.4, "#fbf8f2");
  addBox(ctx, bx - 4.6, base + 6.8, bz - 1, 3.2, 1.4, 4, "#fbf8f2");
  // glass storefront
  const glass = ctx.glow("#ffd9b0", 0.35, 1.3);
  for (const sx of [-4, 0, 4]) {
    const g = mesh(box, glass, false);
    g.scale.set(3.4, 3.4, 0.1);
    g.position.set(bx + sx, base + 1.9, bz + 3.52);
    ctx.scene.add(g);
  }
  for (const sx of [-6, -2, 2, 6]) addBox(ctx, bx + sx, base + 1.9, bz + 3.56, 0.22, 3.8, 0.16, "#15161a");
  addBox(ctx, bx, base + 3.85, bz + 3.56, 12.4, 0.22, 0.16, "#15161a");
  // awning
  const awning = mesh(new THREE.BoxGeometry(13, 0.14, 2.2), mat("#15161a"));
  awning.position.set(bx, base + 4.4, bz + 4.5);
  awning.rotation.x = 0.22;
  ctx.scene.add(awning);
  // sign
  const signTex = textTexture(1024, 192, (c) => {
    c.fillStyle = "#15161a";
    c.fillRect(0, 0, 1024, 192);
    c.fillStyle = "#ffffff";
    c.font = `800 128px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(ctx.data.experience[0]?.company.toUpperCase() ?? "ATELIER", 512, 100);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), new THREE.MeshLambertMaterial({ map: signTex, emissive: "#ffffff", emissiveMap: signTex, emissiveIntensity: 0.4 }));
  sign.position.set(bx + 1.2, base + 5.1, bz + 3.6);
  ctx.scene.add(sign);
  ctx.glows.push({ mat: sign.material as THREE.MeshLambertMaterial, day: 0.4, night: 1.6 });
  // neon "NOW"
  const nowTex = textTexture(256, 128, (c) => {
    c.fillStyle = "rgba(0,0,0,0)";
    c.fillRect(0, 0, 256, 128);
    c.font = `800 92px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.shadowColor = "#ff5a8a";
    c.shadowBlur = 18;
    c.fillStyle = "#ff8ab0";
    c.fillText("NOW", 128, 68);
  });
  const now = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: nowTex, transparent: true }));
  now.position.set(bx - 4.6, base + 6.8, bz + 1.05);
  ctx.scene.add(now);
  ctx.updaters.push((f) => {
    (now.material as THREE.MeshBasicMaterial).color.setScalar(0.8 + Math.sin(f.t * 6) * 0.08 + (Math.sin(f.t * 23) > 0.96 ? -0.4 : 0));
  });

  // mannequins that turn to watch you
  const outfits = [
    ["#ff5a8a", "#15161a"],
    ["#efe4cf", "#1d4fb0"],
    ["#2ec4b6", "#efe4cf"],
    ["#15161a", "#c8643c"],
  ];
  const mannequins: THREE.Group[] = [];
  outfits.forEach(([top, bottom], i) => {
    const g = new THREE.Group();
    const x = bx - 6 + i * 4;
    const z = bz + 6.6 + (i % 2) * 0.6;
    g.position.set(x, base, z);
    const stand = mesh(cyl, mat("#15161a"));
    stand.scale.set(0.45, 0.1, 0.45);
    stand.position.y = 0.05;
    const pole = mesh(cyl, mat("#15161a"));
    pole.scale.set(0.05, 0.9, 0.05);
    pole.position.y = 0.5;
    const legs = mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.9, 8), mat(bottom));
    legs.position.y = 1.35;
    const torso = mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.8, 8), mat(top));
    torso.position.y = 2.15;
    const shoulders = mesh(new THREE.SphereGeometry(0.36, 8, 6), mat(top));
    shoulders.scale.set(1.1, 0.5, 0.8);
    shoulders.position.y = 2.5;
    const head = mesh(new THREE.SphereGeometry(0.2, 10, 8), mat("#f3ece2"));
    head.position.y = 2.85;
    g.add(stand, pole, legs, torso, shoulders, head);
    ctx.scene.add(g);
    ctx.circle(x, z, 0.5);
    mannequins.push(g);
  });
  // clothing rack
  const rack = new THREE.Group();
  rack.position.set(bx + 8.4, base, bz + 5.5);
  rack.rotation.y = -0.9;
  const bar = mesh(cyl, mat("#c9a24a"));
  bar.scale.set(0.04, 3, 0.04);
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 1.9;
  rack.add(bar);
  for (const sx of [-1.5, 1.5]) {
    const leg = mesh(cyl, mat("#c9a24a"));
    leg.scale.set(0.04, 1.9, 0.04);
    leg.position.set(sx, 0.95, 0);
    rack.add(leg);
  }
  const garments: THREE.Mesh[] = [];
  ["#ff5a8a", "#f2c14e", "#efe4cf", "#1d4fb0", "#2ec4b6", "#15161a", "#c8643c"].forEach((c, i) => {
    const gm = mesh(new THREE.BoxGeometry(0.7, 1.0, 0.12).translate(0, -0.55, 0), mat(c));
    gm.position.set(-1.2 + i * 0.4, 1.9, 0);
    gm.rotation.y = Math.PI / 2;
    rack.add(gm);
    garments.push(gm);
  });
  ctx.scene.add(rack);
  ctx.box(bx + 8.4, bz + 5.5, 1.6, 0.4, -0.9);
  // try-on mirror (the AI bit)
  const mirrorTex = textTexture(128, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#ff8ab0");
    g.addColorStop(0.5, "#ffd3a0");
    g.addColorStop(1, "#7fd6ff");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 256);
  });
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshBasicMaterial({ map: mirrorTex }));
  mirror.position.set(bx - 8.6, base + 1.6, bz + 4.2);
  mirror.rotation.y = 0.7;
  const mframe = mesh(box, mat("#15161a"));
  mframe.scale.set(1.6, 2.8, 0.1);
  mframe.position.set(bx - 8.64, base + 1.6, bz + 4.16);
  mframe.rotation.y = 0.7;
  ctx.scene.add(mirror, mframe);
  ctx.box(bx - 8.6, bz + 4.2, 0.9, 0.3, 0.7);

  ctx.updaters.push((f) => {
    for (const m of mannequins) {
      const d = Math.hypot(f.px - m.position.x, f.pz - m.position.z);
      const target = d < 14 ? Math.atan2(f.px - m.position.x, f.pz - m.position.z) : 0;
      let diff = target - m.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      m.rotation.y += diff * Math.min(1, f.dt * 3);
    }
    const near = Math.hypot(f.px - rack.position.x, f.pz - rack.position.z) < 6 ? Math.min(f.speed, 12) / 12 : 0;
    garments.forEach((g, i) => (g.rotation.z = Math.sin(f.t * 2 + i) * (0.05 + near * 0.4)));
    (mirror.material as THREE.MeshBasicMaterial).color.setHSL(((f.t * 0.05) % 1), 0.25, 0.85);
  });

  // terracotta pots by the door
  const potItems = [-7.2, 7.2].flatMap((sx) => [0, 1].map((k) => ({ x: bx + sx + k * 0.8, y: base + 0.45, z: bz + 4.2 })));
  propSet(ctx, "pot", new THREE.CylinderGeometry(0.42, 0.3, 0.9, 9), mat(COL.terracotta), potItems, cylinder(0.45, 0.38, 0.8));
}

export function buildHarbor(ctx: WorldCtx) {
  const P = PLACE.p1;
  const base = height(P.x, P.z);
  const corr = textTexture(64, 64, (c) => {
    for (let i = 0; i < 16; i++) {
      c.fillStyle = i % 2 ? "#ffffff" : "#d4d4d4";
      c.fillRect(i * 4, 0, 4, 64);
    }
    c.fillStyle = "#b8b8b8";
    c.fillRect(0, 0, 64, 3);
    c.fillRect(0, 61, 64, 3);
  });
  const cmat = new THREE.MeshLambertMaterial({ map: corr });
  const colors = [COL.cobalt, COL.terracotta, "#2c8c8a", COL.yellow, "#e8e2d6", "#b23a3a"];
  const items: { x: number; y: number; z: number; ry: number; color: string }[] = [];
  let k = 0;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const x = P.x - 4 + col * 6.2;
      const z = P.z + 4 + row * 3.0;
      const stack = (row + col) % 3 === 0 ? 1 : 2;
      for (let s = 0; s < stack; s++) items.push({ x, y: base + 1.25 + s * 2.52, z, ry: Math.PI / 2 + (s ? 0.04 : 0), color: colors[k++ % colors.length] });
    }
  const containers = propSet(ctx, "container", new THREE.BoxGeometry(2.4, 2.5, 5.8), cmat, items, cuboid(1.2, 1.25, 2.9, 0.35, 0.05, 0.6));

  // gantry crane
  const crane = new THREE.Group();
  crane.position.set(P.x + 2, base, P.z + 7);
  const orange = mat("#e0662f");
  for (const sx of [-13, 13])
    for (const sz of [-5, 5]) {
      const leg = mesh(box, orange);
      leg.scale.set(0.6, 12, 0.6);
      leg.position.set(sx, 6, sz);
      crane.add(leg);
      ctx.circle(crane.position.x + sx, crane.position.z + sz, 0.6);
    }
  for (const sz of [-5, 5]) {
    const beam = mesh(box, orange);
    beam.scale.set(27, 1, 0.8);
    beam.position.set(0, 12.2, sz);
    crane.add(beam);
  }
  for (const sx of [-13, 13]) {
    const cross = mesh(box, orange);
    cross.scale.set(0.8, 0.8, 10.6);
    cross.position.set(sx, 12.2, 0);
    crane.add(cross);
  }
  const trolley = new THREE.Group();
  const tb = mesh(box, mat("#2b2f3a"));
  tb.scale.set(2.2, 1.2, 11);
  trolley.add(tb);
  trolley.position.y = 12.9;
  const cable = mesh(box, mat("#2b2f3a"), false);
  cable.scale.set(0.06, 6, 0.06);
  cable.position.y = -3.6;
  const hook = mesh(box, mat(COL.yellow));
  hook.scale.set(1.6, 0.4, 3);
  hook.position.y = -6.6;
  trolley.add(cable, hook);
  crane.add(trolley);
  ctx.scene.add(crane);
  ctx.updaters.push((f) => (trolley.position.x = Math.sin(f.t * 0.25) * 10));

  // server racks (knockable) with blinking LEDs
  const ledTex = textTexture(64, 128, (c) => {
    c.fillStyle = "#1c2028";
    c.fillRect(0, 0, 64, 128);
    for (let i = 0; i < 10; i++) {
      c.fillStyle = "#2a303b";
      c.fillRect(6, 6 + i * 12, 52, 9);
      c.fillStyle = i % 3 === 0 ? "#ff5a5a" : "#5dffa8";
      c.fillRect(46, 8 + i * 12, 6, 4);
      c.fillStyle = "#7fd6ff";
      c.fillRect(38, 8 + i * 12, 4, 4);
    }
  });
  const side = new THREE.MeshLambertMaterial({ color: "#2b303a" });
  const front = new THREE.MeshLambertMaterial({ map: ledTex, emissive: "#ffffff", emissiveMap: ledTex, emissiveIntensity: 0.6 });
  const rackMats = [side, side, side, side, front, front];
  const racks = [0, 1, 2, 3, 4].map((i) => ({ x: P.x - 14 + i * 1.3, y: base + 1.1, z: P.z - 4, ry: 0 }));
  propSet(ctx, "rack", new THREE.BoxGeometry(1, 2.2, 1.1), rackMats, racks, cuboid(0.5, 1.1, 0.55, 0.5));
  ctx.updaters.push((f) => (front.emissiveIntensity = 0.5 + (Math.sin(f.t * 9) > 0.3 ? 0.5 : 0) + f.night * 0.6));

  // ship's wheel on a little helm stand
  const helm = new THREE.Group();
  helm.position.set(P.mx - 2.6, base, P.mz - 1);
  const stand = mesh(box, mat(COL.woodDark));
  stand.scale.set(0.8, 1.4, 0.8);
  stand.position.y = 0.7;
  const wheel = new THREE.Group();
  wheel.position.set(0, 2.1, 0.45);
  const rim = mesh(new THREE.TorusGeometry(0.85, 0.08, 6, 20), mat(COL.wood));
  wheel.add(rim);
  for (let i = 0; i < 8; i++) {
    const sp = mesh(box, mat(COL.wood));
    sp.scale.set(0.08, 2.3, 0.08);
    sp.rotation.z = (i / 8) * Math.PI;
    if (i % 2 === 0) wheel.add(sp);
    const handle = mesh(cyl, mat(COL.woodDark));
    handle.scale.set(0.07, 0.35, 0.07);
    const a = (i / 8) * Math.PI * 2;
    handle.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0);
    handle.rotation.z = a - Math.PI / 2;
    wheel.add(handle);
  }
  helm.add(stand, wheel);
  helm.rotation.y = -0.6;
  ctx.scene.add(helm);
  ctx.circle(helm.position.x, helm.position.z, 0.6);
  let spin = 0;
  ctx.updaters.push((f) => {
    const near = Math.hypot(f.px - helm.position.x, f.pz - helm.position.z) < 7;
    spin += ((near ? 3 : 0.3) - spin) * Math.min(1, f.dt * 2);
    wheel.rotation.z += spin * f.dt;
  });
  const termTex = signTexture(
    [
      { t: "$ helm upgrade --install", s: 34, c: "#5dffa8", w: 600 },
      { t: "career ./p1-technologies", s: 34, c: "#5dffa8", w: 600 },
      { t: "release deployed · 4 yrs uptime", s: 26, c: "#9aa4b8", w: 500 },
    ],
    "#141821",
    "#5dffa8",
    640,
    256,
  );
  const term = board(termTex, 4.4, 1.76, 0.8);
  term.group.position.set(P.mx + 1.6, base + 2.2, P.mz - 2.6);
  term.group.rotation.y = -0.3;
  for (const sx of [-2, 2]) {
    const post = mesh(box, mat("#2b2f3a"));
    post.scale.set(0.16, 2.2, 0.16);
    post.position.set(sx, -1.1, 0);
    term.group.add(post);
  }
  ctx.scene.add(term.group);
  ctx.box(P.mx + 1.6, P.mz - 2.6, 2.2, 0.3, -0.3);

  // cargo ship offshore
  const ship = new THREE.Group();
  ship.position.set(92, 0, 72);
  ship.rotation.y = -0.65;
  const hull = mesh(new THREE.BoxGeometry(8, 3.4, 34), mat("#2a3550"));
  hull.position.y = 0.6;
  const hullTop = mesh(new THREE.BoxGeometry(8.1, 0.5, 34.1), mat("#b23a3a"));
  hullTop.position.y = -0.9;
  const bow = mesh(new THREE.CylinderGeometry(4, 4, 3.4, 3, 1), mat("#2a3550"));
  bow.position.set(0, 0.6, 17);
  bow.scale.set(1, 1, 0.9);
  bow.rotation.y = Math.PI / 6 + Math.PI;
  const bridge = mesh(new THREE.BoxGeometry(7, 5, 4), mat("#f6f1e7"));
  bridge.position.set(0, 4.8, -13.5);
  const funnel = mesh(new THREE.BoxGeometry(2, 3, 2), mat(COL.cobalt));
  funnel.position.set(0, 8.5, -14);
  ship.add(hull, hullTop, bow, bridge, funnel);
  // ship containers ride along as children (the ship bobs)
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++)
      for (let s = 0; s < 1 + ((r + c) % 2); s++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 5.6), new THREE.MeshLambertMaterial({ map: corr, color: colors[(r * 3 + c + s) % colors.length] }));
        m.position.set(-2.6 + c * 2.6, 3.5 + s * 2.4, -7 + r * 6.2);
        m.castShadow = true;
        ship.add(m);
      }
  ctx.scene.add(ship);
  ctx.updaters.push((f) => {
    ship.position.y = Math.sin(f.t * 0.5) * 0.25 - 0.3;
    ship.rotation.z = Math.sin(f.t * 0.4) * 0.015;
  });

  // signage
  const yard = signTexture([{ t: "P1 HARBOR", s: 84, w: 800 }, { t: "containers, clusters & cranes", s: 30, c: "#cfd6e6", w: 500 }], COL.cobalt, "#ffffff", 640, 220);
  const yb = board(yard, 6, 2.06);
  yb.group.position.set(P.x - 10, base + 3.6, P.z + 12.5);
  yb.group.rotation.y = Math.PI;
  for (const sx of [-2.8, 2.8]) {
    const post = mesh(box, mat("#2b2f3a"));
    post.scale.set(0.2, 3.6, 0.2);
    post.position.set(sx, -1.8, 0);
    yb.group.add(post);
  }
  ctx.scene.add(yb.group);
  ctx.box(P.x - 10, P.z + 12.5, 3, 0.3);
  return { containers: containers as PropSet };
}
