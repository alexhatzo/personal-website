import { useEffect, useRef } from "react";
import type { PortfolioData } from "../../../types/portfolio";

const KEYS: [string[], string][] = [
  [["W", "A", "S", "D"], "Ride (or arrows)"],
  [["Shift"], "Boost"],
  [["Space"], "Jump"],
  [["E"], "Open a place"],
  [["J"], "Guide & teleport"],
  [["H"], "Horn"],
  [["N"], "Day / night"],
  [["M"], "Mute"],
];

export default function Intro({
  data,
  loading,
  ready,
  touch,
  onStart,
  onGuide,
}: {
  data: PortfolioData;
  loading: { pct: number; label: string };
  ready: boolean;
  touch: boolean;
  onStart: () => void;
  onGuide: () => void;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (ready) btn.current?.focus();
  }, [ready]);
  return (
    <section className="hz-intro" aria-labelledby="hz-intro-title">
      <div className="hz-intro__card">
        <p className="hz-stamp">Καλώς ήρθατε · Welcome</p>
        <h1 id="hz-intro-title" className="hz-intro__title">
          Hatzo <span>Island</span>
        </h1>
        <p className="hz-intro__lede">
          {data.about.name}'s résumé, built as a small Greek island. Hop on the scooter and ride between the places where the work happened.
        </p>
        <p className="hz-intro__role">{data.about.title}</p>

        {touch ? (
          <ul className="hz-controls hz-controls--touch">
            <li>
              <span className="hz-pad">◎</span> Left thumb: joystick. Push where you want to go
            </li>
            <li>
              <span className="hz-pad">◆</span> Ride up to a glowing marker, then tap <b>Open</b>
            </li>
            <li>
              <span className="hz-pad">☰</span> <b>Guide</b> lists every place and teleports you there
            </li>
          </ul>
        ) : (
          <ul className="hz-controls">
            {KEYS.map(([keys, label]) => (
              <li key={label}>
                <span className="hz-keys">
                  {keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </span>
                {label}
              </li>
            ))}
          </ul>
        )}

        <div className="hz-intro__actions">
          <button ref={btn} className="hz-btn hz-btn--primary" onClick={onStart} disabled={!ready}>
            {ready ? "Hop on the scooter" : `${loading.label}… ${Math.round(loading.pct)}%`}
            {!ready && <span className="hz-btn__bar" style={{ transform: `scaleX(${loading.pct / 100})` }} />}
          </button>
          <button className="hz-btn hz-btn--ghost" onClick={onGuide} disabled={!ready}>
            Browse the guide instead
          </button>
        </div>
        <a className="hz-intro__plain" href="/plain">
          Just show me the résumé →
        </a>
      </div>
      <p className="hz-intro__hint" aria-hidden>
        sound on · best with headphones
      </p>
    </section>
  );
}
