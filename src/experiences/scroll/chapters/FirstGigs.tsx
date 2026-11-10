import type { PortfolioData } from "../../../types/portfolio";
import { Chips, Hl, Kicker } from "../bits";

export default function FirstGigs({ data }: { data: PortfolioData }) {
  // Everything before P1, oldest first.
  const early = data.experience.filter((e) => e.id !== "job-p1" && e.id !== "job-oneoff").reverse();
  return (
    <section className="ch ch-gigs" data-ch="2" aria-labelledby="h-gigs">
      <header className="gigs-head" data-r>
        <Kicker n={2}>Short hops</Kicker>
        <h2 id="h-gigs" className="gigs-title">
          First gigs
        </h2>
        <p className="gigs-lede">Short hops before the long haul: early web and e-commerce work.</p>
      </header>
      <ol className="gigs">
        {early.map((j) => (
          <li className="tag" key={j.id}>
            <span className="tag-hole" aria-hidden="true" />
            <p className="tag-period">{j.period}</p>
            <h3 className="tag-company">{j.company}</h3>
            <p className="tag-role">
              {j.role}
              {j.location && <span> · {j.location}</span>}
            </p>
            <ul className="tag-list">
              {j.description.map((d) => (
                <li key={d}>
                  <Hl text={d} />
                </li>
              ))}
            </ul>
            <Chips items={j.tech} />
          </li>
        ))}
      </ol>
    </section>
  );
}
