import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PortfolioData } from "../../types/portfolio";
import { Game, type MapState, type Toast } from "./engine/Game";
import { PLACES, type PlaceId } from "./engine/places";
import type { Progress } from "./engine/progress";
import Intro from "./ui/Intro";
import Panel from "./ui/Panel";
import Journal from "./ui/Journal";
import Hud from "./ui/Hud";
import Touch from "./ui/Touch";
import "./game.css";

const params = new URLSearchParams(window.location.search);
const SPOT = PLACES.find((p) => p.id === params.get("spot"))?.id ?? null;
const OVERVIEW = params.get("cam") === "overview";
const AUTOSTART = params.get("autostart") === "1" || !!SPOT || OVERVIEW;

export default function Experience({ data }: { data: PortfolioData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [loading, setLoading] = useState({ pct: 0, label: "Loading" });
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [panel, setPanel] = useState<PlaceId | null>(null);
  const [journal, setJournal] = useState(false);
  const [near, setNear] = useState<PlaceId | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [toasts, setToasts] = useState<(Toast & { id: number })[]>([]);
  const [music, setMusic] = useState(false);
  const [muted, setMuted] = useState(false);
  const [night, setNight] = useState(params.get("time") === "night");
  const mapRef = useRef<MapState>({ x: 0, z: 78, yaw: 0 });
  const touch = useMemo(() => window.matchMedia("(pointer: coarse)").matches, []);
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  // keep the latest UI state reachable from game key callbacks
  const ui = useRef({ panel, journal, started, ready });
  useEffect(() => {
    ui.current = { panel, journal, started, ready };
  }, [panel, journal, started, ready]);

  const pushToast = useCallback((t: Toast) => {
    const id = Math.random();
    setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.kind === "ach" ? 4200 : 2800);
  }, []);

  const openPanel = useCallback((id: PlaceId) => {
    setJournal(false);
    setPanel(id);
    gameRef.current?.openedPanel(id);
  }, []);

  const begin = useCallback((thenJournal = false) => {
    const g = gameRef.current;
    if (!g) return;
    g.start();
    setStarted(true);
    if (thenJournal) setJournal(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (params.get("reset") === "1") {
      try {
        localStorage.removeItem("hatzo-island-v1");
      } catch {
        /* ignore */
      }
    }
    const game = new Game(
      canvas,
      data,
      {
        onLoad: (pct, label) => setLoading({ pct, label }),
        onReady: () => setReady(true),
        onNear: setNear,
        onProgress: setProgress,
        onToast: pushToast,
        onMusic: setMusic,
        onInteract: (id) => openPanel(id),
        onMap: (s) => (mapRef.current = s),
        onKey: (code) => {
          const s = ui.current;
          if (!s.ready) return;
          if (code === "Escape") {
            if (s.panel) setPanel(null);
            else if (s.journal) setJournal(false);
            return;
          }
          if (!s.started) return;
          if (code === "KeyJ" || code === "KeyG") {
            setPanel(null);
            setJournal((j) => !j);
          }
          if (code === "KeyM") setMuted((m) => !m);
          if (code === "KeyN") setNight((n) => !n);
        },
      },
      { night: params.get("time") === "night", overview: OVERVIEW, reducedMotion: reduced, mobile: touch || window.innerWidth < 700 },
    );
    gameRef.current = game;
    if (import.meta.env.DEV) (window as unknown as { __hz: Game }).__hz = game; // e2e/debug handle
    game.init().then(() => {
      if (!gameRef.current) return;
      setMuted(game.sound.muted);
      if (AUTOSTART) {
        game.start(true);
        setStarted(true);
        if (SPOT) {
          game.teleport(SPOT);
          if (params.get("panel") === "1") openPanel(SPOT);
        }
        if (params.get("journal") === "1") setJournal(true);
      }
    });
    return () => {
      gameRef.current = null;
      game.dispose();
    };
  }, [data, openPanel, pushToast, reduced, touch]);

  useEffect(() => gameRef.current?.setPaused(!!panel || journal || !started), [panel, journal, started]);
  useEffect(() => gameRef.current?.setNight(night), [night]);
  useEffect(() => {
    if (ready) gameRef.current?.setMuted(muted);
  }, [muted, ready]);

  const travel = (id: PlaceId) => {
    gameRef.current?.teleport(id);
    openPanel(id);
  };
  const nextOf = (id: PlaceId, dir: 1 | -1) => PLACES[(PLACES.findIndex((p) => p.id === id) + dir + PLACES.length) % PLACES.length].id;

  return (
    <div
      className={`hz ${touch ? "hz--touch" : ""} ${night ? "hz--night" : ""}`}
      onClickCapture={(e) => (e.target as HTMLElement).closest("button") && gameRef.current?.sound.click()}
    >
      <canvas ref={canvasRef} className="hz-canvas" aria-label="3D island you can drive around. Use the Guide button for a list of every place." />
      <div className="hz-vignette" aria-hidden />
      {started && !OVERVIEW && (
        <Hud
          data={data}
          progress={progress}
          near={panel || journal ? null : near}
          toasts={toasts}
          mapRef={mapRef}
          muted={muted}
          night={night}
          touch={touch}
          music={music}
          onMusic={() => gameRef.current?.toggleMusic()}
          onJournal={() => {
            setPanel(null);
            setJournal(true);
          }}
          onSkills={() => openPanel("skills")}
          onMute={() => setMuted((m) => !m)}
          onNight={() => setNight((n) => !n)}
          onInteract={() => gameRef.current?.interact()}
        />
      )}
      {started && touch && !panel && !journal && !OVERVIEW && (
        <Touch
          near={near}
          onJoy={(x, y, a) => gameRef.current?.setJoystick(x, y, a)}
          onJump={() => gameRef.current?.jump()}
          onHorn={() => gameRef.current?.horn()}
          onInteract={() => gameRef.current?.interact()}
        />
      )}
      {!started && <Intro data={data} loading={loading} ready={ready} touch={touch} onStart={() => begin(false)} onGuide={() => begin(true)} />}
      {panel && progress && (
        <Panel
          id={panel}
          data={data}
          progress={progress}
          music={music}
          onToggleMusic={() => gameRef.current?.toggleMusic()}
          onClose={() => setPanel(null)}
          onNext={() => travel(nextOf(panel, 1))}
          onPrev={() => travel(nextOf(panel, -1))}
        />
      )}
      {journal && progress && (
        <Journal
          progress={progress}
          data={data}
          onClose={() => setJournal(false)}
          onGo={travel}
          onReset={() => gameRef.current?.resetProgress()}
        />
      )}
    </div>
  );
}
