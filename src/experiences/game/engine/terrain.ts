import { PLACES } from "./places";

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function coastR(x: number, z: number) {
  const a = Math.atan2(z, x);
  return 100 + 7 * Math.sin(3 * a + 0.5) + 4 * Math.sin(7 * a + 1.3) + 2 * Math.sin(11 * a + 2);
}

const HILLS: [number, number, number, number][] = [
  [-6, -46, 7, 34],
  [-30, -68, 8, 18],
  [-64, -16, 5, 22],
  [56, -4, 3, 26],
  [22, 34, 1.8, 18],
];

function noise(x: number, z: number) {
  return (
    Math.sin(x * 0.071 + 1.3) * Math.cos(z * 0.063 - 0.7) * 0.6 +
    Math.sin(x * 0.13 - z * 0.11 + 2.1) * 0.3 +
    Math.sin((x + z) * 0.23) * 0.12
  );
}

export function rawHeight(x: number, z: number) {
  const d = Math.hypot(x, z) / coastR(x, z);
  let land = 2.4 + noise(x, z) * 1.5;
  for (const [hx, hz, h, r] of HILLS) {
    const q = ((x - hx) ** 2 + (z - hz) ** 2) / (r * r);
    land += h * Math.exp(-q);
  }
  const t = smooth(0.78, 1.04, d);
  return land * (1 - t) - 7 * t;
}

const FLATS = PLACES.map((p) => ({ x: p.x, z: p.z, r: p.flat, h: Math.max(1.6, rawHeight(p.x, p.z)) }));

/** Terrain surface height (sea level is y = 0). */
export function height(x: number, z: number) {
  let h = rawHeight(x, z);
  for (const f of FLATS) {
    const d = Math.hypot(x - f.x, z - f.z);
    if (d < f.r + 10) h = lerp(h, f.h, 1 - smooth(f.r, f.r + 10, d));
  }
  return h;
}

export const placeBase = (i: number) => FLATS[i].h;

/** Drivable decks on top of the terrain: the pier and two jump ramps. Axis-aligned, rise along +z or -z / x. */
export interface Deck {
  x: number;
  z: number;
  hw: number;
  hd: number;
  y0: number;
  y1: number;
  /** slope axis; y0 is at the +x/+z end, y1 at the -x/-z end */
  axis: "x" | "z";
}

const portH = FLATS[0].h;
export const DECKS: Deck[] = [
  { x: 0, z: 98, hw: 2.6, hd: 16, y0: portH - 0.15, y1: portH - 0.15, axis: "z" },
  // beach ramp, rises toward the sea (west)
  { x: -50, z: 66, hw: 2.4, hd: 4, y0: 0, y1: 2.6, axis: "x" },
  // ramp by the workshop, rises to the north
  { x: 14, z: -10, hw: 2.4, hd: 4.5, y0: 0, y1: 3, axis: "z" },
];
// Ramps sit on the terrain: offset their base by terrain height at the low end.
for (const d of DECKS.slice(1)) {
  const lowX = d.axis === "x" ? d.x + d.hw : d.x;
  const lowZ = d.axis === "z" ? d.z + d.hd : d.z;
  const base = height(lowX, lowZ);
  d.y0 += base;
  d.y1 += base;
}
// ramps rise *away* from their low end: flip sign convention handled in deckHeight
function deckHeight(d: Deck, x: number, z: number) {
  if (Math.abs(x - d.x) > d.hw || Math.abs(z - d.z) > d.hd) return -Infinity;
  if (d.y0 === d.y1) return d.y0;
  // t = 0 at the low end (+x / +z side), 1 at the high end
  const t = d.axis === "x" ? (d.x + d.hw - x) / (2 * d.hw) : (d.z + d.hd - z) / (2 * d.hd);
  return lerp(d.y0, d.y1, t);
}

/** Height the scooter drives on. */
export function groundHeight(x: number, z: number) {
  let h = height(x, z);
  for (const d of DECKS) {
    const dh = deckHeight(d, x, z);
    if (dh > h) h = dh;
  }
  return h;
}

export function slopeAt(x: number, z: number) {
  const e = 1;
  return Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
}
