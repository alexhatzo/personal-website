import type { PortfolioData } from "../../../types/portfolio";
import { Kicker } from "../bits";

export default function Toolkit({ data }: { data: PortfolioData }) {
  const { categories, currentlyLearning } = data.skills;
  return (
    <section className="ch ch-tools" data-ch="7" aria-labelledby="h-tools">
      <header className="tools-head" data-r>
        <Kicker n={7}>Carry-on</Kicker>
        <h2 id="h-tools" className="tools-title">
          Toolkit
        </h2>
        <p className="tools-sub">Scroll faster. The belts keep up.</p>
      </header>
      <div className="rows">
        {categories.map((c, i) => (
          <div className={`row row--${i % 2 ? "out" : "fill"}`} key={c.name}>
            <h3 className="row-label">
              <span>{String(i + 1).padStart(2, "0")}</span> {c.name}
            </h3>
            <div className="row-view">
              <div className="row-track">
                <ul className="row-list">
                  {c.skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <ul className="row-list row-list--dup" aria-hidden="true">
                  {c.skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="learning" data-r>
        <p className="learning-k">Currently learning</p>
        <p className="learning-text">{currentlyLearning}</p>
      </div>
    </section>
  );
}
