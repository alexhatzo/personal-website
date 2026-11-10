import type { PortfolioData, QuickFacts } from "../../../types/portfolio";
import { Kicker } from "../bits";

const FACT_LABELS: [keyof QuickFacts, string][] = [
  ["hometown", "Hometown"],
  ["location", "Based in"],
  ["education", "Education"],
  ["status", "Status"],
  ["funFact", "Fun fact"],
];

// Greek key: square spirals on a baseline, one path so it can be drawn on scroll.
function meander(units: number) {
  const s = 24, gap = 6, h = 24;
  let d = `M0 ${h}H${units * (s + gap)}`;
  for (let i = 0; i < units; i++) {
    const x = i * (s + gap) + gap / 2;
    d += `M${x} ${h}V0H${x + s}V${h - 6}H${x + 6}V6H${x + s - 6}V${h - 12}H${x + 12}`;
  }
  return { d, w: units * (s + gap), h };
}
const KEY = meander(40);

export default function Athens({ data }: { data: PortfolioData }) {
  const { about } = data;
  const city = about.quickFacts.hometown.split(",")[0];
  return (
    <section className="ch ch-athens" data-ch="1" aria-labelledby="h-athens">
      <header className="ath-head">
        <Kicker n={1}>Departure city</Kicker>
        <h2 id="h-athens" className="ath-title">
          {city}
        </h2>
        <p className="ath-coords">37.98° N · 23.73° E · {about.quickFacts.hometown}</p>
      </header>

      <svg className="meander" viewBox={`-2 -2 ${KEY.w + 4} ${KEY.h + 4}`} preserveAspectRatio="xMinYMid slice" aria-hidden="true">
        <path d={KEY.d} />
      </svg>

      <div className="ath-body">
        <div className="ath-bio">
          <p className="ath-label">The passenger</p>
          {about.bio.map((p) => (
            <p className="ath-line" key={p}>
              {p}
            </p>
          ))}
        </div>

        <ul className="stamps" aria-label="Quick facts">
          {FACT_LABELS.map(([k, label], i) => (
            <li className={`stamp stamp--${i}`} key={k}>
              <span className="stamp-label">{label}</span>
              <span className="stamp-value">{about.quickFacts[k]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
