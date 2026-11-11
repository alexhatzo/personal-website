// The landing page's rolodex: a three.js model of a rotary card file. Hub.tsx owns the input and tells it which card is up.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type CardFace = {
  id: string; // picks the illustration; "name" has none
  kicker: string;
  corner: string;
  title: string;
  blurb?: string;
  foot: string;
};

const COUNT = 30; // cards on the wheel; the faces repeat round it
const CW = 1.9;
const CH = 1.05;
const HUB = 0.34; // radius the cards hang from
const BACK = 18; // degrees the card that is up leans away from you
const FRONT = -82; // degrees the last flipped card leans towards you
const STEP = (360 - (BACK - FRONT)) / (COUNT - 1);
const YAW = -0.3;
const rad = THREE.MathUtils.degToRad;

// lean of a card d places behind the one that is up (negative: already flipped forward)
const lean = (d: number) => (d >= 0 ? BACK + d * STEP : d <= -1 ? FRONT + (d + 1) * STEP : BACK + d * (BACK - FRONT));

const SERIF = '"Instrument Serif", "Iowan Old Style", Georgia, serif';
const MONO = '"DM Mono", ui-monospace, Menlo, monospace';
const INK = "#1b1712";
const PAPER = "#efe7d8";
const TW = 1024;
const TH = Math.round((TW * CH) / CW);

type G = CanvasRenderingContext2D;

const ART: Record<string, (g: G, x: number, y: number, w: number, h: number) => void> = {
  game(g, x, y, w, h) {
    const sky = g.createLinearGradient(0, y, 0, y + h * 0.56);
    sky.addColorStop(0, "#2c4a7a");
    sky.addColorStop(0.65, "#e98d5b");
    sky.addColorStop(1, "#f7c98a");
    g.fillStyle = sky;
    g.fillRect(x, y, w, h);
    g.fillStyle = "#fff3d6";
    g.beginPath();
    g.arc(x + w * 0.7, y + h * 0.36, w * 0.13, 0, 7);
    g.fill();
    g.fillStyle = "#176d86";
    g.fillRect(x, y + h * 0.56, w, h);
    g.fillStyle = "#8d9a5b";
    g.beginPath();
    g.moveTo(x, y + h * 0.58);
    g.quadraticCurveTo(x + w * 0.3, y + h * 0.3, x + w * 0.62, y + h * 0.52);
    g.quadraticCurveTo(x + w * 0.8, y + h * 0.6, x + w, y + h * 0.58);
    g.fill();
    g.fillStyle = "#fbf7ee";
    g.fillRect(x + w * 0.16, y + h * 0.4, w * 0.14, h * 0.1);
    g.fillRect(x + w * 0.32, y + h * 0.44, w * 0.1, h * 0.08);
    g.fillStyle = "#2456c4";
    g.beginPath();
    g.arc(x + w * 0.23, y + h * 0.4, w * 0.07, Math.PI, 0);
    g.fill();
  },
  cursor(g, x, y, w, h) {
    g.fillStyle = "#050507";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#7df9ff";
    const cx = x + w * 0.56;
    const cy = y + h * 0.48;
    for (let px = x + 12; px < x + w; px += 19) {
      for (let py = y + 12; py < y + h; py += 19) {
        const d = Math.hypot(px - cx, py - cy) || 1;
        const near = Math.max(0, 1 - d / (w * 0.42));
        g.globalAlpha = 0.16 + 0.84 * near;
        g.beginPath();
        g.arc(px + ((px - cx) / d) * near * 16, py + ((py - cy) / d) * near * 16, 1.6 + near * 1.6, 0, 7);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  },
  scroll(g, x, y, w, h) {
    g.fillStyle = "#e2d8c4";
    g.fillRect(x, y, w, h);
    g.strokeStyle = g.fillStyle = INK;
    g.lineWidth = 3;
    g.setLineDash([3, 11]);
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x + w * 0.14, y + h * 0.72);
    g.quadraticCurveTo(x + w * 0.5, y + h * 0.02, x + w * 0.86, y + h * 0.5);
    g.stroke();
    g.setLineDash([]);
    g.beginPath();
    g.arc(x + w * 0.14, y + h * 0.72, 7, 0, 7);
    g.fill();
    g.beginPath();
    g.arc(x + w * 0.86, y + h * 0.5, 7, 0, 7);
    g.stroke();
    g.font = `500 19px ${MONO}`;
    g.textAlign = "center";
    g.fillText("ATH", x + w * 0.14, y + h * 0.72 + 34);
    g.fillText("LAX", x + w * 0.86, y + h * 0.5 + 34);
    g.textAlign = "left";
    g.translate(x + w * 0.5, y + h * 0.33);
    g.beginPath();
    g.moveTo(-16, -10);
    g.lineTo(16, 0);
    g.lineTo(-16, 10);
    g.lineTo(-9, 0);
    g.fill();
  },
  plain(g, x, y, w, h) {
    g.fillStyle = "#cfc7b8";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#fffdf8";
    g.fillRect(x + w * 0.16, y + h * 0.1, w * 0.68, h);
    [0.5, 0, 0.24, 0.7, 0.58, 0.66, 0, 0.28, 0.68, 0.54, 0.62].forEach((len, i) => {
      if (!len) return;
      g.fillStyle = len < 0.3 ? "rgb(23 19 14 / 0.85)" : "rgb(23 19 14 / 0.28)";
      g.fillRect(x + w * 0.24, y + h * 0.19 + i * 23, w * 0.52 * len * 1.4, len < 0.3 ? 8 : 5);
    });
  },
};

function wrap(g: G, text: string, x: number, y: number, max: number, lh: number) {
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && g.measureText(next).width > max) {
      g.fillText(line, x, y);
      y += lh;
      line = word;
    } else line = next;
  }
  g.fillText(line, x, y);
}

// one face, drawn like a ruled index card
function paint(g: G, f: CardFace) {
  g.save();
  g.fillStyle = PAPER;
  g.fillRect(0, 0, TW, TH);
  g.fillStyle = "rgb(190 60 50 / 0.5)";
  g.fillRect(0, 96, TW, 2);
  g.fillStyle = "rgb(70 110 160 / 0.22)";
  for (let y = 140; y < TH - 20; y += 42) g.fillRect(0, y, TW, 2);

  g.fillStyle = INK;
  g.textBaseline = "alphabetic";
  g.letterSpacing = "3px";
  g.font = `500 22px ${MONO}`;
  g.fillText(f.kicker.toUpperCase(), 48, 66);
  g.textAlign = "right";
  if (f.blurb) {
    g.beginPath();
    g.roundRect(TW - 200, 34, 152, 46, 23);
    g.fill();
    g.fillStyle = PAPER;
    g.fillText(f.corner.toUpperCase(), TW - 70, 65);
    g.fillStyle = INK;
  } else g.fillText(f.corner.toUpperCase(), TW - 48, 66);
  g.textAlign = "left";
  g.fillText(f.foot.toUpperCase(), 48, TH - 40);
  g.letterSpacing = "0px";

  if (f.blurb) {
    g.font = `400 150px ${SERIF}`;
    const tw = g.measureText(f.title).width;
    if (tw > 580) g.font = `400 ${Math.floor((150 * 580) / tw)}px ${SERIF}`; // keep clear of the illustration
    g.fillText(f.title, 44, 250);
    g.font = `400 36px ${SERIF}`;
    wrap(g, f.blurb, 48, 316, 560, 42);
    g.beginPath();
    g.roundRect(660, 130, 316, 340, 20);
    g.clip();
    ART[f.id]?.(g, 660, 130, 316, 340);
  } else {
    g.font = `400 190px ${SERIF}`;
    f.title.split(" ").forEach((word, i) => g.fillText(word, 40, 270 + i * 168));
  }
  g.restore();
}

export function createRolodex(canvas: HTMLCanvasElement, faces: CardFace[]) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  const sun = new THREE.DirectionalLight(0xfff4e2, 2.4);
  sun.position.set(-3.2, 6, 4.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -4.5;
  sun.shadow.camera.right = sun.shadow.camera.top = 4.5;
  sun.shadow.camera.far = 20;
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const body = new THREE.Group();
  body.rotation.y = YAW;
  scene.add(body);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], parent: THREE.Object3D = body) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const floorY = -(HUB + CH) - 0.28;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.34 }));
  floor.position.y = floorY;
  floor.receiveShadow = true;
  scene.add(floor);

  // frame: a black enamel base and side plates, big knobs, chrome axle and rails
  const enamel = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.38, metalness: 0.25 });
  const knobMat = new THREE.MeshStandardMaterial({ color: 0x101112, roughness: 0.5, flatShading: true });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.14, metalness: 1 });
  add(new RoundedBoxGeometry(CW + 1.1, 0.2, 2.5, 4, 0.07), enamel).position.y = floorY + 0.1;

  const side = new THREE.Shape();
  side.moveTo(-1.02, floorY + 0.18);
  side.lineTo(1.02, floorY + 0.18);
  side.absarc(0, 0, 0.5, -0.25, Math.PI + 0.25, false);
  const plate = new THREE.ExtrudeGeometry(side, { depth: 0.07, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 2, curveSegments: 28 })
    .translate(0, 0, -0.035)
    .rotateY(Math.PI / 2);
  const sideX = CW / 2 + 0.16;
  const knobs: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    add(plate, enamel).position.x = s * sideX;
    const knob = new THREE.Group();
    knob.position.x = s * (sideX + 0.16);
    add(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 22).rotateZ(Math.PI / 2), knobMat, knob);
    add(new THREE.CylinderGeometry(0.15, 0.15, 0.24, 32).rotateZ(Math.PI / 2), chrome, knob);
    body.add(knob);
    knobs.push(knob);
    add(new THREE.TorusGeometry(HUB + 0.015, 0.022, 10, 64).rotateY(Math.PI / 2), chrome).position.x = s * CW * 0.26;
  }
  add(new THREE.CylinderGeometry(0.05, 0.05, sideX * 2, 20).rotateZ(Math.PI / 2), chrome);
  add(new THREE.CylinderGeometry(HUB - 0.03, HUB - 0.03, CW - 0.1, 40).rotateZ(Math.PI / 2), enamel);

  // cards: thin boxes hinged on the axle, the face texture on the side that looks at you
  const textures = faces.map(() => {
    const t = new THREE.CanvasTexture(Object.assign(document.createElement("canvas"), { width: TW, height: TH }));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  });
  const draw = () =>
    textures.forEach((t, i) => {
      paint((t.image as HTMLCanvasElement).getContext("2d")!, faces[i]);
      t.needsUpdate = true;
    });
  const edge = new THREE.MeshStandardMaterial({ color: 0xd9cfbb, roughness: 0.95 });
  const blank = new THREE.MeshStandardMaterial({ color: 0xe6dcc8, roughness: 0.95 });
  const fronts = textures.map((map) => new THREE.MeshStandardMaterial({ map, roughness: 0.9 }));
  const cardGeo = new THREE.BoxGeometry(CW, CH, 0.007).translate(0, HUB + CH / 2, 0);
  const cards = Array.from({ length: COUNT }, (_, j) => {
    const m = add(cardGeo, [edge, edge, edge, edge, fronts[j % faces.length], blank]);
    m.position.x = Math.sin(j * 12.9898) * 0.012; // a hand-filed deck is never square
    return m;
  });

  let queued = 0;
  const invalidate = () => {
    queued ||= requestAnimationFrame(() => {
      queued = 0;
      renderer.render(scene, camera);
    });
  };
  draw();
  // the faces are drawn once with fallback fonts, then again when the real ones arrive
  Promise.all([`150px ${SERIF}`, `500 22px ${MONO}`].map((f) => document.fonts.load(f))).then(() => {
    draw();
    invalidate();
  });

  let up = 0;
  const ray = new THREE.Raycaster();
  return {
    /** pos: which card is up, fractional mid-flip and unbounded */
    set(pos: number) {
      up = (((Math.round(pos) % COUNT) + COUNT) % COUNT) | 0;
      cards.forEach((c, j) => {
        const d = ((((j - pos + COUNT / 2) % COUNT) + COUNT) % COUNT) - COUNT / 2;
        c.rotation.x = -rad(lean(d) + Math.sin(j * 78.233) * 0.7);
      });
      for (const k of knobs) k.rotation.x = rad(pos * STEP);
      invalidate();
    },
    /** x: -0.5..0.5 across the screen; the rolodex turns a little towards the pointer */
    yaw(x: number) {
      body.rotation.y = YAW + x * 0.22;
      invalidate();
    },
    resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const t = Math.tan(rad(camera.fov / 2));
      const dist = Math.max(2.75 / t, 2.35 / (t * camera.aspect));
      camera.position.set(0, -0.48 + dist * 0.42, dist * 0.91);
      camera.lookAt(0, -0.48, 0);
      camera.updateProjectionMatrix();
      invalidate();
    },
    /** is the card that is up under this point? */
    hit(clientX: number, clientY: number) {
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, 1 - ((clientY - r.top) / r.height) * 2), camera);
      return ray.intersectObjects(cards)[0]?.object === cards[up];
    },
    dispose() {
      cancelAnimationFrame(queued);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      [enamel, knobMat, chrome, edge, blank, floor.material as THREE.Material, ...fronts, ...textures, scene.environment!].forEach((x) => x.dispose());
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
