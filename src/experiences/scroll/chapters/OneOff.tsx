import type { PortfolioData } from "../../../types/portfolio";
import { hostOf, job, pad, projectsIn } from "../state";

export default function OneOff({ data }: { data: PortfolioData }) {
  const oo = job(data, "job-oneoff");
  if (!oo) return null;
  const lede = oo.summary ?? projectsIn(data, "Work").find((p) => p.title === oo.company)?.description;
  const city = (oo.location ?? data.about.quickFacts.location).split(",")[0];
  const [since] = oo.period.split(" - ");

  return (
    <section className="ch ch-oneoff" data-ch="5" aria-labelledby="h-oneoff">
      <div className="oo-stage">
        <div className="oo-sunset" aria-hidden="true">
          <div className="oo-sun" />
          <div className="oo-haze" />
          <p className="oo-approach">Final approach · LAX · 33.94° N</p>
          <p className="oo-city">{city}</p>
        </div>

        <div className="oo-paper">
          <header className="oo-mast">
            <span>N° 05 · The present</span>
            <span>{oo.location}</span>
            <span className="oo-now">
              <i aria-hidden="true" />
              Now · since {since}
            </span>
          </header>

          <div className="oo-grid">
            <div className="oo-left">
              <h2 id="h-oneoff" className="oo-title">
                {oo.company}
              </h2>
              <p className="oo-role">
                {oo.role} <span>{oo.period}</span>
              </p>
              {lede && <p className="oo-lede">{lede}</p>}
              {oo.url && (
                <a className="oo-link" href={oo.url} target="_blank" rel="noreferrer">
                  {hostOf(oo.url)} <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>

            <div className="oo-rail">
              <div className="oo-bar" aria-hidden="true" />
              <ol className="oo-cards">
                {oo.description.map((d, i) => (
                  <li className="garment" key={d}>
                    <span className="garment-hook" aria-hidden="true" />
                    <span className="garment-n">{pad(i + 1)}</span>
                    <p>{d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="oo-ticker">
            <div className="oo-ticker-track">
              <ul aria-label={`${oo.company} tech`}>
                {oo.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <ul aria-hidden="true">
                {oo.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
