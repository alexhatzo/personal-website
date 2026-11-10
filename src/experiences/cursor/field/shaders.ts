// GLSL for the particle field. Targets pack w = tone (0..1) + 2 * spin flag.

const common = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// Each component ignores its own axis, so the field is divergence-free: it swirls like a fluid.
vec3 flow(vec3 p, float t) {
  return vec3(
    sin(p.y * 1.3 + cos(p.z * 1.7 + t)) + 0.5 * sin(p.z * 2.9 - t * 1.3),
    sin(p.z * 1.1 + cos(p.x * 1.5 - t * 0.8)) + 0.5 * sin(p.x * 2.7 + t * 1.1),
    sin(p.x * 1.6 + cos(p.y * 1.2 + t * 0.6)) + 0.5 * sin(p.y * 3.1 - t * 0.9)
  );
}
uniform float uSpin;
vec3 place(vec4 s, vec3 X, out float tone) {
  float spin = step(1.5, s.w);
  tone = s.w - spin * 2.0;
  vec3 p = s.xyz;
  if (spin > 0.5) {
    float c = cos(uSpin), sn = sin(uSpin);
    p.xy = mat2(c, sn, -sn, c) * p.xy;
  }
  return vec3(p.xy * X.z + X.xy, p.z * X.z);
}
`;

export const velocityShader = /* glsl */ `
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform vec3 uFromX;
uniform vec3 uToX;
uniform float uMorphT;
uniform float uTime;
uniform float uDt;
uniform vec3 uPointer;     // world xy, z = presence 0..1
uniform vec2 uPointerVel;  // world units / s
uniform float uRadius;
uniform float uHold;
uniform vec4 uShock;       // xy, radius, strength
uniform vec3 uBurst;       // xy, impulse
uniform float uIdle;
uniform vec4 uFocus;       // world xyz, strength
uniform float uCalm;
uniform float uSnap;
${common}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(tPos, uv).xyz;
  vec4 V = texture2D(tVel, uv);
  vec3 vel = V.xyz;
  float h = hash(uv);
  float h2 = hash(uv + 17.31);

  vec4 sTo = texture2D(tTo, uv);
  float delay = h * 0.5 + clamp(sTo.x * 0.22 + 0.5, 0.0, 1.0) * 0.45;
  float tone;
  vec3 tgt = uMorphT > delay * (1.0 - uCalm)
    ? place(sTo, uToX, tone)
    : place(texture2D(tFrom, uv), uFromX, tone);

  tgt += flow(tgt * 0.45 + h, uTime * 0.35) * 0.06 * uIdle;

  if (uFocus.w > 0.001) {
    vec3 fd = tgt - uFocus.xyz;
    float ff = exp(-dot(fd.xy, fd.xy) / 0.18) * uFocus.w;
    tgt.xy += normalize(fd.xy + 1e-4) * (0.18 + 0.12 * sin(uTime * 9.0 - length(fd.xy) * 9.0)) * ff;
    tgt.z += 1.4 * ff;
  }

  vec3 d = tgt - pos;
  float dist = length(d);
  float k = mix(20.0, 40.0, h2);

  vec2 pd = pos.xy - uPointer.xy;
  float r2 = dot(pd, pd);
  float R = uRadius;
  float fall = exp(-r2 / (R * R)) * uPointer.z * (1.0 - uCalm);
  float well = exp(-r2 / (R * R * 3.5)) * uHold * (1.0 - uCalm);

  vec3 acc = d * k * (1.0 - 0.92 * well);
  float m = length(acc);
  if (m > 80.0) acc *= 80.0 / m;

  // Turbulence while a particle is in transit between formations.
  float transit = smoothstep(0.06, 1.8, dist) * (1.0 - uCalm);
  acc += flow(pos * 0.42 + h * 2.0, uTime * 0.5) * transit * 16.0;

  float spd = min(length(uPointerVel), 30.0);
  vec2 n = pd / sqrt(r2 + 1e-4);
  acc.xy += n * fall * (16.0 + spd * 1.4);
  acc.xy += vec2(-n.y, n.x) * fall * spd * 1.6;
  acc.xy += clamp(uPointerVel, -30.0, 30.0) * fall * 2.4;
  acc += flow(pos * 1.7 + h, uTime * 1.6) * fall * spd * 1.2;
  acc.z += (h - 0.5) * fall * spd * 1.6;

  // Press-and-hold: a small gravity well that spins particles into the cursor.
  acc.xy += (-n * 110.0 * min(sqrt(r2) * 1.5, 1.0) + vec2(-n.y, n.x) * 22.0) * well;
  acc.z += -pos.z * 6.0 * well;

  // Click shockwave ring.
  vec2 sd = pos.xy - uShock.xy;
  float sr = length(sd);
  float sq = (sr - uShock.z) / 0.45;
  float band = exp(-sq * sq) * uShock.w * (1.0 - uCalm);
  acc.xy += sd / (sr + 1e-4) * band * 90.0;
  acc.z += (h2 - 0.5) * band * 60.0;

  vel += acc * uDt;
  vel *= exp(-uDt * mix(5.0, 7.5, h));

  // Release: everything gathered in the well explodes outward.
  vec2 bd = pos.xy - uBurst.xy;
  float bf = exp(-dot(bd, bd) / (R * R * 7.0)) * uBurst.z * (1.0 - uCalm);
  vel.xy += normalize(bd + 1e-4) * bf * (0.4 + h);
  vel.z += (h2 - 0.5) * bf * 2.2;

  if (uSnap > 0.5) vel = vec3(0.0);
  gl_FragColor = vec4(vel, mix(V.w, tone, 0.12));
}
`;

export const positionShader = /* glsl */ `
uniform float uDt;
uniform float uSnap;
uniform sampler2D tTo;
uniform vec3 uToX;
${common}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 p = texture2D(tPos, uv).xyz + texture2D(tVel, uv).xyz * uDt;
  p.z = clamp(p.z, -14.0, 5.0); // never let a particle hit the lens
  if (uSnap > 0.5) { float t; p = place(texture2D(tTo, uv), uToX, t); }
  gl_FragColor = vec4(p, 1.0);
}
`;

export const pointsVertex = /* glsl */ `
uniform sampler2D tPos;
uniform sampler2D tVel;
uniform float uSize;
uniform float uPR;
uniform vec3 uBase;
uniform vec3 uAccent;
uniform vec3 uPointer;
uniform float uRadius;
attribute vec2 aRef;
attribute float aSeed;
varying vec3 vColor;
void main() {
  vec3 P = texture2D(tPos, aRef).xyz;
  vec4 V = texture2D(tVel, aRef);
  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mv;
  float dust = step(aSeed, -0.5);
  float s = abs(aSeed);
  float spd = length(V.xyz);
  float heat = smoothstep(0.6, 7.0, spd);
  vec3 c = mix(uBase, uAccent * 1.15, clamp(V.w, 0.0, 1.0));
  c = mix(c, mix(uAccent, vec3(1.0), 0.35) * 1.4, heat * 0.85);
  vec2 pd = P.xy - uPointer.xy;
  float light = exp(-dot(pd, pd) / (uRadius * uRadius * 5.0)) * uPointer.z;
  float b = (0.7 + 0.3 * fract(s * 13.7)) * (1.0 + light * 1.3 + heat * 0.8);
  b *= mix(1.0, 0.22, dust);
  vColor = c * b;
  float size = uSize * (0.55 + 0.9 * fract(s * 7.3)) * (1.0 + heat * 0.5) * mix(1.0, 1.5, dust);
  gl_PointSize = min(size * uPR * (15.0 / -mv.z), 7.0 * uPR);
}
`;

export const pointsFragment = /* glsl */ `
uniform float uGain;
uniform float uOpacity;
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, r);
  gl_FragColor = vec4(vColor * a * a * uGain * uOpacity, 1.0);
}
`;

export const quadVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const trailFragment = /* glsl */ `
uniform sampler2D tCur;
uniform sampler2D tPrev;
uniform float uDecay;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(max(texture2D(tCur, vUv).rgb, texture2D(tPrev, vUv).rgb * uDecay), 1.0);
}
`;

export const displayFragment = /* glsl */ `
uniform sampler2D tAccum;
uniform vec2 uRes;
uniform vec2 uLight;     // pointer in uv
uniform float uLightAmt;
uniform vec3 uAccent;
uniform float uTime;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 col = texture2D(tAccum, vUv).rgb;
  // Cheap bloom: a golden-angle spiral of taps.
  vec3 glowC = vec3(0.0);
  for (int i = 0; i < 14; i++) {
    float a = float(i) * 2.39996;
    float r = 2.0 + float(i) * 1.9;
    glowC += texture2D(tAccum, vUv + vec2(cos(a), sin(a)) * r / uRes).rgb;
  }
  col += glowC / 14.0 * 0.9;
  col = 1.0 - exp(-col * 1.15);
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  float d = length((vUv - uLight) * asp);
  float glow = exp(-d * d * 5.0) * uLightAmt;
  float vig = smoothstep(1.25, 0.25, length((vUv - 0.5) * asp));
  vec3 bg = vec3(0.022, 0.021, 0.024) * (0.55 + 0.45 * vig) + uAccent * (glow * 0.085 + 0.012 * vig);
  float g = (hash(vUv * uRes + fract(uTime) * 91.7) - 0.5) * 0.028;
  gl_FragColor = vec4(bg + col + g, 1.0);
}
`;
