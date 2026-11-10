import { useEffect, useRef, type PointerEvent } from "react";
import type { PortfolioData } from "../types/portfolio";
import { ROUTES } from "../shared/routes";
import "./hub.css";

// Each door is a small demo of its own verb: drive, stir, scroll.
const DOORS = [
  {
    id: "game",
    verb: "Play",
    hint: "move to ride, down for night",
    blurb: "An open world. Ride a scooter around a Greek island and bump into my résumé.",
  },
  {
    id: "cursor",
    verb: "Move",
    hint: "stir it",
    blurb: "A field of particles and your cursor. Point at something and it takes shape.",
  },
  {
    id: "scroll",
    verb: "Scroll",
    hint: "scroll to fly",
    blurb: "Athens to Los Angeles as one long flight. Scroll to fly.",
  },
] as const;

// Feeds the cursor position to CSS so each door's art can react without a render.
function track(e: PointerEvent<HTMLAnchorElement>) {
  if (e.pointerType === "touch") return; // touch is driven by page scroll instead
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--px", String((e.clientX - r.left) / r.width));
  el.style.setProperty("--py", String((e.clientY - r.top) / r.height));
  if (e.movementX) el.style.setProperty("--dir", e.movementX > 0 ? "1" : "-1");
}

// Dot grid the pointer pushes around; a slow wanderer stirs it when nobody is.
function Dots() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const door = c.parentElement!;
    const nav = door.parentElement!;
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
      // a row door grows on hover: size for its widest state and let the door clip
      const row = getComputedStyle(nav).flexDirection === "row";
      c.style.width = row ? `${Math.ceil(nav.clientWidth * 0.45)}px` : "";
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
    ro.observe(nav);
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

function Art({ id }: { id: (typeof DOORS)[number]["id"] }) {
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
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const doors = [...nav.current!.querySelectorAll<HTMLElement>(".hub-door")];
    const flight = nav.current!.querySelector<HTMLElement>(".hub-door-scroll")!;
    let fly = 0.2; // matches the :hover takeoff in hub.css

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      const next = Math.min(1, Math.max(0, fly + (e.deltaMode ? e.deltaY * 33 : e.deltaY) / 900));
      if (next === fly) return; // at either end the page scrolls as usual
      e.preventDefault();
      fly = next;
      flight.style.setProperty("--fly", String(fly));
      flight.toggleAttribute("data-landed", fly === 1);
    };

    // touch has no hover or wheel, so the page scroll drives every door
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max <= 0 || !matchMedia("(hover: none)").matches) return;
      const p = Math.min(1, Math.max(0, scrollY / max)).toFixed(3);
      for (const d of doors) for (const k of ["--px", "--py", "--fly"]) d.style.setProperty(k, p);
      flight.toggleAttribute("data-landed", p === "1.000");
    };

    flight.addEventListener("wheel", onWheel, { passive: false });
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      flight.removeEventListener("wheel", onWheel);
      removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <main className="hub">
      <header className="hub-top">
        <span>{about.title}</span>
        <span>{about.quickFacts.location}</span>
      </header>

      <div className="hub-head">
        <h1>{about.name}</h1>
        <p>One résumé, three ways in. Pick how you want to read it.</p>
      </div>

      <nav className="hub-doors" aria-label="Versions" ref={nav}>
        {DOORS.map((d, i) => (
          <a key={d.id} href={ROUTES[d.id].path} className={`hub-door hub-door-${d.id}`} onPointerMove={track}>
            <Art id={d.id} />
            <span className="hub-kicker">
              0{i + 1} / {d.verb}
              <span className="hub-hint">{d.hint}</span>
            </span>
            <span className="hub-title">{ROUTES[d.id].label}</span>
            <span className="hub-blurb">{d.blurb}</span>
            <span className="hub-cta" aria-hidden>
              Enter →
            </span>
          </a>
        ))}
      </nav>

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
