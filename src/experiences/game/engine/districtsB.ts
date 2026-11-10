import * as THREE from "three";
import { COL, Batch, mat, mesh, signTexture, textTexture, labelSprite, FONT } from "./kit";
import { PLACE, PLACES, SECRET_CAT, type Place } from "./places";
import { height, DECKS } from "./terrain";
import { propSet, ball, cylinder } from "./props";
import { addBox, board } from "./districtsA";
import { roadPts } from "./village";
import type { WorldCtx } from "./ctx";
import type { PropSet } from "./physics";

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 12);

export function buildAgora(ctx: WorldCtx) {
  const P = PLACE.athens;
  const base = height(P.x, P.z);
  const cx = P.x;
  const cz = P.z - 6;
  const marble = COL.marble;
  for (let s = 0; s < 3; s++) addBox(ctx, cx, base + 0.2 + s * 0.4, cz, 17 - s * 1.2, 0.4, 10 - s * 1.2, s % 2 ? "#e6dcc6" : marble);
  ctx.solid(cx, base + 0.6, cz, 8.5, 0.6, 5);
  const top = base + 1.2;
  const colB = ctx.batch("column", () => new Batch(new THREE.CylinderGeometry(0.42, 0.5, 1, 10), mat(marble)));
  const capB = ctx.batch("capital", () => new Batch(box, mat("#e6dcc6")));
  const heights = [5, 5, 5, 3.2, 5, 1.6, 5, 5, 2.4, 5, 5, 5];
  let i = 0;
  for (const sz of [-3.4, 3.4])
    for (let k = 0; k < 6; k++) {
      const x = cx - 6.5 + k * 2.6;
      const h = heights[i++];
      colB.add(x, top + h / 2, cz + sz, 1, h, 1);
      if (h >= 5) capB.add(x, top + h + 0.15, cz + sz, 1.2, 0.3, 1.2);
    }
  // architrave + pediment over the east end
  addBox(ctx, cx + 4.6, top + 5.55, cz, 6.8, 0.8, 7.8, "#e6dcc6");
  const ped = new THREE.Shape();
  ped.moveTo(-3.9, 0);
  ped.lineTo(3.9, 0);
  ped.lineTo(0, 1.8);
  ped.lineTo(-3.9, 0);
  const pm = mesh(new THREE.ExtrudeGeometry(ped, { depth: 6.6, bevelEnabled: false }).translate(0, 0, -3.3), mat(marble));
  pm.rotation.y = Math.PI / 2;
  pm.position.set(cx + 4.6, top + 5.95, cz);
  ctx.scene.add(pm);
  // fallen drums to knock around
  const drums = [
    { x: cx - 3, z: cz + 7.5, rz: Math.PI / 2, ry: 0.4 },
    { x: cx - 1.5, z: cz + 8.6, rz: Math.PI / 2, ry: 1.2 },
    { x: cx + 6, z: cz + 7.8, rz: 0, ry: 0 },
    { x: cx - 9, z: cz + 4, rz: Math.PI / 2, ry: 2 },
  ].map((d) => ({ x: d.x, y: base + 0.6, z: d.z, rz: d.rz, ry: d.ry }));
  propSet(ctx, "drum", new THREE.CylinderGeometry(0.48, 0.48, 1.1, 10), mat(marble), drums, cylinder(0.55, 0.48, 1.2));

  // two stelae: one per early job (from data)
  const early = ctx.data.experience.slice(2);
  early.forEach((job, j) => {
    const tex = signTexture(
      [
        { t: job.company.toUpperCase(), s: 56, w: 800 },
        { t: job.role, s: 30, c: "#6b5a3a", w: 600 },
        { t: job.period, s: 26, c: "#8a7a5a", w: 500 },
      ],
      "#efe6d2",
      "#3b3326",
      512,
      256,
    );
    const st = new THREE.Group();
    const slab = mesh(box, mat("#e3d8c0"));
    slab.scale.set(2.6, 1.5, 0.35);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshLambertMaterial({ map: tex }));
    face.position.z = 0.18;
    st.add(slab, face);
    const sx = P.mx + (j === 0 ? -5 : 5);
    const sz = P.mz + 1.5;
    st.position.set(sx, height(sx, sz) + 1.1, sz);
    st.rotation.y = j === 0 ? 0.35 : -0.35;
    const ped2 = mesh(box, mat("#d2c3a3"));
    ped2.scale.set(2.8, 0.4, 0.6);
    ped2.position.y = -0.9;
    st.add(ped2);
    ctx.scene.add(st);
    ctx.box(sx, sz, 1.4, 0.35, st.rotation.y);
  });
}

const GIZMOS = [
  new THREE.TorusKnotGeometry(0.42, 0.14, 48, 8),
  new THREE.IcosahedronGeometry(0.6, 0),
  new THREE.OctahedronGeometry(0.62, 0),
  new THREE.TorusGeometry(0.5, 0.16, 8, 20),
  new THREE.DodecahedronGeometry(0.58, 0),
  new THREE.BoxGeometry(0.75, 0.75, 0.75),
  new THREE.ConeGeometry(0.55, 0.95, 6),
];

export function buildWorkshop(ctx: WorldCtx) {
  const P = PLACE.workshop;
  const base = height(P.x, P.z);
  // pergola
  const deck = mesh(box, mat(COL.wood), false);
  deck.scale.set(10, 0.3, 7);
  deck.position.set(P.x, base + 0.15, P.z - 1);
  ctx.scene.add(deck);
  const slats = ctx.batch("slat", () => new Batch(box, mat(COL.woodDark)));
  for (const sx of [-4.6, 4.6])
    for (const sz of [-4, 2]) {
      slats.add(P.x + sx, base + 1.7, P.z + sz, 0.25, 3.4, 0.25);
      ctx.circle(P.x + sx, P.z + sz, 0.3);
    }
  for (let k = 0; k < 11; k++) slats.add(P.x - 5 + k, base + 3.5, P.z - 1, 0.18, 0.18, 7.4);
  for (const sz of [-4, 2]) slats.add(P.x, base + 3.35, P.z + sz, 10, 0.25, 0.25);
  // workbench + tools
  addBox(ctx, P.x, base + 1.1, P.z - 2.4, 5, 0.2, 1.4, COL.wood);
  for (const sx of [-2.3, 2.3]) addBox(ctx, P.x + sx, base + 0.6, P.z - 2.4, 0.2, 0.9, 1.2, COL.woodDark);
  ctx.box(P.x, P.z - 2.4, 2.5, 0.7);
  addBox(ctx, P.x - 1.2, base + 1.35, P.z - 2.5, 0.9, 0.3, 0.6, "#c8643c");
  addBox(ctx, P.x + 0.6, base + 1.45, P.z - 2.3, 0.5, 0.5, 0.5, "#2b2f3a");
  const lap = mesh(box, mat("#d8dce4"));
  lap.scale.set(1.0, 0.05, 0.7);
  lap.position.set(P.x + 1.6, base + 1.24, P.z - 2.4);
  const screen = mesh(box, ctx.glow("#7fd6ff", 0.6, 1.4));
  screen.scale.set(1.0, 0.65, 0.04);
  screen.position.set(P.x + 1.6, base + 1.55, P.z - 2.72);
  screen.rotation.x = -0.2;
  ctx.scene.add(lap, screen);

  // a stand per project (work + personal; life lives on the beach)
  const cats = ctx.data.projects.categories.filter((c) => c.name.toLowerCase() !== "life");
  const projects = cats.flatMap((c, ci) => c.projects.map((p) => ({ p, ci })));
  const n = projects.length;
  const gizmos: THREE.Mesh[] = [];
  const labels: THREE.Sprite[] = [];
  const catColors = ["#4f8cff", "#ff8a3d", "#2ec4b6"];
  projects.forEach(({ p, ci }, i) => {
    const a = Math.PI * 0.08 + (i / Math.max(1, n - 1)) * Math.PI * 1.1;
    const r = 11;
    const x = P.x + Math.cos(a + Math.PI) * r;
    const z = P.z - 3 - Math.sin(a) * r * 0.75;
    const y = height(x, z);
    const ped = mesh(new THREE.CylinderGeometry(0.6, 0.75, 1.2, 8), mat("#f6f1e7"));
    ped.position.set(x, y + 0.6, z);
    const cap = mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.12, 8), mat(catColors[ci % 3]));
    cap.position.set(x, y + 1.24, z);
    const gz = mesh(GIZMOS[i % GIZMOS.length], ctx.glow(catColors[ci % 3], 0.25, 1.1));
    gz.position.set(x, y + 2.2, z);
    const label = labelSprite(p.title, catColors[ci % 3], 0.42);
    label.position.set(x, y + 3.1 + (i % 2) * 0.55, z);
    labels.push(label);
    ctx.scene.add(ped, cap, gz, label);
    ctx.circle(x, z, 0.75);
    gizmos.push(gz);
  });
  ctx.updaters.push((f) => {
    gizmos.forEach((g, i) => {
      const d = Math.hypot(f.px - g.position.x, f.pz - g.position.z);
      const k = d < 5 ? 4 : 0.6;
      g.rotation.y += f.dt * k;
      g.rotation.x += f.dt * k * 0.4;
      g.position.y += (Math.sin(f.t * 2 + i) * 0.003);
      labels[i].visible = d < 11;
      const s = d < 5 ? 1.3 : 1;
      g.scale.setScalar(g.scale.x + (s - g.scale.x) * Math.min(1, f.dt * 6));
    });
  });
  const sign = signTexture([{ t: "THE WORKSHOP", s: 72, w: 800 }, { t: "things Alex built", s: 30, c: "#6b5a3a", w: 500 }], "#fbf5e8", COL.ink, 640, 200);
  const sb = board(sign, 5, 1.56);
  sb.group.position.set(P.x, base + 4.4, P.z + 2.1);
  ctx.scene.add(sb.group);

  // ramp near the workshop
  buildRamp(ctx, DECKS[2]);
}

export function buildRamp(ctx: WorldCtx, d: (typeof DECKS)[number]) {
  const len = (d.axis === "x" ? d.hw : d.hd) * 2;
  const rise = d.y1 - d.y0;
  const ang = Math.atan2(rise, len);
  const g = new THREE.Group();
  const top = mesh(box, mat(COL.yellow));
  top.scale.set(d.axis === "x" ? Math.hypot(len, rise) : d.hw * 2, 0.2, d.axis === "x" ? d.hd * 2 : Math.hypot(len, rise));
  if (d.axis === "x") top.rotation.z = -ang;
  else top.rotation.x = ang;
  top.position.y = (d.y0 + d.y1) / 2 - 0.1;
  g.add(top);
  // stripes
  for (let k = -1; k <= 1; k += 2) {
    const s = mesh(box, mat(COL.ink));
    s.scale.copy(top.scale).multiply(new THREE.Vector3(d.axis === "x" ? 1 : 0.12, 1.05, d.axis === "x" ? 0.12 : 1));
    s.rotation.copy(top.rotation);
    s.position.set(d.axis === "z" ? k * d.hw * 0.5 : 0, top.position.y + 0.01, d.axis === "x" ? k * d.hd * 0.5 : 0);
    g.add(s);
  }
  const support = mesh(box, mat(COL.woodDark));
  support.scale.set(d.axis === "x" ? 0.3 : d.hw * 2, rise, d.axis === "x" ? d.hd * 2 : 0.3);
  support.position.set(d.axis === "x" ? -d.hw + 0.15 : 0, d.y0 + rise / 2, d.axis === "z" ? -d.hd + 0.15 : 0);
  g.add(support);
  g.position.set(d.x, 0, d.z);
  ctx.scene.add(g);
}

export function buildBeach(ctx: WorldCtx) {
  const P = PLACE.beach;
  const base = height(P.x, P.z);
  const bx = P.x - 5;
  const bz = P.z - 6;
  const booth = new THREE.Group();
  booth.position.set(bx, base, bz);
  booth.rotation.y = Math.atan2(P.mx - bx, P.mz - bz);
  ctx.scene.add(booth);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const o = mesh(geo, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    booth.add(o);
    return o;
  };
  add(box, mat(COL.wood), 0, 0.3, 0, 9, 0.6, 5.5);
  add(box, mat("#15161a"), 0, 3, -2.6, 9, 5, 0.3);
  // banner on the back wall
  const banner = textTexture(1024, 400, (c) => {
    c.fillStyle = "#15161a";
    c.fillRect(0, 0, 1024, 400);
    const g = c.createLinearGradient(0, 0, 1024, 0);
    g.addColorStop(0, "#ff5a8a");
    g.addColorStop(0.5, "#ffb02e");
    g.addColorStop(1, "#c86bff");
    c.fillStyle = g;
    c.font = `800 210px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("HATZO", 512, 180);
    c.font = `600 54px ${FONT}`;
    c.fillStyle = "#f6f1e7";
    c.fillText("live on the beach · 128 bpm", 512, 330);
  });
  const bannerMat = new THREE.MeshLambertMaterial({ map: banner, emissive: "#ffffff", emissiveMap: banner, emissiveIntensity: 0.5 });
  const bn = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 3.3), bannerMat);
  bn.position.set(0, 3.4, -2.43);
  booth.add(bn);
  // decks table
  add(box, mat("#2b2f3a"), 0, 1.1, -0.6, 4.6, 1.0, 1.4);
  const platters: THREE.Mesh[] = [];
  for (const sx of [-1.4, 1.4]) {
    add(box, mat("#3a3f4a"), sx, 1.66, -0.6, 1.3, 0.12, 1.1);
    const pl = add(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 20), mat("#111111"), sx, 1.76, -0.6);
    const lab = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 12), mat(sx < 0 ? "#ff5a8a" : "#ffb02e"));
    lab.position.y = 0.01;
    pl.add(lab);
    const notch = mesh(box, mat("#f6f1e7"));
    notch.scale.set(0.3, 0.07, 0.05);
    notch.position.set(0.25, 0.01, 0);
    pl.add(notch);
    platters.push(pl);
  }
  add(box, ctx.glow("#7fd6ff", 0.4, 1.5), 0, 1.68, -0.6, 0.8, 0.12, 0.9);
  // speakers
  const speakers: THREE.Group[] = [];
  for (const sx of [-3.6, 3.6]) {
    const sp = new THREE.Group();
    sp.position.set(sx, 0.6, -0.2);
    const cab = mesh(box, mat("#1c1e24"));
    cab.scale.set(1.4, 3.2, 1.2);
    cab.position.y = 1.6;
    sp.add(cab);
    for (const [y, r] of [[2.5, 0.42], [1.0, 0.55]] as [number, number][]) {
      const cone = mesh(new THREE.CylinderGeometry(r, r * 0.6, 0.2, 16), mat("#3a3f4a"));
      cone.rotation.x = Math.PI / 2;
      cone.position.set(0, y, 0.62);
      sp.add(cone);
    }
    booth.add(sp);
    speakers.push(sp);
  }
  // light bars
  const barMats: THREE.MeshBasicMaterial[] = [];
  for (let k = 0; k < 7; k++) {
    const m = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    barMats.push(m);
    const b = new THREE.Mesh(box, m);
    b.scale.set(0.22, 1.1, 0.22);
    b.position.set(-3.6 + k * 1.2, 6.1, -2.6);
    booth.add(b);
  }
  booth.updateMatrixWorld();
  ctx.box(bx, bz, 4.6, 2.9, booth.rotation.y);
  ctx.phys.addStaticBox(bx, base + 1, bz, 4.6, 1, 2.9, booth.rotation.y);
  const hue = new THREE.Color();
  ctx.updaters.push((f) => {
    const b = f.playing ? f.bass : 0;
    speakers.forEach((s) => s.scale.setScalar(1 + b * 0.12));
    platters.forEach((p, i) => (p.rotation.y -= f.dt * (f.playing ? 3.5 : 0) * (i ? 1 : 1.02)));
    barMats.forEach((m, i) => {
      const lvl = f.playing ? 0.25 + b * (0.75 + Math.sin(f.t * 8 + i) * 0.25) : 0.15 + f.night * 0.2;
      hue.setHSL((f.t * 0.08 + i * 0.09) % 1, 0.85, 0.55);
      m.color.copy(hue).multiplyScalar(lvl * 1.6);
    });
    bannerMat.emissiveIntensity = 0.45 + f.night * 0.6 + (f.playing ? b * 0.8 : 0);
  });

  // bunting for the events crowd
  const flagB = ctx.batch("flag", () => new Batch(new THREE.ConeGeometry(0.28, 0.6, 3), mat("#ffffff"), false));
  const fc = [COL.cobalt, COL.terracotta, COL.yellow, "#2ec4b6", "#ff5a8a"];
  const p0 = new THREE.Vector3(-4.4, 5.6, -2.5).applyMatrix4(booth.matrixWorld);
  const p1 = new THREE.Vector3(4.4, 5.6, -2.5).applyMatrix4(booth.matrixWorld);
  for (let k = 0; k <= 14; k++) {
    const t = k / 14;
    const v = p0.clone().lerp(p1, t);
    v.y -= Math.sin(t * Math.PI) * 0.6 - 0.2;
    v.add(new THREE.Vector3(0, 0, 2.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), booth.rotation.y));
    flagB.add(v.x, v.y, v.z, 1, 1, 1, booth.rotation.y, fc[k % fc.length], Math.PI, 0);
  }

  // Lino clothesline
  const lx = P.x + 8;
  const lz = P.z + 8;
  const ly = height(lx, lz);
  for (const s of [-4, 4]) {
    const post = mesh(box, mat(COL.woodDark));
    post.scale.set(0.16, 2.8, 0.16);
    post.position.set(lx + s, ly + 1.4, lz);
    ctx.scene.add(post);
    ctx.circle(lx + s, lz, 0.25);
  }
  const rope = mesh(box, mat("#e8dcc0"), false);
  rope.scale.set(8, 0.03, 0.03);
  rope.position.set(lx, ly + 2.6, lz);
  ctx.scene.add(rope);
  const linenTex = textTexture(64, 64, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 64, 64);
    c.globalAlpha = 0.08;
    for (let i = 0; i < 64; i += 2) {
      c.fillStyle = "#000";
      c.fillRect(i, 0, 1, 64);
      c.fillRect(0, i, 64, 1);
    }
  });
  const linenCols = ["#efe4cf", "#d8c8a8", "#f6f1e7", "#c7b593", "#e6d7bb", "#b9c4c9"];
  const clothes: THREE.Mesh[] = [];
  linenCols.forEach((c, i) => {
    const shirt = i % 2 === 0;
    const geo = shirt ? new THREE.PlaneGeometry(1.0, 1.0, 1, 4).translate(0, -0.5, 0) : new THREE.PlaneGeometry(0.7, 1.3, 1, 4).translate(0, -0.65, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: c, map: linenTex, side: THREE.DoubleSide }));
    m.castShadow = true;
    m.position.set(lx - 3.2 + i * 1.3, ly + 2.6, lz);
    ctx.scene.add(m);
    clothes.push(m);
  });
  const linoTex = signTexture([{ t: "LINO", s: 80, w: 800 }, { t: "linen, Greece ↔ LA", s: 26, c: "#7a6a4a", w: 500 }], "#efe4cf", "#3b3326", 384, 200);
  const lb = board(linoTex, 1.9, 1);
  lb.group.position.set(lx - 4.9, ly + 1.4, lz + 0.2);
  lb.group.rotation.y = 0.3;
  ctx.scene.add(lb.group);
  ctx.updaters.push((f) => clothes.forEach((c, i) => (c.rotation.x = Math.sin(f.t * 1.6 + i * 0.7) * 0.25 + 0.1)));

  // umbrellas + loungers
  const umb: [number, number, string][] = [
    [P.x - 10, P.z + 10, COL.cobalt],
    [P.x - 4, P.z + 14, COL.terracotta],
    [P.x + 1, P.z + 18, "#2ec4b6"],
  ];
  for (const [x, z, c] of umb) {
    const y = height(x, z);
    const pole = mesh(cyl, mat("#f6f1e7"));
    pole.scale.set(0.06, 2.6, 0.06);
    pole.position.set(x, y + 1.3, z);
    const top = mesh(new THREE.ConeGeometry(1.8, 0.7, 8), mat(c));
    top.position.set(x, y + 2.7, z);
    const lounger = mesh(box, mat("#f6f1e7"));
    lounger.scale.set(0.8, 0.25, 2);
    lounger.position.set(x + 1.2, y + 0.3, z + 0.4);
    lounger.rotation.y = 0.3;
    ctx.scene.add(pole, top, lounger);
    ctx.circle(x, z, 0.2);
  }
  const balls = [
    { x: P.x + 4, z: P.z + 6, color: "#ff5a8a" },
    { x: P.x - 2, z: P.z + 9, color: COL.yellow },
    { x: P.x + 8, z: P.z - 2, color: "#2ec4b6" },
  ].map((b) => ({ ...b, y: height(b.x, b.z) + 0.8 }));
  propSet(ctx, "beachball", new THREE.IcosahedronGeometry(0.7, 1), new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }), balls, ball(0.7, 0.08, 0.7), { ccd: true });
  buildRamp(ctx, DECKS[1]);
}

export function buildTennis(ctx: WorldCtx) {
  const P = PLACE.tennis;
  const base = height(P.x, P.z);
  const cx = P.x + 2;
  const cz = P.z;
  const apron = mesh(box, mat("#3f7f4a"), false);
  apron.scale.set(17, 0.2, 32);
  apron.position.set(cx, base + 0.02, cz);
  ctx.scene.add(apron);
  const courtTex = textTexture(256, 512, (c) => {
    c.fillStyle = "#c8643c";
    c.fillRect(0, 0, 256, 512);
    c.strokeStyle = "#fbf5e8";
    c.lineWidth = 4;
    const sx = 256 / 11;
    const sz = 512 / 24;
    c.strokeRect(2, 2, 252, 508);
    c.strokeRect(1.37 * sx, 2, 256 - 2.74 * sx, 508);
    c.beginPath();
    c.moveTo(1.37 * sx, 6.4 * sz);
    c.lineTo(256 - 1.37 * sx, 6.4 * sz);
    c.moveTo(1.37 * sx, 512 - 6.4 * sz);
    c.lineTo(256 - 1.37 * sx, 512 - 6.4 * sz);
    c.moveTo(128, 6.4 * sz);
    c.lineTo(128, 512 - 6.4 * sz);
    c.stroke();
  });
  const court = new THREE.Mesh(new THREE.PlaneGeometry(11, 24), new THREE.MeshLambertMaterial({ map: courtTex }));
  court.rotation.x = -Math.PI / 2;
  court.position.set(cx, base + 0.13, cz);
  court.receiveShadow = true;
  ctx.scene.add(court);
  // net
  const netTex = textTexture(64, 16, (c) => {
    c.clearRect(0, 0, 64, 16);
    c.strokeStyle = "rgba(20,22,26,0.9)";
    c.lineWidth = 1;
    for (let i = 0; i < 64; i += 4) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, 16);
      c.stroke();
    }
    for (let j = 0; j < 16; j += 4) {
      c.beginPath();
      c.moveTo(0, j);
      c.lineTo(64, j);
      c.stroke();
    }
    c.fillStyle = "#fbf5e8";
    c.fillRect(0, 0, 64, 3);
  });
  netTex.wrapS = THREE.RepeatWrapping;
  netTex.repeat.set(6, 1);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 1.0), new THREE.MeshBasicMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide }));
  net.position.set(cx, base + 0.6, cz);
  ctx.scene.add(net);
  for (const s of [-6.3, 6.3]) addBox(ctx, cx + s, base + 0.6, cz, 0.15, 1.1, 0.15, "#2b2f3a");
  ctx.solid(cx, base + 0.55, cz, 6.3, 0.5, 0.06);
  // umpire chair (marker sits by it)
  addBox(ctx, cx - 7.6, base + 1.4, cz, 0.9, 0.12, 0.9, "#2b4f8a");
  for (const [a, b] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) addBox(ctx, cx - 7.6 + a, base + 0.7, cz + b, 0.08, 1.4, 0.08, "#f6f1e7");
  ctx.box(cx - 7.6, cz, 0.5, 0.5);
  // low fences at the ends
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(17, 1.6), new THREE.MeshLambertMaterial({ color: "#2b4f3a", transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    f.position.set(cx, base + 0.8, cz + s * 16);
    ctx.scene.add(f);
    ctx.solid(cx, base + 0.8, cz + s * 16, 8.5, 0.8, 0.08);
  }
  // ball machine on the south baseline
  const mx = cx;
  const mz = cz + 11.5;
  const machine = new THREE.Group();
  machine.position.set(mx, base, mz);
  const body = mesh(box, mat("#2b2f3a"));
  body.scale.set(1.0, 0.8, 1.0);
  body.position.y = 0.5;
  const hopper = mesh(new THREE.CylinderGeometry(0.55, 0.35, 0.6, 8), mat("#b6e05a"));
  hopper.position.y = 1.2;
  const tube = mesh(cyl, mat("#15161a"));
  tube.scale.set(0.14, 0.7, 0.14);
  tube.rotation.x = -1.1;
  tube.position.set(0, 0.8, -0.5);
  machine.add(body, hopper, tube);
  ctx.scene.add(machine);
  ctx.solid(mx, base + 0.5, mz, 0.5, 0.5, 0.5);
  const balls = Array.from({ length: 14 }, (_, i) => ({ x: cx - 4 + (i % 7) * 1.2, y: base + 0.5, z: cz + 3 + Math.floor(i / 7) * 2 }));
  const ballSet = propSet(ctx, "tennisball", new THREE.IcosahedronGeometry(0.22, 1), mat("#d8ff4a"), balls, ball(0.22, 0.4, 0.78), { ccd: true, damping: 0.05 });
  let timer = 0;
  let next = 0;
  ctx.updaters.push((f) => {
    const near = Math.hypot(f.px - mx, f.pz - mz) < 34;
    timer += f.dt;
    hopper.rotation.y += f.dt * (near ? 2 : 0);
    if (!near || timer < 1.6) return;
    timer = 0;
    const b = ballSet.bodies[next];
    next = (next + 1) % ballSet.bodies.length;
    b.setTranslation({ x: mx, y: base + 1.2, z: mz - 0.7 }, true);
    const tx = cx + (Math.random() - 0.5) * 8;
    const tz = cz - 4 - Math.random() * 7;
    const dx = tx - mx;
    const dz = tz - mz;
    const T = 1.1;
    b.setLinvel({ x: dx / T, y: 7.5, z: dz / T }, true);
    b.setAngvel({ x: -8, y: 0, z: 0 }, true);
  });
  const clubTex = signTexture([{ t: "TENNIS CLUB", s: 64, w: 800 }, { t: "members: anyone on a scooter", s: 26, c: "#cfe6c8", w: 500 }], "#2b4f3a", "#fbf5e8", 640, 200);
  const cb = board(clubTex, 4.4, 1.37);
  cb.group.position.set(cx + 9, base + 2.6, cz - 6);
  cb.group.rotation.y = -Math.PI / 2;
  for (const sx of [-2, 2]) {
    const post = mesh(box, mat("#2b2f3a"));
    post.scale.set(0.15, 2.6, 0.15);
    post.position.set(sx, -1.3, 0);
    cb.group.add(post);
  }
  ctx.scene.add(cb.group);
  ctx.box(cx + 9, cz - 6, 0.3, 2.2);
  return { balls: ballSet as PropSet };
}

export function buildLighthouse(ctx: WorldCtx) {
  const P = PLACE.contact;
  const lx = P.x - 3;
  const lz = P.z - 4;
  const base = height(lx, lz) - 0.3;
  const g = new THREE.Group();
  g.position.set(lx, base, lz);
  const tower = mesh(new THREE.CylinderGeometry(1.5, 2.3, 12, 14), mat("#ffffff"));
  tower.position.y = 6;
  const band = mesh(new THREE.CylinderGeometry(1.75, 1.85, 1.2, 14), mat(COL.cobalt));
  band.position.y = 7.5;
  const gallery = mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.3, 16), mat("#2b2f3a"));
  gallery.position.y = 12.1;
  const lanternMat = ctx.glow("#fff1c4", 0.3, 3);
  const lantern = mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.8, 10), lanternMat);
  lantern.position.y = 13.2;
  const cap = mesh(new THREE.ConeGeometry(1.5, 1.4, 10), mat(COL.cobalt));
  cap.position.y = 14.8;
  const door = mesh(box, mat(COL.cobalt));
  door.scale.set(1.0, 2.0, 0.3);
  door.position.set(0, 1, 2.05);
  g.add(tower, band, gallery, lantern, cap, door);
  ctx.scene.add(g);
  ctx.solid(lx, base + 6, lz, 2.1, 6, 2.1);
  ctx.obstacles.pop();
  ctx.circle(lx, lz, 2.3);
  addBox(ctx, lx + 4.2, base + 1.5, lz - 1, 4, 3, 3.6, "#ffffff", 0.2, true);
  // rotating beam (night)
  const beamTex = textTexture(256, 32, (c) => {
    const gr = c.createLinearGradient(0, 0, 256, 0);
    gr.addColorStop(0, "rgba(255,240,190,0.9)");
    gr.addColorStop(1, "rgba(255,240,190,0)");
    c.fillStyle = gr;
    c.fillRect(0, 0, 256, 32);
  });
  const beamMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0, fog: false });
  const pivot = new THREE.Group();
  pivot.position.set(lx, base + 13.2, lz);
  for (const s of [0, Math.PI]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(6, 70, 16, 1, true).rotateZ(Math.PI / 2).translate(35, 0, 0), beamMat);
    cone.rotation.y = s;
    // map gradient along the cone length
    const uv = cone.geometry.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, 1 - uv.getY(i), 0.5);
    pivot.add(cone);
  }
  ctx.scene.add(pivot);
  ctx.updaters.push((f) => {
    pivot.rotation.y += f.dt * 0.6;
    beamMat.opacity = f.night * 0.35;
    pivot.visible = f.night > 0.02;
  });

  // post box (the marker) + bench
  const pb = new THREE.Group();
  pb.position.set(P.mx + 1.6, height(P.mx + 1.6, P.mz - 1.6), P.mz - 1.6);
  pb.rotation.y = 0.6;
  const pbody = mesh(box, mat(COL.yellow));
  pbody.scale.set(0.8, 1.1, 0.6);
  pbody.position.y = 1.15;
  const ptop = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12, 1, false, 0, Math.PI), mat(COL.yellow));
  ptop.rotation.z = Math.PI / 2;
  ptop.rotation.y = Math.PI / 2;
  ptop.position.y = 1.7;
  const slot = mesh(box, mat("#15161a"));
  slot.scale.set(0.5, 0.06, 0.05);
  slot.position.set(0, 1.4, 0.31);
  const leg = mesh(box, mat("#2b2f3a"));
  leg.scale.set(0.15, 0.6, 0.15);
  leg.position.y = 0.3;
  const horn = mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12), mat(COL.ink));
  horn.position.set(0, 1.05, 0.31);
  pb.add(pbody, ptop, slot, leg, horn);
  ctx.scene.add(pb);
  ctx.circle(pb.position.x, pb.position.z, 0.6);
  return { lanternMat };
}

export function buildCat(ctx: WorldCtx) {
  const { x, z } = SECRET_CAT;
  const y = height(x, z);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.PI + 0.5;
  const fur = mat("#e08a3c");
  const body = mesh(new THREE.SphereGeometry(0.32, 8, 6), fur);
  body.scale.set(1, 1.15, 1.4);
  body.position.y = 0.36;
  const head = mesh(new THREE.SphereGeometry(0.22, 8, 6), fur);
  head.position.set(0, 0.78, 0.18);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.08, 0.16, 4), fur);
    ear.position.set(s * 0.11, 0.98, 0.18);
    g.add(ear);
    const eye = mesh(new THREE.SphereGeometry(0.035, 6, 4), mat("#2b4f3a"));
    eye.position.set(s * 0.08, 0.8, 0.38);
    g.add(eye);
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.25, -0.38);
  const tseg = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 5).translate(0, 0.3, 0), fur);
  tseg.rotation.x = -0.9;
  tail.add(tseg);
  g.add(body, head, tail);
  // a bench and a little bowl
  const bench = mesh(box, mat(COL.wood));
  bench.scale.set(2, 0.12, 0.6);
  bench.position.set(1.6, 0.5, 0.2);
  const bowl = mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.1, 10), mat(COL.cobalt));
  bowl.position.set(0.5, 0.05, 0.4);
  g.add(bench, bowl);
  ctx.scene.add(g);
  ctx.circle(x, z, 0.5);
  ctx.updaters.push((f) => {
    tail.rotation.z = Math.sin(f.t * 2.2) * 0.5;
    const d = Math.hypot(f.px - x, f.pz - z);
    head.rotation.y = d < 8 ? Math.sin(f.t * 1.4) * 0.4 : 0;
  });
}

export function buildSignposts(ctx: WorldCtx) {
  const posts: [number, number, Place["id"][]][] = [
    [5, 42, ["port", "skills", "p1", "beach"]],
    [-6, 8, ["oneoff", "athens", "workshop", "skills"]],
    [-15, -12, ["athens", "contact", "oneoff", "workshop"]],
    [38, -6, ["tennis", "p1", "workshop", "skills"]],
    [-46, 24, ["beach", "oneoff", "port"]],
    [-3, -36, ["tennis", "contact", "athens"]],
  ];
  for (const [x0, z0, targets] of posts) {
    let x = x0;
    let z = z0;
    let near = roadPts[0];
    let nd = Infinity;
    for (const p of roadPts) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < nd) {
        nd = d;
        near = p;
      }
    }
    if (nd < 4.2) {
      const ux = (x - near.x) / (nd || 1) || 1;
      const uz = (z - near.z) / (nd || 1);
      x = near.x + ux * 4.2;
      z = near.z + uz * 4.2;
    }
    const y = height(x, z);
    const pole = mesh(box, mat(COL.woodDark));
    pole.scale.set(0.18, 4.2, 0.18);
    pole.position.set(x, y + 2.1, z);
    ctx.scene.add(pole);
    ctx.circle(x, z, 0.3);
    targets.forEach((id, i) => {
      const t = PLACES.find((p) => p.id === id)!;
      const dist = Math.round(Math.hypot(t.x - x, t.z - z));
      const tex = textTexture(512, 96, (c) => {
        c.fillStyle = "#fbf5e8";
        c.fillRect(0, 0, 512, 96);
        c.fillStyle = t.color;
        c.fillRect(0, 0, 18, 96);
        c.fillStyle = COL.ink;
        c.font = `800 46px ${FONT}`;
        c.textBaseline = "middle";
        c.fillText(t.name, 36, 50);
        c.font = `600 30px ${FONT}`;
        c.textAlign = "right";
        c.fillStyle = "#7a8296";
        c.fillText(`${dist}m`, 490, 52);
      });
      const arm = new THREE.Group();
      arm.position.set(x, y + 3.7 - i * 0.62, z);
      arm.rotation.y = Math.atan2(t.x - x, t.z - z) - Math.PI / 2;
      const shape = new THREE.Shape();
      shape.moveTo(0, -0.26);
      shape.lineTo(2.5, -0.26);
      shape.lineTo(2.85, 0);
      shape.lineTo(2.5, 0.26);
      shape.lineTo(0, 0.26);
      const plank = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false }).translate(0, 0, -0.04), mat("#fbf5e8"));
      const front = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 0.46), new THREE.MeshLambertMaterial({ map: tex }));
      front.position.set(1.25, 0, 0.045);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 0.46), new THREE.MeshLambertMaterial({ map: tex }));
      back.position.set(1.25, 0, -0.045);
      back.rotation.y = Math.PI;
      arm.add(plank, front, back);
      ctx.scene.add(arm);
    });
  }
}

export interface Marker {
  place: Place;
  group: THREE.Group;
  gem: THREE.Mesh;
  beam: THREE.Mesh;
  ring: THREE.Mesh;
  label: THREE.Sprite;
}

export function buildMarkers(ctx: WorldCtx) {
  const beamTex = textTexture(8, 128, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,1)");
    c.fillStyle = g;
    c.fillRect(0, 0, 8, 128);
  });
  return PLACES.map((place) => {
    const y = height(place.mx, place.mz);
    const group = new THREE.Group();
    group.position.set(place.mx, y, place.mz);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshLambertMaterial({ color: place.color, emissive: place.color, emissiveIntensity: 0.7, flatShading: true }));
    gem.position.y = 2.6;
    gem.scale.set(1, 1.5, 1);
    gem.castShadow = true;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 60, 8, 1, true).translate(0, 30, 0),
      new THREE.MeshBasicMaterial({ color: place.color, alphaMap: beamTex, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    );
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.85, 32), new THREE.MeshBasicMaterial({ color: place.color, transparent: true, opacity: 0.8, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    const label = labelSprite(place.name, place.color, 0.7, place.tagline);
    label.position.y = 7.2;
    group.add(gem, beam, ring, label);
    ctx.scene.add(group);
    return { place, group, gem, beam, ring, label } as Marker;
  });
}
