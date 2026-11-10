import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as RPointerEvent } from "react";
import type { PortfolioData } from "../../types/portfolio";
import { Synth } from "./audio";
import { Field, type Pointer } from "./field/Field";
import { DISPLAY_FONT, buildShapes } from "./field/shapes";
import Panel from "./Panel";
import { HOME_ACCENT, SECTIONS, isSectionId, shiftHue, type SectionId } from "./sections";
import "./cursor.css";

/*
 Debug query params:
   ?section=about|now|before|projects|skills|offhours|contact  load locked on a section, panel open
   ?pointer=x,y   (0..1 viewport fractions) simulated cursor circling there, stirring the field
   ?still=1       no intro / scramble / CSS reveals, formations snap in (deterministic screenshots)
   ?debug=1       FPS + particle counter
   ?motion=reduce force the reduced-motion path;  ?nogl=1 force the no-WebGL fallback;  ?hold=1 with ?pointer: gravity well
*/

const fmtClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

async function loadFonts() {
  const spec = `900 expanded 200px "${DISPLAY_FONT}"`;
  const until = performance.now() + 3500;
  while (performance.now() < until) {
    try {
      await document.fonts.load(spec);
      if (document.fonts.check(spec)) return;
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, 120));
  }
}

export default function CursorExperience({ data }: { data: PortfolioData }) {
  const opts = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    const sim = q.get("pointer")?.split(",").map(Number);
    const reduced = q.get("motion") === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return {
      still: q.get("still") === "1",
      debug: q.get("debug") === "1",
      reduced,
      nogl: q.get("nogl") === "1",
      hold: q.get("hold") === "1",
      sim: sim && sim.length === 2 && sim.every((n) => Number.isFinite(n)) ? (sim as [number, number]) : null,
      section: isSectionId(q.get("section")) ? (q.get("section") as SectionId) : null,
      fine: window.matchMedia("(pointer: fine)").matches,
    };
  }, []);
  const calm = opts.still || opts.reduced;

  const [locked, setLocked] = useState<SectionId | null>(opts.section);
  const [hovered, setHovered] = useState<SectionId | null>(null);
  const [hue, setHue] = useState(0);
  const [gl, setGl] = useState<"pending" | "ok" | "off">("pending");
  const [shapesReady, setShapesReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [showCount, setShowCount] = useState(0);
  const active = hovered ?? locked;

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fieldRef = useRef<Field | null>(null);
  const synth = useMemo(() => new Synth(), []);
  const pointer = useRef<Pointer>({ x: -9999, y: -9999, vx: 0, vy: 0, active: 0, down: false, downAt: 0 });
  const live = useRef({ locked, hovered, lastInput: opts.sim ? performance.now() : -1e9, moved: !!opts.sim });
  const leaveTimer = useRef(0);

  useEffect(() => {
    live.current.locked = locked;
    live.current.hovered = hovered;
  }, [locked, hovered]);

  // Mount: WebGL field, input, the single rAF loop.
  useEffect(() => {
    const root = rootRef.current!, canvas = canvasRef.current!;
    let field: Field | null = null;
    let disposed = false;
    if (!opts.nogl && Field.supported()) {
      try {
        const small = window.innerWidth < 760 || !opts.fine;
        field = new Field(canvas, { side: small ? 256 : 352, reduced: opts.reduced });
        fieldRef.current = field;
        if (opts.debug) Object.assign(window, { __cursorField: field });
        setGl("ok");
        canvas.addEventListener("webglcontextlost", () => setGl("off"), { once: true });
        loadFonts().then(() => {
          if (disposed || !field) return;
          field.setShapes(buildShapes(data, field.seeds));
          setShapesReady(true);
        });
      } catch (e) {
        console.warn("[cursor] WebGL field unavailable, falling back to DOM", e);
        field = null;
        setGl("off");
      }
    } else setGl("off");

    let W = window.innerWidth, H = window.innerHeight;
    let centers: [number, number][] = [];
    const measure = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      field?.resize(W, H);
      centers = labelRefs.current.map((b) => {
        const r = b?.getBoundingClientRect();
        return r ? [r.left + r.width / 2, r.top + r.height / 2] : [0, 0];
      });
    };
    measure();
    window.addEventListener("resize", measure);

    const p = pointer.current;
    const st = live.current;
    const isUi = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-ui], .xp-switcher");
    let downX = 0, downY = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !p.down) return;
      p.x = e.clientX;
      p.y = e.clientY;
      p.active = 1;
      st.lastInput = performance.now();
      st.moved = true;
      const t = e.target instanceof Element ? e.target : null;
      const ring = ringRef.current;
      if (ring) {
        ring.dataset.hover = t?.closest("a, button") ? "1" : "";
        ring.dataset.hidden = t?.closest(".xp-switcher") ? "1" : "";
      }
    };
    const onDown = (e: PointerEvent) => {
      st.lastInput = performance.now();
      if (isUi(e.target)) return;
      p.x = downX = e.clientX;
      p.y = downY = e.clientY;
      p.active = 1;
      p.down = true;
      p.downAt = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      const held = performance.now() - p.downAt;
      const wasDown = p.down;
      p.down = false;
      if (e.pointerType !== "mouse") p.active = 0;
      if (!wasDown) return;
      const tap = Math.hypot(e.clientX - downX, e.clientY - downY) < 8;
      if (held > 380) {
        field?.burst(e.clientX, e.clientY, 10);
        synth.whoosh();
      } else if (tap) {
        field?.shock(e.clientX, e.clientY);
        synth.whoosh();
        if (st.locked) setLocked(null);
        else setHue((h) => h + 47);
      }
    };
    const onLeave = () => {
      p.active = 0;
      p.down = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onLeave);
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    let raf = 0, last = performance.now(), lastX = p.x, lastY = p.y, ringX = p.x, ringY = p.y;
    let fpsT = 0, frames = 0, clockSec = -1, simT = 0;
    const mag: [number, number][] = [];
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (opts.sim) {
        simT += Math.min(dt, 1 / 30);
        const r = Math.min(W, H) * 0.11;
        p.x = opts.sim[0] * W + Math.cos(simT * 6.5) * r;
        p.y = opts.sim[1] * H + Math.sin(simT * 6.5) * r * 0.8;
        p.active = 1;
        if (opts.hold && !p.down) {
          p.down = true;
          p.downAt = now - 1000;
        }
      }
      if (dt > 0) {
        const k = 0.35;
        p.vx += ((p.x - lastX) / dt - p.vx) * k;
        p.vy += ((p.y - lastY) / dt - p.vy) * k;
        if (!p.active) p.vx = p.vy = 0;
      }
      lastX = p.x;
      lastY = p.y;

      // Cursor: exact dot, lagging ring; magnetic labels.
      if (dotRef.current && ringRef.current) {
        dotRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        const e = 1 - Math.exp(-dt * 16);
        ringX += (p.x - ringX) * e;
        ringY += (p.y - ringY) * e;
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        ringRef.current.dataset.hold = p.down && now - p.downAt > 160 ? "1" : "";
        ringRef.current.dataset.off = p.active ? "" : "1";
      }
      if (W >= 760 && !opts.reduced) {
        const e = 1 - Math.exp(-dt * 10);
        labelRefs.current.forEach((b, i) => {
          const inner = b?.firstElementChild as HTMLElement | null;
          if (!inner || !centers[i]) return;
          const dx = p.x - centers[i][0], dy = p.y - centers[i][1];
          const d = Math.hypot(dx, dy);
          const pull = p.active && d < 110 ? (1 - d / 110) * 0.38 : 0;
          const m = (mag[i] ??= [0, 0]);
          m[0] += (dx * pull - m[0]) * e;
          m[1] += (dy * pull - m[1]) * e;
          inner.style.transform = `translate3d(${m[0].toFixed(2)}px, ${m[1].toFixed(2)}px, 0)`;
        });
      }

      const idle = now - st.lastInput > 5000;
      root.dataset.idle = idle || !st.moved ? "1" : "";
      if (coordRef.current && p.active)
        coordRef.current.textContent = `X ${(p.x / W).toFixed(3)}  Y ${(p.y / H).toFixed(3)}`;
      const sec = Math.floor(Date.now() / 1000);
      if (sec !== clockSec && clockRef.current) {
        clockSec = sec;
        clockRef.current.textContent = fmtClock.format(new Date());
      }
      synth.speed(Math.hypot(p.vx, p.vy));

      field?.frame(dt, p, idle && !opts.still);

      frames++;
      fpsT += dt;
      if (fpsT > 0.5 && debugRef.current) {
        debugRef.current.textContent = `${Math.round(frames / fpsT)} fps · ${field ? field.count.toLocaleString() : 0} particles · ${
          live.current.hovered ?? live.current.locked ?? "home"
        }`;
        fpsT = 0;
        frames = 0;
      }
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      field?.dispose();
      fieldRef.current = null;
      synth.dispose();
    };
  }, [data, opts, synth]);

  const accent = shiftHue(active ? SECTIONS.find((s) => s.id === active)!.accent : HOME_ACCENT, hue);

  // Drive the field from section state.
  const firstTarget = useRef(true);
  useEffect(() => {
    if (!shapesReady || !fieldRef.current) return;
    fieldRef.current.setTarget(active ?? "home", !!active, accent, firstTarget.current && opts.still);
    firstTarget.current = false;
  }, [active, accent, shapesReady, opts.still]);

  useEffect(() => {
    setShowCount((n) => n + 1);
  }, [active]);

  const focusNode = useCallback((i: number) => fieldRef.current?.setFocus(i), []);

  const lockTo = useCallback(
    (id: SectionId | null, viaKeyboard = false) => {
      setLocked(id);
      if (id) synth.note(SECTIONS.findIndex((s) => s.id === id), true);
      if (id && viaKeyboard) requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    },
    [synth],
  );

  // Keyboard: arrows cycle, Esc unlocks.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const was = live.current.locked;
        setLocked(null);
        setHovered(null);
        if (was && panelRef.current?.contains(document.activeElement))
          labelRefs.current[SECTIONS.findIndex((s) => s.id === was)]?.focus();
        return;
      }
      const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!dir) return;
      const t = e.target as Element | null;
      if (t?.closest(".cx-panel-body")) return; // let arrows scroll the panel
      e.preventDefault();
      const cur = live.current.hovered ?? live.current.locked;
      const i = cur ? SECTIONS.findIndex((s) => s.id === cur) : dir > 0 ? -1 : 0;
      const next = SECTIONS[(i + dir + SECTIONS.length) % SECTIONS.length].id;
      labelRefs.current[SECTIONS.findIndex((s) => s.id === next)]?.focus();
      if (live.current.locked) lockTo(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lockTo]);

  const onLabelEnter = (id: SectionId, i: number) => (e: RPointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(leaveTimer.current);
    if (live.current.hovered !== id) synth.note(i);
    setHovered(id);
  };
  const onLabelLeave = (e: RPointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHovered(null), 160);
  };
  const onLabelClick = (id: SectionId) => (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    fieldRef.current?.shock(r.left + r.width / 2, r.top + r.height / 2);
    setHovered(null);
    lockTo(live.current.locked === id ? null : id, e.detail === 0);
  };

  const idx = active ? SECTIONS.findIndex((s) => s.id === active) + 1 : 0;
  const panelLive = !!locked && active === locked;

  return (
    <div
      ref={rootRef}
      className={`cx-root${opts.fine || opts.sim ? " cx-fine" : ""}${calm ? " cx-calm" : ""}`}
      data-gl={gl}
      data-active={active ?? ""}
      data-open={active ? "1" : ""}
      data-locked={locked ? "1" : ""}
      style={{ "--accent": accent } as CSSProperties}
    >
      <canvas ref={canvasRef} className="cx-canvas" aria-hidden="true" />

      <h1 className="cx-wordmark">
        <span className="cx-wordmark-big">HATZO</span>
        <span className="cx-sr">
          {data.about.name}, {data.about.title}
        </span>
      </h1>

      <header className="cx-top" data-ui>
        <p className="cx-brand">
          <span className="cx-brand-name">{data.about.name}</span>
          <span className="cx-meta">{data.about.title}</span>
        </p>
        <p className="cx-readout cx-meta" aria-hidden="true">
          <span>34.0522° N · 118.2437° W</span>
          <span ref={coordRef}>X 0.500  Y 0.500</span>
        </p>
        <p className="cx-clock cx-meta">
          <span>Los Angeles</span> <span ref={clockRef}>{fmtClock.format(new Date())}</span>
        </p>
      </header>

      <nav className="cx-nav" aria-label="Sections" data-ui>
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            type="button"
            className="cx-label"
            style={{ "--x": s.pos[0], "--y": s.pos[1], "--c": shiftHue(s.accent, hue) } as CSSProperties}
            aria-controls={`cx-sec-${s.id}`}
            aria-expanded={locked === s.id}
            aria-current={active === s.id ? "true" : undefined}
            onPointerEnter={onLabelEnter(s.id, i)}
            onPointerLeave={onLabelLeave}
            onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHovered(s.id)}
            onBlur={() => setHovered((h) => (h === s.id ? null : h))}
            onClick={onLabelClick(s.id)}
          >
            <span className="cx-label-inner">
              <span className="cx-label-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="cx-label-text">{s.label}</span>
            </span>
          </button>
        ))}
      </nav>

      <aside
        ref={panelRef}
        className="cx-panel"
        data-ui
        data-live={panelLive ? "1" : ""}
        tabIndex={-1}
        aria-label={active ? SECTIONS[idx - 1].label : "Section"}
      >
        {panelLive && (
          <button type="button" className="cx-close" onClick={() => lockTo(null)} aria-label="Close section (Esc)">
            <span>Close</span>
            <kbd>Esc</kbd>
          </button>
        )}
        {SECTIONS.map((s) => (
          <section
            key={s.id === active ? `${s.id}-${showCount}` : s.id}
            id={`cx-sec-${s.id}`}
            className="cx-section"
            hidden={s.id !== active}
            aria-labelledby={`cx-h-${s.id}`}
          >
            <Panel id={s.id} data={data} still={calm || s.id !== active} onFocusNode={focusNode} />
          </section>
        ))}
      </aside>

      <footer className="cx-bottom" data-ui>
        <div className="cx-bottom-left">
          <button
            type="button"
            className="cx-chip"
            aria-pressed={sound}
            onClick={async () => setSound(await synth.toggle())}
          >
            <span className="cx-eq" aria-hidden="true" data-on={sound ? "1" : ""}>
              <i />
              <i />
              <i />
            </span>
            Sound {sound ? "on" : "off"}
          </button>
          <a className="cx-chip" href="/plain">
            Plain version ↗
          </a>
        </div>
        <p className="cx-hint cx-meta" aria-hidden="true">
          {gl !== "ok" || opts.reduced
            ? "Pick a chapter"
            : opts.fine
              ? "Move to stir · Hold to gather · Click to shock"
              : "Drag to stir · Tap a chapter"}
        </p>
        <p className="cx-index cx-meta" aria-hidden="true">
          <span className="cx-index-cur">{String(idx).padStart(2, "0")}</span> / {String(SECTIONS.length).padStart(2, "0")}
        </p>
      </footer>

      <div className="cx-cursor" aria-hidden="true">
        <div ref={ringRef} className="cx-ring" />
        <div ref={dotRef} className="cx-dot" />
      </div>
      {opts.debug && <div ref={debugRef} className="cx-debug" />}
    </div>
  );
}
