import type { PortfolioData } from "../../../types/portfolio";
import { Chips, Kicker } from "../bits";
import { hostOf, pad, projectsIn } from "../state";

export default function SideQuests({ data }: { data: PortfolioData }) {
  const quests = projectsIn(data, "Personal");
  return (
    <section className="ch ch-side" data-ch="6" aria-labelledby="h-side">
      <div className="side-pin">
        <div className="side-track">
          <header className="side-intro">
            <Kicker n={6}>After hours</Kicker>
            <h2 id="h-side" className="side-title">
              Side <em>quests</em>
            </h2>
            <p className="side-sub">{quests.length} things built because they should exist.</p>
          </header>
          {quests.map((p, i) => (
            <article className="quest" key={p.title} style={{ zIndex: i + 1 }}>
              <p className="quest-n" aria-hidden="true">
                SQ—{pad(i + 1)}
              </p>
              <h3 className="quest-title">{p.title}</h3>
              <p className="quest-desc">{p.description}</p>
              <Chips items={p.tech} />
              {(p.github ?? p.link) && (
                <a className="quest-link" href={p.github ?? p.link} target="_blank" rel="noreferrer">
                  {hostOf(p.github ?? p.link ?? "")} <span aria-hidden="true">↗</span>
                </a>
              )}
            </article>
          ))}
        </div>
        <div className="side-progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}
