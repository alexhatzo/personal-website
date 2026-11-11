import { useEffect, useRef, useState } from "react";
import type { PortfolioData } from "../types/portfolio";
import { ROUTES } from "../shared/routes";
import { createRolodex, type CardFace } from "./rolodex";
import "./hub.css";

const WAYS = [
  {
    id: "game",
    verb: "Play",
    blurb: "An open world. Ride a scooter around a Greek island and bump into my résumé.",
    controls: "WASD or arrow keys. A joystick on touch.",
  },
  {
    id: "cursor",
    verb: "Move",
    blurb: "A field of particles and your cursor. Point at a section and it takes shape.",
    controls: "Move the pointer. Drag and tap on touch.",
  },
  {
    id: "scroll",
    verb: "Scroll",
    blurb: "Athens to Los Angeles as one long flight, told in ten chapters.",
    controls: "Just scroll.",
  },
  {
    id: "plain",
    verb: "Read",
    blurb: "Everything on one page, in the order a recruiter expects.",
    controls: "Nothing to learn. It prints to PDF.",
  },
] as const;

const N = WAYS.length + 1; // the name card, then the four ways
const SPEED = 0.85; // cards a second: slow enough to watch one go over
const DRAG = 240; // pixels of drag per card
const mod = (n: number) => ((n % N) + N) % N;

export default function Hub({ data }: { data: PortfolioData }) {
  const { about, contact } = data;
  const canvas = useRef<HTMLCanvasElement>(null);
  const flip = useRef<(by: number) => void>(() => {});
  const [front, setFront] = useState(0);
  // no WebGL2 (three needs it): fall back to a plain list
  const [flat] = useState(() => !document.createElement("canvas").getContext("webgl2"));
  const way = front ? WAYS[front - 1] : null;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const faces: CardFace[] = [
      { id: "name", kicker: about.title, corner: about.quickFacts.location, title: about.name, foot: "Flip the card · four ways to read my résumé" },
      ...WAYS.map((w, i) => ({
        id: w.id,
        kicker: `0${i + 1} / ${w.verb}`,
        corner: "Enter →",
        title: ROUTES[w.id].label,
        blurb: w.blurb,
        foot: w.controls,
      })),
    ];
    const rolo = createRolodex(el, faces);

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pos = 0; // which card is up, unbounded so it can go round forever
    let rest = 0; // where it last came to rest
    let target: number | null = null;
    let raf = 0;
    let last = 0;
    let idle = 0;
    let drag: { y: number; pos: number; moved: boolean } | null = null;

    const show = () => {
      rolo.set(pos);
      setFront(mod(Math.round(pos)));
    };
    const tick = (now: number) => {
      if (target === null) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const diff = target - pos;
      if (still || Math.abs(diff) < 0.001) {
        pos = rest = target;
        target = null;
      } else {
        // steady turn, easing in to land
        pos += Math.max(-SPEED, Math.min(SPEED, diff * 4)) * dt;
        raf = requestAnimationFrame(tick);
      }
      show();
    };
    const go = (to: number) => {
      target = to;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const hold = () => {
      cancelAnimationFrame(raf);
      target = null;
    };
    // a small push still turns one card; a big one lands on the nearest
    const settle = () => {
      const by = pos - rest;
      const a = Math.abs(by);
      go(a < 0.12 ? rest : a < 0.5 ? rest + Math.sign(by) : Math.round(pos));
    };
    const step = (by: number) => go(Math.round(target ?? pos) + by);
    flip.current = step;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      e.preventDefault();
      hold();
      pos += (e.deltaMode ? e.deltaY * 33 : e.deltaY) / 260;
      show();
      clearTimeout(idle);
      idle = window.setTimeout(settle, 140);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) drag = { y: e.clientY, pos, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      if (!(e.buttons & 1)) drag = null; // released somewhere else
      if (!drag) {
        if (e.pointerType !== "mouse") return;
        el.style.cursor = rolo.hit(e.clientX, e.clientY) ? "pointer" : "";
        if (!still) rolo.yaw(e.clientX / innerWidth - 0.5);
        return;
      }
      const dy = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dy) < 6) return;
        drag.moved = true;
        el.setPointerCapture(e.pointerId);
        hold();
      }
      pos = drag.pos + dy / DRAG; // pull down to flip forward
      show();
    };
    const onUp = (e: PointerEvent) => {
      const d = drag;
      drag = null;
      if (!d) return;
      if (d.moved) settle();
      else if (e.type === "pointerup" && target === null && rolo.hit(e.clientX, e.clientY)) {
        // a click on the card that is up: open it, or turn past the name card
        const i = mod(Math.round(pos));
        if (i) location.assign(ROUTES[WAYS[i - 1].id].path);
        else step(1);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const by = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!by || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      step(by);
    };

    const ro = new ResizeObserver(() => rolo.resize());
    ro.observe(el);
    rolo.resize();
    show();
    addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    addEventListener("keydown", onKey);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      removeEventListener("keydown", onKey);
      rolo.dispose();
    };
  }, [about]);

  return (
    <main className="hub" data-flat={flat || undefined}>
      <h1 className={flat ? undefined : "hub-sr"}>{about.name}</h1>

      {flat ? (
        <ul className="hub-list">
          {WAYS.map((w) => (
            <li key={w.id}>
              <a href={ROUTES[w.id].path}>{ROUTES[w.id].label} →</a>
              <span>{w.blurb}</span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <canvas ref={canvas} className="hub-canvas" aria-hidden />
          <nav className="hub-ctl" aria-label="Versions">
            <button type="button" onClick={() => flip.current(-1)} aria-label="Previous card">
              ←
            </button>
            {way ? (
              <a className="hub-go" href={ROUTES[way.id].path}>
                Enter {ROUTES[way.id].label} →
              </a>
            ) : (
              <button type="button" className="hub-go" onClick={() => flip.current(1)}>
                Flip the card ↓
              </button>
            )}
            <button type="button" onClick={() => flip.current(1)} aria-label="Next card">
              →
            </button>
          </nav>
          <p className="hub-caption" aria-live="polite">
            {way ? `${ROUTES[way.id].label}. ${way.blurb} ${way.controls}` : `${about.name}, ${about.title}. Four ways to read my résumé.`}
          </p>
        </>
      )}

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
