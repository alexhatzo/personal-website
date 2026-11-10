import { useEffect, useRef, useState } from "react";
import type { PortfolioData } from "../../../types/portfolio";
import { PLACES, type PlaceId } from "../engine/places";
import { ACHIEVEMENTS, type Progress } from "../engine/progress";

export default function Journal({
  progress,
  data,
  onClose,
  onGo,
  onReset,
}: {
  progress: Progress;
  data: PortfolioData;
  onClose: () => void;
  onGo: (id: PlaceId) => void;
  onReset: () => void;
}) {
  const first = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => first.current?.focus(), []);
  const total = data.skills.categories.reduce((a, c) => a + c.skills.length, 0);
  return (
    <div className="hz-panel-wrap hz-panel-wrap--center" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="hz-journal" role="dialog" aria-modal="true" aria-labelledby="hz-journal-title">
        <header className="hz-panel__head">
          <p className="hz-eyebrow">Island guide</p>
          <h2 id="hz-journal-title">Where to?</h2>
          <button className="hz-x" onClick={onClose} aria-label="Close guide (Esc)">
            ✕
          </button>
        </header>
        <div className="hz-journal__grid">
          <nav aria-label="Places">
            <ol className="hz-places">
              {PLACES.map((p, i) => {
                const seen = progress.visited.includes(p.id);
                return (
                  <li key={p.id}>
                    <button ref={i === 0 ? first : undefined} onClick={() => onGo(p.id)} style={{ ["--accent" as string]: p.color }}>
                      <span className="hz-places__n">{String(i + 1).padStart(2, "0")}</span>
                      <span className="hz-places__t">
                        <b>{p.name}</b>
                        <small>{p.tagline}</small>
                      </span>
                      <span className={`hz-places__seen ${seen ? "is-on" : ""}`} aria-label={seen ? "visited" : "not visited yet"}>
                        {seen ? "✓" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <aside>
            <div className="hz-stats">
              <div>
                <b>{progress.visited.length}</b>
                <span>/ {PLACES.length} places</span>
              </div>
              <div>
                <b>{progress.skills.length}</b>
                <span>/ {total} skills</span>
              </div>
              <div>
                <b>{progress.ach.length}</b>
                <span>/ {ACHIEVEMENTS.length} badges</span>
              </div>
            </div>
            <h3 className="hz-h3">Achievements</h3>
            <ul className="hz-ach">
              {ACHIEVEMENTS.map((a) => {
                const on = progress.ach.includes(a.id);
                return (
                  <li key={a.id} className={on ? "is-on" : ""}>
                    <span className="hz-ach__medal" aria-hidden>
                      {on ? "★" : "☆"}
                    </span>
                    <span>
                      <b>{a.name}</b>
                      <small>{a.desc}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="hz-journal__foot">
              <a href="/plain">Plain résumé →</a>
              {confirm ? (
                <button
                  className="hz-link"
                  onClick={() => {
                    onReset();
                    setConfirm(false);
                  }}
                >
                  Really reset?
                </button>
              ) : (
                <button className="hz-link" onClick={() => setConfirm(true)}>
                  Reset progress
                </button>
              )}
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
