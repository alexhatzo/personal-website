import * as THREE from "three";
import { height, slopeAt, clamp, smooth } from "./terrain";
import { mulberry32 } from "./kit";

export const TERRAIN_SIZE = 280;
const SEG = 140;

/** Faceted island mesh with per-face colors. Also returns indexed arrays for the physics trimesh. */
export function buildTerrain() {
  const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEG, SEG);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const rnd = mulberry32(7);
  for (let i = 0; i < pos.count; i++) {
    // jitter interior vertices a little so the facets read as hand-made
    const x = pos.getX(i) + (rnd() - 0.5) * 0.8;
    const z = pos.getZ(i) + (rnd() - 0.5) * 0.8;
    pos.setXYZ(i, x, height(x, z), z);
  }
  const physVerts = new Float32Array(pos.array as Float32Array);
  const physIdx = new Uint32Array(g.index!.array as ArrayLike<number>);

  const ng = g.toNonIndexed();
  g.dispose();
  const p = ng.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const sandWet = new THREE.Color("#cdb07a");
  const sand = new THREE.Color("#efd9a6");
  const grass = new THREE.Color("#c9b25e");
  const green = new THREE.Color("#9aa653");
  const rock = new THREE.Color("#b4a184");
  const seabed = new THREE.Color("#c9b98c");
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
    const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const s = slopeAt(cx, cz);
    const n = Math.sin(cx * 0.09) * Math.cos(cz * 0.11) * 0.5 + 0.5;
    if (cy < -0.2) c.copy(seabed);
    else if (cy < 0.5) c.copy(sandWet).lerp(sand, smooth(-0.2, 0.5, cy));
    else if (cy < 1.5) c.copy(sand).lerp(grass, smooth(1.0, 1.5, cy));
    else c.copy(grass).lerp(green, clamp(n * 1.2 - 0.1, 0, 1));
    if (s > 0.45 && cy > 0.6) c.lerp(rock, smooth(0.45, 0.8, s));
    const j = 1 + (Math.random() - 0.5) * 0.06;
    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3] = c.r * j;
      colors[(i + k) * 3 + 1] = c.g * j;
      colors[(i + k) * 3 + 2] = c.b * j;
    }
  }
  ng.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  ng.computeVertexNormals();
  const m = new THREE.Mesh(ng, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  m.receiveShadow = true;
  return { mesh: m, physVerts, physIdx };
}

/** Terrain heights baked into a texture so the water shader knows depth (shore foam, color). */
function heightTexture() {
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1) - 0.5) * TERRAIN_SIZE;
      const z = (j / (N - 1) - 0.5) * TERRAIN_SIZE;
      const v = clamp((height(x, z) + 8) / 16, 0, 1) * 255;
      const k = (j * N + i) * 4;
      data[k] = v;
      data[k + 3] = 255;
    }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

export function buildWater() {
  const geo = new THREE.PlaneGeometry(1400, 1400, 220, 220);
  geo.rotateX(-Math.PI / 2);
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uNight: { value: 0 },
      uHeight: { value: null },
      uSize: { value: TERRAIN_SIZE },
      uSun: { value: new THREE.Vector3(1, 1, 0) },
      uShallow: { value: new THREE.Color("#46d6c8") },
      uDeep: { value: new THREE.Color("#1b78a8") },
      uFar: { value: new THREE.Color("#2a6f9e") },
      uSunCol: { value: new THREE.Color("#ffd29a") },
    },
  ]);
  uniforms.uHeight.value = heightTexture();
  const m = new THREE.ShaderMaterial({
    uniforms,
    fog: true,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vW;
      varying vec3 vN;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
        float a = p.x * 0.11 + uTime * 0.9;
        float b = p.z * 0.14 + uTime * 1.2;
        float c = (p.x + p.z) * 0.05 + uTime * 0.5;
        p.y += sin(a) * 0.09 + sin(b) * 0.08 + sin(c) * 0.12;
        vN = normalize(vec3(-cos(a) * 0.0099 - cos(c) * 0.006, 1.0, -cos(b) * 0.0112 - cos(c) * 0.006) * vec3(9.0, 1.0, 9.0));
        vW = p;
        vec4 mvPosition = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uNight;
      uniform float uSize;
      uniform sampler2D uHeight;
      uniform vec3 uSun;
      uniform vec3 uShallow;
      uniform vec3 uDeep;
      uniform vec3 uFar;
      uniform vec3 uSunCol;
      varying vec3 vW;
      varying vec3 vN;
      #include <fog_pars_fragment>
      void main() {
        vec2 uv = vW.xz / uSize + 0.5;
        float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
        float th = mix(-8.0, texture2D(uHeight, uv).r * 16.0 - 8.0, inside);
        float depth = max(0.0, -th);
        vec3 col = mix(uShallow, uDeep, smoothstep(0.3, 6.0, depth));
        col = mix(col, uFar, smoothstep(140.0, 420.0, length(vW.xz)));
        // shore foam: a solid lip plus bands that roll toward the beach
        float wob = sin(vW.x * 0.6 + uTime) * 0.08 + sin(vW.z * 0.5 - uTime * 0.7) * 0.08;
        float lip = smoothstep(0.42, 0.12, depth + wob);
        float band = smoothstep(0.82, 0.9, fract(depth * 1.3 - uTime * 0.28 + wob)) * smoothstep(1.6, 0.3, depth);
        float foam = clamp(lip + band * 0.85, 0.0, 1.0);
        // glints
        vec3 V = normalize(cameraPosition - vW);
        vec3 H = normalize(V + normalize(uSun));
        float spec = pow(max(dot(normalize(vN), H), 0.0), 420.0);
        float fres = pow(1.0 - max(V.y, 0.0), 3.0);
        vec3 sky = mix(vec3(1.0, 0.82, 0.62), vec3(0.18, 0.24, 0.42), uNight);
        col = mix(col, sky, fres * 0.35);
        col *= mix(1.0, 0.22, uNight);
        col += uSunCol * spec * mix(1.4, 0.35, uNight);
        col = mix(col, vec3(1.0, 0.98, 0.94) * mix(1.0, 0.35, uNight), foam);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const water = new THREE.Mesh(geo, m);
  water.receiveShadow = false;
  return water;
}

export function buildSky() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSun: { value: new THREE.Vector3(1, 0.3, 0) },
      uSunCol: { value: new THREE.Color("#ffcf8a") },
      uNight: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uSun;
      uniform vec3 uSunCol;
      uniform float uNight;
      varying vec3 vDir;
      void main() {
        float y = max(vDir.y, 0.0);
        vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.55, y), 0.8));
        float s = max(dot(vDir, normalize(uSun)), 0.0);
        col += uSunCol * (pow(s, 6.0) * 0.45 + pow(s, 900.0) * 3.0) * (1.0 - uNight * 0.7);
        col = mix(col, uHorizon * 0.9, smoothstep(0.0, -0.2, vDir.y));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), m);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  return sky;
}

export function buildStars() {
  const n = 900;
  const p = new Float32Array(n * 3);
  const rnd = mulberry32(3);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const y = 0.08 + rnd() * 0.92;
    const r = Math.sqrt(1 - y * y);
    p[i * 3] = Math.cos(a) * r * 800;
    p[i * 3 + 1] = y * 800;
    p[i * 3 + 2] = Math.sin(a) * r * 800;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ color: "#fff6e0", size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const s = new THREE.Points(g, m);
  s.frustumCulled = false;
  return s;
}
