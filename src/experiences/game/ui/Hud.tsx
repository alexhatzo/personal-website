import { useEffect, useRef, type RefObject } from "react";
import type { PortfolioData } from "../../../types/portfolio";
import { PLACES, PLACE, ROADS, type PlaceId } from "../engine/places";
import { height } from "../engine/terrain";
import type { Progress } from "../engine/progress";
import type { MapState, Toast } from "../engine/Game";

const SPAN = 240; // world meters shown across the map

function useMinimap(mapRef: RefObject<MapState>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const size = c.clientWidth;
    c.width = size * dpr;
    c.height = size * dpr;
    const ctx = c.getContext("2d")!;
    // bake the island once
    const base = document.createElement("canvas");
    base.width = base.height = 120;
    const b = base.getContext("2d")!;
    const img = b.createImageData(120, 120);
    for (let j = 0; j < 120; j++)
      for (let i = 0; i < 120; i++) {
        const x = (i / 119 - 0.5) * SPAN;
        const z = (j / 119 - 0.5) * SPAN;
        const h = height(x, z);
        const k = (j * 120 + i) * 4;
        const [r, g, bl, a] = h < 0 ? [0, 0, 0, 0] : h < 1.2 ? [240, 220, 170, 255] : [210 - h * 4, 196 - h * 2, 120 - h * 2, 255];
        img.data.set([r, g, bl, a], k);
      }
    b.putImageData(img, 0, 0);
    const toPx = (x: number, z: number): [number, number] => [(x / SPAN + 0.5) * size, (z / SPAN + 0.5) * size];
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#3aa9c4";
      ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(base, 0, 0, size, size);
      ctx.strokeStyle = "rgba(255,248,236,0.85)";
      ctx.lineWidth = 1.6;
      for (const r of ROADS) {
        ctx.beginPath();
        r.forEach(([x, z], i) => {
          const [px, py] = toPx(x, z);
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        });
        ctx.stroke();
      }
      for (const p of PLACES) {
        const [px, py] = toPx(p.mx, p.mz);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = "#1b2340";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      const m = mapRef.current;
      const [px, py] = toPx(m.x, m.z);
      ctx.translate(px, py);
      ctx.rotate(-m.yaw);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#1b2340";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5.5, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5.5, 6);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [mapRef]);
  return canvas;
}

export default function Hud({
  data,
  progress,
  near,
  toasts,
  mapRef,
  muted,
  night,
  touch,
  music,
  onMusic,
  onJournal,
  onSkills,
  onMute,
  onNight,
  onInteract,
}: {
  data: PortfolioData;
  progress: Progress | null;
  near: PlaceId | null;
  toasts: (Toast & { id: number })[];
  mapRef: RefObject<MapState>;
  muted: boolean;
  night: boolean;
  touch: boolean;
  music: boolean;
  onMusic: () => void;
  onJournal: () => void;
  onSkills: () => void;
  onMute: () => void;
  onNight: () => void;
  onInteract: () => void;
}) {
  const map = useMinimap(mapRef);
  const total = data.skills.categories.reduce((a, c) => a + c.skills.length, 0);
  const nearPlace = near ? PLACE[near] : null;
  return (
    <>
      <div className="hz-hud-tl">
        <button className="hz-map" onClick={onJournal} aria-label="Open the island guide">
          <canvas ref={map} />
          <span className="hz-map__n" aria-hidden>
            N
          </span>
        </button>
        <div className="hz-counters">
          <button className="hz-pill" onClick={onSkills}>
            <span className="hz-coin" aria-hidden />
            <b>{progress?.skills.length ?? 0}</b>&nbsp;/ {total} skills
          </button>
          <button className="hz-pill" onClick={onJournal}>
            <b>{progress?.visited.length ?? 0}</b>&nbsp;/ {PLACES.length} places
          </button>
        </div>
      </div>

      <div className="hz-hud-br" role="toolbar" aria-label="Game menu">
        {music && (
          <button className="hz-tool hz-tool--music" onClick={onMusic} aria-label="Pause the DJ set">
            <span className="hz-eq" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span>Pause set</span>
          </button>
        )}
        <button className="hz-tool" onClick={onJournal}>
          <span>Guide</span>
          {!touch && <kbd>J</kbd>}
        </button>
        <button className="hz-tool" onClick={onNight} aria-pressed={night}>
          <span>{night ? "Day" : "Night"}</span>
          {!touch && <kbd>N</kbd>}
        </button>
        <button className="hz-tool" onClick={onMute} aria-pressed={muted}>
          <span>{muted ? "Sound off" : "Sound on"}</span>
          {!touch && <kbd>M</kbd>}
        </button>
      </div>

      {!touch && (
        <p className="hz-hint" aria-hidden>
          <kbd>WASD</kbd> ride · <kbd>Shift</kbd> boost · <kbd>Space</kbd> jump · <kbd>H</kbd> horn
        </p>
      )}

      {nearPlace && !touch && (
        <button className="hz-prompt" onClick={onInteract} style={{ ["--accent" as string]: nearPlace.color }}>
          <kbd>E</kbd>
          <span>
            <small>Open</small>
            <b>{nearPlace.name}</b>
          </span>
        </button>
      )}

      <div className="hz-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`hz-toast hz-toast--${t.kind}`} style={{ ["--accent" as string]: t.color ?? "#f2c14e" }}>
            <small>{t.kind === "ach" ? "Achievement unlocked" : t.kind === "skill" ? "Skill collected" : t.kind === "place" ? "Discovered" : "Heads up"}</small>
            <b>{t.title}</b>
            {t.body && <span>{t.body}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
