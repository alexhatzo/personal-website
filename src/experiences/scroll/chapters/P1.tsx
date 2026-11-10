import type { PortfolioData } from "../../../types/portfolio";
import { Chips, Hl, Kicker } from "../bits";
import { firstMetric, job, pad, projectsIn } from "../state";

export default function P1({ data }: { data: PortfolioData }) {
  const p1 = job(data, "job-p1");
  const oneoff = job(data, "job-oneoff")?.company;
  if (!p1) return null;
  const cargo = projectsIn(data, "Work").filter((p) => p.title !== oneoff);
  const n = p1.description.length;

  return (
    <section className="ch ch-p1" data-ch="4" aria-labelledby="h-p1">
      <div className="p1-steps">
        <div className="clouds" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <header className="p1-head">
          <Kicker n={4}>Cruising altitude</Kicker>
          <h2 id="h-p1" className="p1-company">
            {p1.company}
          </h2>
          <p className="p1-role">{p1.role}</p>
          <p className="p1-meta">
            {p1.period}
            {p1.location && <> · {p1.location}</>}
          </p>
          <Chips items={p1.tech} className="p1-tech" />
        </header>
        <ol className="p1-list">
          {p1.description.map((d, i) => {
            const m = firstMetric(d);
            return (
              <li className="p1-step" key={d}>
                <p className={`p1-big${m ? "" : " p1-big--index"}`} aria-hidden="true">
                  {m ?? pad(i + 1)}
                </p>
                <p className="p1-text">
                  <Hl text={d} />
                </p>
                <p className="p1-count" aria-hidden="true">
                  {pad(i + 1)} / {pad(n)}
                </p>
              </li>
            );
          })}
        </ol>
        <div className="p1-prog" aria-hidden="true">
          <i />
        </div>
      </div>

      {cargo.length > 0 && (
        <div className="p1-gallery">
          <div className="p1-track">
            <header className="p1-intro">
              <p className="p1-intro-k">Cargo manifest</p>
              <h3 className="p1-intro-title">Shipped at {p1.company}</h3>
              <p className="p1-intro-sub">
                {cargo.length} containers · {p1.period}
              </p>
            </header>
            {cargo.map((p, i) => (
              <article className="crate" key={p.title}>
                <header className="crate-top" aria-hidden="true">
                  <span>P1TU {pad(i + 1, 6)}</span>
                  <span>{pad(i + 1)} / {pad(cargo.length)}</span>
                </header>
                <h4 className="crate-title">{p.title}</h4>
                <p className="crate-desc">{p.description}</p>
                <Chips items={p.tech} />
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
