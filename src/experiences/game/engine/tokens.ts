import * as THREE from "three";
import { mulberry32 } from "./kit";
import { PLACE, type PlaceId } from "./places";
import { height } from "./terrain";
import { TOKEN_COLORS } from "./districtsA";
import type { WorldCtx } from "./ctx";

export interface Token {
  key: string;
  name: string;
  cat: number;
  x: number;
  y: number;
  z: number;
  taken: boolean;
  pop: number;
}

export const skillKey = (cat: string, skill: string) => `${cat}::${skill}`;

// Each category's tokens hang around the districts where those skills were used.
const ANCHORS: PlaceId[][] = [
  ["oneoff", "workshop", "skills"],
  ["athens", "workshop", "skills", "port"],
  ["p1", "tennis", "p1"],
  ["beach", "contact", "port", "tennis"],
];

export function buildTokens(ctx: WorldCtx, collected: Set<string>) {
  const rnd = mulberry32(2024);
  const tokens: Token[] = [];
  const cats = ctx.data.skills.categories;
  const used: { x: number; z: number }[] = [];
  cats.forEach((cat, ci) => {
    const anchors = ANCHORS[ci % ANCHORS.length];
    cat.skills.forEach((name, si) => {
      const P = PLACE[anchors[si % anchors.length]];
      let x = P.x;
      let z = P.z;
      for (let k = 0; k < 60; k++) {
        const a = rnd() * Math.PI * 2;
        const r = P.flat * 0.45 + rnd() * (P.flat * 0.75 + 6);
        x = P.x + Math.cos(a) * r;
        z = P.z + Math.sin(a) * r;
        if (height(x, z) > 0.6 && ctx.clear(x, z, 1.4) && used.every((u) => Math.hypot(u.x - x, u.z - z) > 3.2)) break;
      }
      used.push({ x, z });
      const key = skillKey(cat.name, name);
      tokens.push({ key, name, cat: ci, x, y: height(x, z) + 1.3, z, taken: collected.has(key), pop: 0 });
    });
  });

  const geo = new THREE.CylinderGeometry(0.55, 0.55, 0.16, 18).rotateX(Math.PI / 2);
  const material = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#4a4a4a", flatShading: true });
  const im = new THREE.InstancedMesh(geo, material, tokens.length);
  im.castShadow = true;
  im.frustumCulled = false;
  tokens.forEach((t, i) => im.setColorAt(i, new THREE.Color(TOKEN_COLORS[t.cat % TOKEN_COLORS.length])));
  // inner disc for a coin-like read
  const inner = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 6).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#fff8ec", emissive: "#fff1c4", emissiveIntensity: 0.6 }), tokens.length);
  inner.frustumCulled = false;
  ctx.scene.add(im, inner);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  function update(t: number, dt: number) {
    tokens.forEach((tk, i) => {
      let sc = 1;
      if (tk.taken) {
        if (tk.pop <= 0) sc = 0;
        else {
          tk.pop -= dt;
          sc = 1 + (0.35 - tk.pop) * 4;
          if (tk.pop <= 0) sc = 0;
        }
      }
      q.setFromAxisAngle(up, t * 2 + i + (tk.pop > 0 ? (0.35 - tk.pop) * 30 : 0));
      p.set(tk.x, tk.y + Math.sin(t * 2.2 + i) * 0.18 + (tk.pop > 0 ? (0.35 - tk.pop) * 5 : 0), tk.z);
      m.compose(p, q, s.setScalar(sc));
      im.setMatrixAt(i, m);
      inner.setMatrixAt(i, m);
    });
    im.instanceMatrix.needsUpdate = true;
    inner.instanceMatrix.needsUpdate = true;
  }
  update(0, 0);
  return { tokens, update };
}
