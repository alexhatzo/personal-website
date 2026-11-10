import type { CSSProperties, ReactNode } from "react";
import type { Experience, PortfolioData, Project } from "../../types/portfolio";
import Scramble from "./Scramble";
import { SECTIONS, lifeCategory, type SectionId } from "./sections";

type Props = {
  id: SectionId;
  data: PortfolioData;
  still: boolean;
  onFocusNode: (i: number) => void;
};

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

function Job({ job, i, still }: { job: Experience; i: number; still: boolean }) {
  return (
    <article className="cx-job" style={rise(i)}>
      <p className="cx-meta">
        <Scramble text={`${job.period}${job.location ? ` · ${job.location}` : ""}`} delay={120 + i * 90} still={still} />
      </p>
      <h3>
        {job.role} <span className="cx-at">at</span>{" "}
        {job.url ? (
          <a href={job.url} target="_blank" rel="noreferrer">
            {job.company}
          </a>
        ) : (
          job.company
        )}
      </h3>
      <ul className="cx-bullets">
        {job.description.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <Tags items={job.tech} />
    </article>
  );
}

const Tags = ({ items }: { items: string[] }) => (
  <ul className="cx-tags" aria-label="Tools">
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

function ProjectRow({ p, i, onFocus }: { p: Project; i: number; onFocus?: (i: number) => void }) {
  const href = p.link ?? p.github;
  const enter = onFocus ? () => onFocus(i) : undefined;
  const leave = onFocus ? () => onFocus(-1) : undefined;
  return (
    <li className="cx-project" style={rise(i)} onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave}>
      <div className="cx-project-head">
        <h4>{href ? <a href={href} target="_blank" rel="noreferrer">{p.title}</a> : p.title}</h4>
        {href && (
          <span className="cx-project-kind" aria-hidden="true">
            {p.link ? "↗ site" : "↗ code"}
          </span>
        )}
      </div>
      <p>{p.description}</p>
      <Tags items={p.tech} />
    </li>
  );
}

function body(id: SectionId, data: PortfolioData, still: boolean, onFocusNode: (i: number) => void): ReactNode {
  const life = lifeCategory(data);
  switch (id) {
    case "about": {
      const f = data.about.quickFacts;
      const facts: [string, string][] = [
        ["Based", f.location],
        ["From", f.hometown],
        ["Studied", f.education],
        ["Now", f.status],
        ["Also", f.funFact],
      ];
      return (
        <>
          <p className="cx-lede" style={rise(0)}>
            {data.about.name}
            <span className="cx-lede-sub">{data.about.title}</span>
          </p>
          {data.about.bio.map((b, i) => (
            <p key={b} className="cx-para" style={rise(i + 1)}>
              {b}
            </p>
          ))}
          <dl className="cx-facts" style={rise(4)}>
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </>
      );
    }
    case "now":
      return data.experience[0] ? <Job job={data.experience[0]} i={0} still={still} /> : null;
    case "before":
      return data.experience.slice(1).map((j, i) => <Job key={j.id} job={j} i={i} still={still} />);
    case "projects": {
      let n = 0;
      return data.projects.categories
        .filter((c) => c !== life)
        .map((c) => (
          <section key={c.name} className="cx-group">
            <h3 className="cx-group-title">
              <Scramble text={c.name} still={still} />
              <span>{String(c.projects.length).padStart(2, "0")}</span>
            </h3>
            <ul className="cx-projects">
              {c.projects.map((p) => {
                const i = n++;
                return <ProjectRow key={p.title} p={p} i={i} onFocus={onFocusNode} />;
              })}
            </ul>
          </section>
        ));
    }
    case "skills":
      return (
        <>
          {data.skills.categories.map((c, i) => (
            <section key={c.name} className="cx-group" style={rise(i)}>
              <h3 className="cx-group-title">
                <Scramble text={c.name} delay={i * 80} still={still} />
                <span>{String(c.skills.length).padStart(2, "0")}</span>
              </h3>
              <Tags items={c.skills} />
            </section>
          ))}
          <p className="cx-learning" style={rise(5)}>
            <span className="cx-meta">Currently learning</span>
            {data.skills.currentlyLearning}
          </p>
        </>
      );
    case "offhours":
      return (
        <ul className="cx-projects">
          {(life?.projects ?? []).map((p, i) => (
            <ProjectRow key={p.title} p={p} i={i} />
          ))}
        </ul>
      );
    case "contact":
      return (
        <>
          <p className="cx-para cx-big" style={rise(0)}>
            {data.contact.intro}
          </p>
          <a className="cx-email" href={`mailto:${data.contact.email}`} style={rise(1)}>
            {data.contact.email}
          </a>
          <ul className="cx-social" style={rise(2)}>
            {data.contact.socialLinks.map((s) => (
              <li key={s.name}>
                <a href={s.url} target={s.url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
                  <span>{s.name}</span>
                  <span className="cx-meta">{s.handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      );
  }
}

export default function Panel({ id, data, still, onFocusNode }: Props) {
  const idx = SECTIONS.findIndex((s) => s.id === id);
  const s = SECTIONS[idx];
  return (
    <>
      <header className="cx-panel-head">
        <p className="cx-meta">
          <Scramble text={`${String(idx + 1).padStart(2, "0")} / ${String(SECTIONS.length).padStart(2, "0")} · ${s.kicker}`} still={still} />
        </p>
        <h2 id={`cx-h-${id}`}>
          <Scramble text={s.label} delay={60} still={still} />
        </h2>
      </header>
      <div className="cx-panel-body">{body(id, data, still, onFocusNode)}</div>
    </>
  );
}
