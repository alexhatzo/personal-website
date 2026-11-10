import { useEffect, useRef } from "react";
import type { Experience, PortfolioData, Project } from "../../../types/portfolio";
import { PLACE, type PlaceId } from "../engine/places";
import type { Progress } from "../engine/progress";
import { skillKey } from "../engine/tokens";
import { TOKEN_COLORS } from "../engine/districtsA";

const host = (u: string) => {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
};

function Job({ job }: { job: Experience }) {
  return (
    <article className="hz-job">
      <header>
        <h3>{job.role}</h3>
        <p className="hz-job__co">
          {job.url ? (
            <a href={job.url} target="_blank" rel="noreferrer">
              {job.company} ↗
            </a>
          ) : (
            job.company
          )}
        </p>
        <p className="hz-meta">
          {job.period}
          {job.location ? ` · ${job.location}` : ""}
        </p>
      </header>
      {job.summary && <p>{job.summary}</p>}
      <ul className="hz-bullets">
        {job.description.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <Chips items={job.tech} />
    </article>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="hz-chips" aria-label="Tech">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="hz-proj">
      <h4>{p.title}</h4>
      <p>{p.description}</p>
      <Chips items={p.tech} />
      {(p.link || p.github) && (
        <p className="hz-links">
          {p.link && (
            <a href={p.link} target="_blank" rel="noreferrer">
              {host(p.link)} ↗
            </a>
          )}
          {p.github && (
            <a href={p.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          )}
        </p>
      )}
    </article>
  );
}

const TITLES: Record<PlaceId, string> = {
  port: "Hi, I'm Alex",
  skills: "Skills",
  oneoff: "Right now",
  p1: "The DevOps years",
  athens: "Where it started",
  workshop: "Things I've built",
  beach: "Off the clock",
  tennis: "Tennis Club",
  contact: "Say hello",
};

function Body({ id, data, progress, music, onToggleMusic }: { id: PlaceId; data: PortfolioData; progress: Progress; music: boolean; onToggleMusic: () => void }) {
  const exp = data.experience;
  switch (id) {
    case "port": {
      const q = data.about.quickFacts;
      return (
        <>
          <p className="hz-big">{data.about.name}</p>
          <p className="hz-meta">{data.about.title}</p>
          {data.about.bio.map((b) => (
            <p key={b}>{b}</p>
          ))}
          <dl className="hz-facts">
            <dt>Based in</dt>
            <dd>{q.location}</dd>
            <dt>From</dt>
            <dd>{q.hometown}</dd>
            <dt>Studied</dt>
            <dd>{q.education}</dd>
            <dt>Now</dt>
            <dd>{q.status}</dd>
            <dt>Also</dt>
            <dd>{q.funFact}</dd>
          </dl>
        </>
      );
    }
    case "oneoff":
      return exp[0] ? <Job job={exp[0]} /> : null;
    case "p1":
      return exp[1] ? <Job job={exp[1]} /> : null;
    case "athens":
      return (
        <>
          {exp.slice(2).map((j) => (
            <Job key={j.id} job={j} />
          ))}
        </>
      );
    case "workshop":
      return (
        <>
          {data.projects.categories
            .filter((c) => c.name.toLowerCase() !== "life")
            .map((c) => (
              <section key={c.name} className="hz-sec">
                <h3>{c.name}</h3>
                {c.projects.map((p) => (
                  <ProjectCard key={p.title} p={p} />
                ))}
              </section>
            ))}
        </>
      );
    case "beach": {
      const life = data.projects.categories.filter((c) => c.name.toLowerCase() === "life");
      return (
        <>
          <button className={`hz-deck ${music ? "is-on" : ""}`} onClick={onToggleMusic} aria-pressed={music}>
            <span className="hz-deck__disc" aria-hidden />
            <span>
              <b>{music ? "Pause the set" : "Drop the needle"}</b>
              <small>Kosh · Benefit Of The Doubt</small>
            </span>
          </button>
          {life.flatMap((c) => c.projects).map((p) => (
            <ProjectCard key={p.title} p={p} />
          ))}
        </>
      );
    }
    case "tennis":
      return (
        <>
          <p>A pure toy. The ball machine starts firing when you ride onto the court; smack the balls with the scooter.</p>
          <p className="hz-big">{progress.hits} ball{progress.hits === 1 ? "" : "s"} hit</p>
          <p className="hz-meta">{data.about.quickFacts.funFact}</p>
        </>
      );
    case "contact":
      return (
        <>
          <p>{data.contact.intro}</p>
          <p>
            <a className="hz-mail" href={`mailto:${data.contact.email}`}>
              {data.contact.email}
            </a>
          </p>
          <ul className="hz-social">
            {data.contact.socialLinks.map((s) => (
              <li key={s.name}>
                <a href={s.url} target={s.url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
                  <b>{s.name}</b>
                  <span>{s.handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      );
    case "skills": {
      const got = new Set(progress.skills);
      const total = data.skills.categories.reduce((a, c) => a + c.skills.length, 0);
      return (
        <>
          <p>
            Every skill is a token somewhere on the island. You've collected <b>{got.size}</b> of {total}. Collected ones are filled in.
          </p>
          {data.skills.categories.map((c, i) => (
            <section key={c.name} className="hz-sec">
              <h3>
                <span className="hz-dot" style={{ background: TOKEN_COLORS[i % TOKEN_COLORS.length] }} />
                {c.name}
              </h3>
              <ul className="hz-skills">
                {c.skills.map((s) => {
                  const on = got.has(skillKey(c.name, s));
                  return (
                    <li key={s} className={on ? "is-on" : ""} style={{ ["--c" as string]: TOKEN_COLORS[i % TOKEN_COLORS.length] }}>
                      {s}
                      <span className="hz-sr">{on ? " (collected)" : " (not yet collected)"}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <section className="hz-sec">
            <h3>Currently learning</h3>
            <p>{data.skills.currentlyLearning}</p>
          </section>
        </>
      );
    }
  }
}

export default function Panel({
  id,
  data,
  progress,
  music,
  onToggleMusic,
  onClose,
  onNext,
  onPrev,
}: {
  id: PlaceId;
  data: PortfolioData;
  progress: Progress;
  music: boolean;
  onToggleMusic: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const place = PLACE[id];
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    bodyRef.current?.scrollTo(0, 0);
  }, [id]);
  return (
    <div className="hz-panel-wrap" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="hz-panel" role="dialog" aria-modal="true" aria-labelledby="hz-panel-title" style={{ ["--accent" as string]: place.color }}>
        <header className="hz-panel__head">
          <p className="hz-eyebrow">
            <span className="hz-dot" /> {place.name}
          </p>
          <h2 id="hz-panel-title">{TITLES[id]}</h2>
          <button ref={closeRef} className="hz-x" onClick={onClose} aria-label="Close panel (Esc)">
            ✕
          </button>
        </header>
        <div className="hz-panel__body" ref={bodyRef}>
          <Body id={id} data={data} progress={progress} music={music} onToggleMusic={onToggleMusic} />
        </div>
        <footer className="hz-panel__foot">
          <button className="hz-btn hz-btn--small" onClick={onPrev}>
            ← Prev stop
          </button>
          <span className="hz-meta">Esc to keep riding</span>
          <button className="hz-btn hz-btn--small" onClick={onNext}>
            Next stop →
          </button>
        </footer>
      </section>
    </div>
  );
}
