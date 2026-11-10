import { Plane } from "./bits";
import { pad, type ChapterMeta } from "./state";

// Fixed flight HUD. Values are written imperatively by journey.ts (data-hud hooks), never by React.
export default function Hud({ chapters }: { chapters: ChapterMeta[] }) {
  return (
    <>
      <div className="hud-top">
        <a className="hud-mark" href="/" aria-label="All versions">
          HATZO
        </a>
        <span className="hud-flight" aria-hidden="true">
          AH 2018 · ATH—LAX
        </span>
        <a className="hud-plain" href="/plain">
          Plain résumé <span aria-hidden="true">↗</span>
        </a>
      </div>

      <nav className="hud" aria-label="Chapters">
        <p className="hud-ch" aria-hidden="true">
          <span data-hud="num">00</span>
          <span data-hud="title">{chapters[0].title}</span>
        </p>
        <div className="hud-route">
          <span className="hud-code">ATH</span>
          <div className="hud-line">
            <div className="hud-fill" data-hud="fill" />
            {chapters.map((c, i) => (
              <button
                type="button"
                key={c.title}
                className="hud-tick"
                data-goto={i}
                style={{ left: `${(i / (chapters.length - 1)) * 100}%` }}
                aria-label={`Chapter ${pad(i)}: ${c.title}`}
                title={`${pad(i)} ${c.title}`}
              >
                <i />
              </button>
            ))}
            <div className="hud-plane" data-hud="plane">
              <Plane />
            </div>
          </div>
          <span className="hud-code">LAX</span>
        </div>
        <p className="hud-stats" aria-hidden="true">
          <span>
            <span data-hud="km">0</span> km
          </span>
          <span data-hud="year">2018</span>
        </p>
      </nav>
    </>
  );
}
