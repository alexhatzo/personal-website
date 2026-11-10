import type { PortfolioData } from "../../../types/portfolio";
import { Plane } from "../bits";

const MARK = "HATZO";

// Deterministic barcode from the passenger name.
function Barcode({ seed }: { seed: string }) {
  let x = 0;
  const bars = Array.from(seed).map((c) => {
    const n = c.charCodeAt(0);
    const w = 1 + (n % 3);
    const r = { x, w };
    x += w + 1 + ((n >> 2) % 3);
    return r;
  });
  return (
    <svg className="pass-barcode" viewBox={`0 0 ${x} 10`} preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} width={b.w} height="10" />
      ))}
    </svg>
  );
}

export default function Boarding({ data }: { data: PortfolioData }) {
  const { about } = data;
  const words = about.name.split(" ");
  const last = (words.pop() ?? "").toUpperCase();
  const first = words.join(" ").toUpperCase();
  const split = last.startsWith(MARK);
  const { hometown, location } = about.quickFacts;

  return (
    <section className="ch ch-board" data-ch="0" aria-label="Boarding">
      <div className="board-stage">
        <p className="board-kicker">
          <span>Flight AH 2018</span>
          <span>
            {hometown.split(",")[0]} → {location.split(",")[0]}
          </span>
          <span className="board-now">
            <i aria-hidden="true" />
            Now boarding
          </span>
        </p>

        <h1 className="board-name" aria-label={about.name}>
          <span className="board-first" aria-hidden="true">
            {first}
          </span>
          <span className="board-last" aria-hidden="true">
            <span className="board-hatzo">{split ? MARK : last}</span>
            {split && <span className="board-rest">{last.slice(MARK.length)}</span>}
          </span>
        </h1>

        <p className="board-sub">
          The scroll bar is the flight. Ten chapters, {hometown.split(",")[0]} to {location.split(",")[0]}.
        </p>

        <div className="pass" role="group" aria-label="Boarding pass">
          <div className="pass-main">
            <div className="pass-row">
              <div className="pass-field">
                <span>Passenger</span>
                <strong>
                  {last} / {first}
                </strong>
              </div>
              <div className="pass-field">
                <span>Class</span>
                <strong>{about.title}</strong>
              </div>
            </div>
            <div className="pass-route">
              <div className="pass-city">
                <b>ATH</b>
                <span>{hometown}</span>
              </div>
              <div className="pass-path" aria-hidden="true">
                <i />
                <Plane className="pass-plane" />
                <i />
              </div>
              <div className="pass-city pass-city--to">
                <b>LAX</b>
                <span>{location}</span>
              </div>
            </div>
            <div className="pass-row pass-row--small" aria-hidden="true">
              <span>Flight AH 2018</span>
              <span>Gate A1</span>
              <span>Seat 1A</span>
              <span>Boarding now</span>
            </div>
          </div>
          <div className="pass-stub" aria-hidden="true">
            <span className="pass-stub-route">ATH → LAX</span>
            <span>Seat 1A · Gate A1</span>
            <Barcode seed={`${about.name}ATHLAX2018`} />
          </div>
        </div>

        <p className="board-cue">
          Scroll to board <span aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
