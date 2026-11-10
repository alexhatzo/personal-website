import type { PortfolioData } from "../../../types/portfolio";
import { lifeCategory } from "../sections";

// Every formation is drawn with canvas 2D, then sampled pixel by pixel into particle targets.
// Channel encoding while drawing: R = spins (vinyl), G = depth (128 = 0), B = tone (0 ivory .. 255 accent).

export type Shape = {
  data: Float32Array; // count * 4, shape space (canvas height = 1 unit)
  bbox: [number, number, number, number]; // minX, minY, maxX, maxY
  area: number; // inked area, shape units²
  nodes?: [number, number, number][]; // projects: one per project row, shape space
};

export const DISPLAY_FONT = "Archivo";
const FONT = (px: number) => `900 ${px}px "${DISPLAY_FONT}", "Arial Black", Impact, sans-serif`;
const ink = (depth = 0, tone = 1, spin = false) =>
  `rgb(${spin ? 255 : 0},${Math.round(128 + Math.max(-1, Math.min(1, depth)) * 127)},${Math.round(tone * 255)})`;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  try {
    ctx.fontStretch = "expanded";
  } catch {
    /* older engines: normal width */
  }
  return ctx;
}

// Draws text so its ink box is centered on (x, y) and fits maxW x maxH.
function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, maxH: number) {
  ctx.font = FONT(200);
  const m = ctx.measureText(text);
  const h0 = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const s = Math.min(maxW / m.width, maxH / h0);
  ctx.font = FONT(200 * s);
  const m2 = ctx.measureText(text);
  ctx.fillText(text, x, y + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2);
}

function sample(ctx: CanvasRenderingContext2D, seeds: Float32Array, depthAmp = 0.16, thick = 0.03): Shape {
  const { width: W, height: H } = ctx.canvas;
  const px = ctx.getImageData(0, 0, W, H).data;
  const hits: number[] = [];
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let i = 0, p = 0; p < px.length; i++, p += 4) {
    if (px[p + 3] < 110) continue;
    hits.push(i);
    const x = i % W, y = (i / W) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const S = H;
  const count = seeds.length;
  const data = new Float32Array(count * 4);
  const bbox: Shape["bbox"] = [(minX - W / 2) / S, -(maxY - H / 2) / S, (maxX - W / 2) / S, -(minY - H / 2) / S];
  const bw = bbox[2] - bbox[0], bh = bbox[3] - bbox[1];
  const cx = (bbox[0] + bbox[2]) / 2, cy = (bbox[1] + bbox[3]) / 2;
  const rand = rng(1234);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    if (seeds[i] < 0 || hits.length === 0) {
      // Dust: a loose halo that frames every formation and gives the scene depth.
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand());
      data[o] = cx + Math.cos(a) * r * bw * 0.85;
      data[o + 1] = cy + Math.sin(a) * r * bh * 0.95;
      data[o + 2] = (rand() - 0.5) * 0.9 * Math.max(bh, 0.6);
      data[o + 3] = 0.15;
      continue;
    }
    const idx = hits[(rand() * hits.length) | 0];
    const x = idx % W, y = (idx / W) | 0, p = idx * 4;
    data[o] = (x + rand() - W / 2) / S;
    data[o + 1] = -(y + rand() - H / 2) / S;
    data[o + 2] = ((px[p + 1] - 128) / 127) * depthAmp + (rand() - 0.5) * thick;
    data[o + 3] = px[p + 2] / 255 + (px[p] > 127 ? 2 : 0);
  }
  return { data, bbox, area: hits.length / (S * S) };
}

function wordmark(seeds: Float32Array) {
  const ctx = canvas(2200, 640);
  const g = ctx.createLinearGradient(0, 0, 2200, 0);
  g.addColorStop(0, ink(0, 0.05));
  g.addColorStop(0.55, ink(0, 0.2));
  g.addColorStop(1, ink(0, 0.75));
  ctx.fillStyle = g;
  fitText(ctx, "HATZO", 1100, 320, 2120, 560);
  return sample(ctx, seeds, 0.1, 0.07);
}

// About: an olive wreath (Athens) around ATH -> LA.
function wreath(seeds: Float32Array) {
  const ctx = canvas(1024, 1024);
  const cx = 512, cy = 500, R = 350;
  for (const dir of [1, -1]) {
    const a0 = Math.PI / 2 + dir * 0.22, a1 = Math.PI / 2 + dir * 2.5;
    const steps = 80;
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps, t1 = (s + 1) / steps;
      const p0 = a0 + (a1 - a0) * t0, p1 = a0 + (a1 - a0) * t1;
      ctx.strokeStyle = ink(0, 0.35);
      ctx.lineWidth = 13 - t0 * 8;
      ctx.beginPath();
      ctx.moveTo(cx + R * Math.cos(p0), cy + R * Math.sin(p0));
      ctx.lineTo(cx + R * Math.cos(p1), cy + R * Math.sin(p1));
      ctx.stroke();
    }
    let k = 0;
    for (let t = 0.05; t <= 1.0001; t += 0.07, k++) {
      const a = a0 + (a1 - a0) * t;
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      const tx = -Math.sin(a) * dir, ty = Math.cos(a) * dir; // travel direction
      const ox = Math.cos(a), oy = Math.sin(a); // outward
      const L = 74 * (1 - t * 0.35);
      for (const side of [1, -1]) {
        const lx = tx * 0.72 + ox * 0.7 * side, ly = ty * 0.72 + oy * 0.7 * side;
        const ln = Math.hypot(lx, ly);
        const ux = lx / ln, uy = ly / ln;
        ctx.fillStyle = ink(side * 0.45, side > 0 ? 0.85 : 0.6);
        ctx.beginPath();
        ctx.ellipse(x + (ux * L) / 2, y + (uy * L) / 2, L / 2, 15 - t * 4, Math.atan2(uy, ux), 0, Math.PI * 2);
        ctx.fill();
      }
      if (k % 3 === 1) {
        ctx.fillStyle = ink(0.7, 1);
        ctx.beginPath();
        ctx.arc(x - ox * 34, y - oy * 34, 13, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tip = a1;
    const tx = -Math.sin(tip) * dir, ty = Math.cos(tip) * dir;
    ctx.fillStyle = ink(0.2, 0.8);
    ctx.beginPath();
    ctx.ellipse(cx + R * Math.cos(tip) + tx * 30, cy + R * Math.sin(tip) + ty * 30, 34, 12, Math.atan2(ty, tx), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = ink(0.35, 0.15);
  fitText(ctx, "ATH", 512, 395, 330, 118);
  fitText(ctx, "LA", 512, 625, 330, 118);
  ctx.strokeStyle = ink(0.35, 1);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(512, 468);
  ctx.lineTo(512, 548);
  ctx.moveTo(484, 522);
  ctx.lineTo(512, 552);
  ctx.lineTo(540, 522);
  ctx.stroke();
  return sample(ctx, seeds);
}

// Now: a clothes hanger (OneOff, creator storefronts) with the company name from data.
function hanger(seeds: Float32Array, company: string) {
  const ctx = canvas(1024, 1024);
  ctx.strokeStyle = ink(0.4, 0.55);
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(512, 380);
  ctx.lineTo(512, 262);
  ctx.arc(562, 262, 50, Math.PI, Math.PI * 2 + 0.55);
  ctx.stroke();
  ctx.strokeStyle = ink(0, 0.85);
  ctx.lineWidth = 30;
  ctx.beginPath();
  ctx.moveTo(512, 392);
  ctx.lineTo(132, 640);
  ctx.quadraticCurveTo(104, 664, 146, 670);
  ctx.lineTo(878, 670);
  ctx.quadraticCurveTo(920, 664, 892, 640);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = ink(0.6, 1);
  ctx.beginPath();
  ctx.arc(512, 392, 26, 0, Math.PI * 2);
  ctx.fill();
  // Sparkle: the AI in the closet.
  const star = (x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rr = i % 2 ? r * 0.22 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = ink(0.8, 1);
  star(800, 300, 70);
  star(880, 410, 34);
  ctx.fillStyle = ink(-0.2, 0.2);
  fitText(ctx, company.toUpperCase(), 512, 830, 640, 110);
  return sample(ctx, seeds);
}

// Before: a ship's wheel, aka the Kubernetes helm.
function helm(seeds: Float32Array) {
  const ctx = canvas(1024, 1024);
  const c = 512;
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    const cs = Math.cos(a), sn = Math.sin(a);
    ctx.strokeStyle = ink(0.25, 0.45);
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(c + cs * 70, c + sn * 70);
    ctx.lineTo(c + cs * 330, c + sn * 330);
    ctx.stroke();
    ctx.strokeStyle = ink(0.55, 0.75);
    ctx.lineWidth = 46;
    ctx.beginPath();
    ctx.moveTo(c + cs * 350, c + sn * 350);
    ctx.lineTo(c + cs * 440, c + sn * 440);
    ctx.stroke();
  }
  ctx.strokeStyle = ink(0.2, 1);
  ctx.lineWidth = 50;
  ctx.beginPath();
  ctx.arc(c, c, 300, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = ink(0.1, 0.35);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(c, c, 235, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = ink(0.8, 1);
  ctx.beginPath();
  ctx.arc(c, c, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(c, c, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  return sample(ctx, seeds);
}

// Projects: one node per project, wired to its nearest neighbours.
function constellation(seeds: Float32Array, groups: number[]) {
  const ctx = canvas(1024, 1024);
  const rand = rng(7);
  const total = groups.reduce((a, b) => a + b, 0);
  const pts: [number, number, number, number][] = [];
  let minD = 170;
  while (pts.length < total) {
    let placed = false;
    for (let tries = 0; tries < 400 && !placed; tries++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand());
      const x = 512 + Math.cos(a) * r * 420, y = 512 + Math.sin(a) * r * 340;
      if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > minD)) {
        let g = 0, n = pts.length;
        while (n >= groups[g]) n -= groups[g++];
        pts.push([x, y, rand() * 1.6 - 0.8, g]);
        placed = true;
      }
    }
    if (!placed) minD *= 0.9;
  }
  for (let y = 40; y < 1024; y += 64)
    for (let x = 40; x < 1024; x += 64) {
      ctx.fillStyle = ink(-0.9, 0.05);
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  const seen = new Set<string>();
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => [Math.hypot(q[0] - p[0], q[1] - p[1]), j] as const)
      .filter(([, j]) => j !== i)
      .sort((a, b) => a[0] - b[0])
      .slice(0, 2);
    for (const [, j] of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const q = pts[j];
      ctx.lineWidth = 4;
      for (let s = 0; s < 24; s++) {
        const t0 = s / 24, t1 = (s + 1) / 24;
        ctx.strokeStyle = ink(p[2] + (q[2] - p[2]) * t0, 0.25);
        ctx.beginPath();
        ctx.moveTo(p[0] + (q[0] - p[0]) * t0, p[1] + (q[1] - p[1]) * t0);
        ctx.lineTo(p[0] + (q[0] - p[0]) * t1, p[1] + (q[1] - p[1]) * t1);
        ctx.stroke();
      }
    }
  });
  for (const [x, y, z, g] of pts) {
    ctx.fillStyle = ink(z, g === 0 ? 1 : 0.7);
    ctx.beginPath();
    ctx.arc(x, y, g === 0 ? 26 : 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink(z, 0.4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.stroke();
  }
  const shape = sample(ctx, seeds);
  shape.nodes = pts.map(([x, y, z]) => [(x - 512) / 1024, -(y - 512) / 1024, z * 0.16]);
  return shape;
}

// Skills: a nucleus with one orbit per category, one bead per skill.
function orbits(seeds: Float32Array, counts: number[]) {
  const ctx = canvas(1024, 1024);
  const c = 512;
  const n = Math.max(1, counts.length);
  counts.forEach((m, i) => {
    const th = (i * Math.PI) / n + 0.35;
    const rx = 450, ry = 120 + (i % 2) * 22;
    const at = (p: number) => {
      const x = Math.cos(p) * rx, y = Math.sin(p) * ry;
      return [c + x * Math.cos(th) - y * Math.sin(th), c + x * Math.sin(th) + y * Math.cos(th), Math.sin(p) * 0.85] as const;
    };
    ctx.lineWidth = 4;
    for (let s = 0; s < 90; s++) {
      const [x0, y0, z0] = at((s / 90) * Math.PI * 2);
      const [x1, y1] = at(((s + 1) / 90) * Math.PI * 2);
      ctx.strokeStyle = ink(z0, 0.3);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    for (let j = 0; j < m; j++) {
      const [x, y, z] = at((j / m) * Math.PI * 2 + i * 0.9);
      ctx.fillStyle = ink(z, 1);
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  for (let r = 120; r > 0; r -= 8) {
    ctx.fillStyle = ink(Math.sqrt(1 - (r / 120) ** 2) * 0.9, 0.9 - (r / 120) * 0.5);
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return sample(ctx, seeds);
}

// Off-hours: a vinyl record that actually spins (R channel), tonearm stays put.
function vinyl(seeds: Float32Array) {
  const ctx = canvas(1024, 1024);
  const c = 512;
  ctx.fillStyle = ink(0, 0.12, true);
  ctx.beginPath();
  ctx.arc(c, c, 410, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink(0.05, 0.75, true);
  for (const off of [0, Math.PI]) {
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, 410, off + 0.35, off + 0.75);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = 4;
  for (let r = 165; r < 405; r += 13) {
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(c, c, 290, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = ink(0.15, 1, true);
  ctx.beginPath();
  ctx.arc(c, c, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  fitText(ctx, "HATZO", c, c - 34, 200, 52);
  ctx.fillRect(c - 70, c + 22, 140, 6);
  ctx.beginPath();
  ctx.arc(c, c + 70, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(c, c, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = ink(0.75, 0.5);
  ctx.fillStyle = ink(0.75, 0.6);
  ctx.beginPath();
  ctx.arc(930, 110, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(930, 110);
  ctx.lineTo(820, 520);
  ctx.lineTo(760, 600);
  ctx.stroke();
  ctx.lineWidth = 36;
  ctx.beginPath();
  ctx.moveTo(772, 586);
  ctx.lineTo(736, 632);
  ctx.stroke();
  return sample(ctx, seeds);
}

function at(seeds: Float32Array) {
  const ctx = canvas(1024, 1024);
  const g = ctx.createLinearGradient(0, 100, 0, 924);
  g.addColorStop(0, ink(0.3, 1));
  g.addColorStop(1, ink(-0.3, 0.35));
  ctx.fillStyle = g;
  fitText(ctx, "@", 512, 512, 900, 880);
  return sample(ctx, seeds, 0.25);
}

export function buildShapes(data: PortfolioData, seeds: Float32Array): Record<string, Shape> {
  const life = lifeCategory(data);
  const workCats = data.projects.categories.filter((c) => c !== life);
  return {
    home: wordmark(seeds),
    about: wreath(seeds),
    now: hanger(seeds, data.experience[0]?.company ?? "Now"),
    before: helm(seeds),
    projects: constellation(seeds, workCats.map((c) => c.projects.length)),
    skills: orbits(seeds, data.skills.categories.map((c) => c.skills.length)),
    offhours: vinyl(seeds),
    contact: at(seeds),
  };
}
