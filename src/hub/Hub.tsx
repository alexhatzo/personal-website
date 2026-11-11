import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { PortfolioData } from "../types/portfolio";
import { ROUTES } from "../shared/routes";
import "./hub.css";

const WAYS = [
  {
    id: "game",
    verb: "Play",
    accent: "#f5c34a",
    blurb: "An open world. Ride a scooter around a Greek island and bump into my résumé.",
    controls: "WASD or arrow keys. A joystick on touch.",
    goodFor: "A few spare minutes and some curiosity.",
  },
  {
    id: "cursor",
    verb: "Move",
    accent: "#7df9ff",
    blurb: "A field of particles and your cursor. Point at a section and it takes shape.",
    controls: "Move the pointer. Drag and tap on touch.",
    goodFor: "Skimming seven sections in any order.",
  },
  {
    id: "scroll",
    verb: "Scroll",
    accent: "#e98d5b",
    blurb: "Athens to Los Angeles as one long flight, told in ten chapters.",
    controls: "Just scroll.",
    goodFor: "The whole story, start to finish.",
  },
  {
    id: "plain",
    verb: "Read",
    accent: "#f4f1ea",
    blurb: "Everything on one page, in the order a recruiter expects.",
    controls: "None. It prints to PDF.",
    goodFor: "Anyone in a hurry.",
  },
] as const;

type WayId = (typeof WAYS)[number]["id"];
const N = WAYS.length;
const STEP = 45; // degrees between cards; hub.css uses the same angle
const mod = (n: number) => ((n % N) + N) % N;
// line widths of the résumé sheet in the plain preview: 0 is a gap, under 100 a heading
const SHEET = [150, 0, 70, 208, 176, 196, 0, 84, 200, 164, 186, 140, 0, 60, 204, 152, 190, 0, 76, 198, 170];

// Dot grid the pointer pushes around; a slow wanderer stirs it when nobody is.
function Dots() {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const c = ref.current!;
    const door = c.parentElement!;
    const g = c.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GAP = 14;
    const R = 120;
    let pts = new Float32Array(0); // x0, y0, x, y, vx, vy per dot
    let w = 0;
    let h = 0;
    let raf = 0;
    let mx = 0;
    let my = 0;
    let own = false; // the visitor's pointer is driving

    const frame = (t: number) => {
      if (!own) {
        mx = door.clientWidth * (0.5 + 0.34 * Math.sin(t / 2300));
        my = h * (0.5 + 0.3 * Math.sin(t / 1700 + 1));
      }
      g.clearRect(0, 0, w, h);
      g.fillStyle = "#7df9ff";
      for (let i = 0; i < pts.length; i += 6) {
        let x = pts[i + 2];
        let y = pts[i + 3];
        const dx = x - mx;
        const dy = y - my;
        const d = Math.hypot(dx, dy) || 1;
        const near = Math.max(0, 1 - d / R);
        if (!still) {
          const vx = (pts[i + 4] + (dx / d) * near * 2.4 + (pts[i] - x) * 0.07) * 0.8;
          const vy = (pts[i + 5] + (dy / d) * near * 2.4 + (pts[i + 1] - y) * 0.07) * 0.8;
          pts[i + 2] = x += vx;
          pts[i + 3] = y += vy;
          pts[i + 4] = vx;
          pts[i + 5] = vy;
        }
        g.globalAlpha = 0.14 + 0.86 * near;
        g.beginPath();
        g.arc(x, y, 1.1 + near, 0, 6.3);
        g.fill();
      }
      if (!still) raf = requestAnimationFrame(frame);
    };

    const layout = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.ceil(w / GAP);
      const n = cols * Math.ceil(h / GAP);
      pts = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) {
        const x = ((i % cols) + 0.5) * GAP;
        const y = (Math.floor(i / cols) + 0.5) * GAP;
        pts.set([x, y, x, y, 0, 0], i * 6);
      }
      if (still) {
        own = true;
        mx = door.clientWidth / 2;
        my = h / 2;
        frame(0);
      }
    };

    const move = (e: globalThis.PointerEvent) => {
      const r = c.getBoundingClientRect();
      own = true;
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const leave = () => (own = false);

    const ro = new ResizeObserver(layout);
    ro.observe(door);
    if (!still) {
      door.addEventListener("pointermove", move);
      door.addEventListener("pointerleave", leave);
      raf = requestAnimationFrame(frame);
    }
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      door.removeEventListener("pointermove", move);
      door.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={ref} className="hub-art" aria-hidden />;
}

function Art({ id }: { id: WayId }) {
  if (id === "game") {
    return (
      <svg className="hub-art" viewBox="0 0 400 640" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <circle className="hub-sun" cx="290" cy="250" r="54" fill="#fff3d6" />
        <rect y="330" width="400" height="310" fill="#176d86" />
        <path d="M0 330h400" stroke="#fff3d6" strokeOpacity=".5" />
        <path d="M-20 345 Q90 235 210 300 T420 345Z" fill="#c9a36a" />
        <path d="M-20 345 Q90 262 210 316 T420 345Z" fill="#8d9a5b" />
        <g fill="#fbf7ee">
          <rect x="70" y="268" width="44" height="34" />
          <rect x="118" y="280" width="34" height="26" />
          <rect x="160" y="274" width="30" height="36" />
        </g>
        <path d="M70 268a22 22 0 0 1 44 0Z" fill="#2456c4" />
        <rect x="170" y="290" width="9" height="20" fill="#2456c4" />
        <path d="M0 372q25-9 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" className="hub-wave" />
        <path d="M0 412q25-9 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" className="hub-wave hub-wave-2" />
        <rect className="hub-night" width="400" height="640" fill="#0a1238" />
        <g className="hub-lights" fill="#fff3d6">
          <circle cx="40" cy="150" r="1.2" />
          <circle cx="95" cy="196" r="0.9" />
          <circle cx="150" cy="138" r="1.4" />
          <circle cx="215" cy="178" r="1" />
          <circle cx="252" cy="128" r="1.2" />
          <circle cx="330" cy="162" r="0.9" />
          <circle cx="372" cy="208" r="1.3" />
          <circle cx="182" cy="228" r="0.9" />
          <circle cx="58" cy="238" r="1.1" />
          <circle cx="312" cy="232" r="1" />
          <g fill="#f5c34a">
            <rect x="82" y="280" width="7" height="8" />
            <rect x="128" y="288" width="6" height="7" />
            <rect x="141" y="288" width="6" height="7" />
            <rect x="165" y="281" width="6" height="7" />
          </g>
        </g>
        <g className="hub-scooter">
          <g>
            <circle cx="-9" cy="-4" r="4" fill="#17130e" />
            <circle cx="10" cy="-4" r="4" fill="#17130e" />
            <path
              d="M-16-6C-16-13-11-15-4-14L-1-8H5L8-19h3L13-7c2 0 3 2 2 3H-14c-1 0-2-1-2-2Z"
              fill="#f5c34a"
            />
            <rect x="-12" y="-17" width="10" height="3" rx="1.5" fill="#3b2a1c" />
            <path d="M6-20h7" stroke="#17130e" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="13" cy="-15" r="1.6" fill="#fff3d6" />
          </g>
        </g>
      </svg>
    );
  }
  if (id === "cursor") return <Dots />;
  if (id === "plain") {
    return (
      <svg className="hub-art" viewBox="0 0 400 520" preserveAspectRatio="xMidYMin slice" aria-hidden>
        <rect x="70" y="56" width="260" height="520" rx="5" fill="#fffdf8" />
        {SHEET.map((w, i) =>
          w ? (
            <rect
              key={i}
              className="hub-line"
              style={{ "--i": i } as CSSProperties}
              x="96"
              y={92 + i * 21}
              width={w}
              height={w < 100 ? 8 : 5}
              rx="2.5"
              fill="#17130e"
              fillOpacity={w < 100 ? 0.85 : 0.28}
            />
          ) : null,
        )}
      </svg>
    );
  }
  return (
    <svg className="hub-art" viewBox="0 150 400 230" preserveAspectRatio="xMidYMin meet" aria-hidden>
      <path d="M40 330 Q200 60 360 250" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
      <path className="hub-trail" d="M40 330 Q200 60 360 250" pathLength={1} fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="40" cy="330" r="5" fill="currentColor" />
      <circle className="hub-dest" cx="360" cy="250" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="40" y="356" textAnchor="middle">ATH</text>
      <text x="360" y="276" textAnchor="middle">LAX</text>
      <path className="hub-plane" d="M-11-7 11 0-11 7-6 0Z" fill="currentColor" />
    </svg>
  );
}

export default function Hub({ data }: { data: PortfolioData }) {
  const { about, contact } = data;
  const stage = useRef<HTMLDivElement>(null);
  const [front, setFront] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? front;
  const way = WAYS[shown];

  useLayoutEffect(() => {
    const el = stage.current!;
    const wheel = el.querySelector<HTMLElement>(".hub-wheel")!;
    const cards = [...wheel.querySelectorAll<HTMLElement>(".hub-card")];
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pos = 0; // wheel position in cards, unbounded so it can spin forever
    let rest = 0; // where it last came to rest
    let target: number | null = null;
    let raf = 0;
    let idle = 0;
    let drag: { y: number; pos: number; moved: boolean } | null = null;
    let dragged = false;

    const paint = () => {
      cards.forEach((c, i) => {
        const d = mod(i - pos + N / 2) - N / 2; // -2..2, 0 is the front
        c.style.setProperty("--d", d.toFixed(4));
        c.toggleAttribute("data-off", Math.abs(d) > 1.5);
      });
      setFront(mod(Math.round(pos)));
    };

    const tick = () => {
      if (target === null) return;
      const diff = target - pos;
      if (still || Math.abs(diff) < 0.002) {
        pos = rest = target;
        target = null;
      } else {
        pos += diff * 0.16;
        raf = requestAnimationFrame(tick);
      }
      paint();
    };
    const go = (to: number) => {
      target = to;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const hold = () => {
      cancelAnimationFrame(raf);
      target = null;
      setHover(null);
    };
    // a small push still turns one card; a big one lands on the nearest
    const settle = () => {
      const by = pos - rest;
      const a = Math.abs(by);
      go(a < 0.12 ? rest : a < 0.5 ? rest + Math.sign(by) : Math.round(pos));
    };
    const face = (i: number) => {
      const base = Math.round(target ?? pos);
      go(base + mod(i - base + N / 2) - N / 2);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      e.preventDefault();
      hold();
      pos += (e.deltaMode ? e.deltaY * 33 : e.deltaY) / 260;
      paint();
      clearTimeout(idle);
      idle = window.setTimeout(settle, 120);
    };

    const onDown = (e: PointerEvent) => {
      dragged = false;
      if (e.button === 0) drag = { y: e.clientY, pos, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      if (!(e.buttons & 1)) drag = null; // released outside the wheel
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dy) < 6) return;
        drag.moved = dragged = true;
        wheel.setPointerCapture(e.pointerId);
        hold();
      }
      pos = drag.pos - dy / cards[0].offsetHeight;
      paint();
    };
    const onUp = () => {
      if (drag?.moved) settle();
      drag = null;
    };
    // a drag that ends over a card must not follow its link
    const onClick = (e: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const noDrag = (e: Event) => e.preventDefault();

    const onKey = (e: KeyboardEvent) => {
      const by = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!by || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      const to = Math.round(target ?? pos) + by;
      setHover(null);
      go(to);
      if (wheel.contains(document.activeElement)) cards[mod(to)].focus({ preventScroll: true });
    };
    // tabbing to a card turns it to the front; a mouse press must not move it mid-click
    const onFocus = (e: FocusEvent) => {
      const i = cards.indexOf(e.target as HTMLElement);
      if (i >= 0 && cards[i].matches(":focus-visible")) face(i);
    };

    paint();
    el.addEventListener("wheel", onWheel, { passive: false });
    wheel.addEventListener("pointerdown", onDown);
    wheel.addEventListener("pointermove", onMove);
    wheel.addEventListener("pointerup", onUp);
    wheel.addEventListener("pointercancel", onUp);
    wheel.addEventListener("click", onClick, true);
    wheel.addEventListener("dragstart", noDrag);
    wheel.addEventListener("focusin", onFocus);
    addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      el.removeEventListener("wheel", onWheel);
      wheel.removeEventListener("pointerdown", onDown);
      wheel.removeEventListener("pointermove", onMove);
      wheel.removeEventListener("pointerup", onUp);
      wheel.removeEventListener("pointercancel", onUp);
      wheel.removeEventListener("click", onClick, true);
      wheel.removeEventListener("dragstart", noDrag);
      wheel.removeEventListener("focusin", onFocus);
      removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <main className="hub" style={{ "--accent": way.accent, "--step": `${STEP}deg` } as CSSProperties}>
      <header className="hub-top">
        <span>{about.title}</span>
        <span>{about.quickFacts.location}</span>
      </header>

      <div className="hub-head">
        <h1>{about.name}</h1>
        <p>One résumé, four ways to read it. Scroll or drag the wheel to pick one.</p>
      </div>

      <div className="hub-stage" ref={stage}>
        <div className="hub-pv" aria-hidden>
          {WAYS.map((w, i) => (
            <div key={w.id} className={`hub-slide hub-slide-${w.id}`} data-on={i === shown || undefined}>
              <Art id={w.id} />
            </div>
          ))}
        </div>

        <nav className="hub-wheel" aria-label="Versions">
          <div className="hub-drum">
            {WAYS.map((w, i) => (
              <a
                key={w.id}
                href={ROUTES[w.id].path}
                className="hub-card"
                draggable={false}
                data-shown={i === shown || undefined}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onPointerLeave={() => setHover(null)}
              >
                <span className="hub-tab">
                  0{i + 1} / {w.verb}
                </span>
                <span className="hub-enter" aria-hidden>
                  Enter →
                </span>
                <span className="hub-title">{ROUTES[w.id].label}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="hub-detail" aria-live="polite">
          <div key={way.id}>
            <p className="hub-kicker">
              0{shown + 1} / {ROUTES[way.id].label}
            </p>
            <p className="hub-blurb">{way.blurb}</p>
            <dl className="hub-facts">
              <dt>Controls</dt>
              <dd>{way.controls}</dd>
              <dt>Good for</dt>
              <dd>{way.goodFor}</dd>
            </dl>
          </div>
        </div>
      </div>

      <footer className="hub-foot">
        <a href={ROUTES.plain.path}>In a hurry? Plain résumé →</a>
        <span>
          {contact.socialLinks.map((l) => (
            <a key={l.name} href={l.url} target={l.url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
              {l.name}
            </a>
          ))}
        </span>
      </footer>
    </main>
  );
}
