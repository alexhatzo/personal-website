import type { ReactNode } from "react";
import { usePortfolioData } from "../context/PortfolioContext";
import { ROUTES } from "../shared/routes";
import "./plain.css";

const SECTIONS = ["Experience", "Projects", "Skills", "About", "Contact"];
const DOT = "\u00a0· "; // the dot never starts a line
const ext = { target: "_blank", rel: "noreferrer" };
const linkProps = (url: string) => (url.startsWith("mailto:") ? {} : ext);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section id={title.toLowerCase()} className="plain-sec">
      <h2>
        <span>0{SECTIONS.indexOf(title) + 1}</span> {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

export default function StaticPortfolio() {
  const { about, projects, skills, experience, contact } = usePortfolioData();
  const [first, ...last] = about.name.split(" ");
  const [lede, ...bio] = about.bio;
  const facts = about.quickFacts;

  return (
    <main className="plain">
      <p className="plain-top">
        {about.title} <span>/</span> {facts.location}
      </p>

      <header className="plain-head">
        <h1>
          {first} <em>{last.join(" ")}</em>
        </h1>
        <div className="plain-intro">
          <p className="plain-lede">{lede}</p>
          <div>
            {bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="plain-links">
              {contact.socialLinks.map((l) => (
                <a key={l.name} href={l.url} {...linkProps(l.url)}>
                  {l.name}
                </a>
              ))}
              <button type="button" onClick={() => window.print()}>
                Print / PDF
              </button>
            </p>
          </div>
        </div>
      </header>

      <nav className="plain-nav" aria-label="Sections">
        {SECTIONS.map((s, i) => (
          <a key={s} href={`#${s.toLowerCase()}`}>
            <span>0{i + 1}</span> {s}
          </a>
        ))}
      </nav>

      <Section title="Experience">
        {experience.map((job) => (
          <article key={job.id} className="plain-job">
            <h3>
              {job.role},{" "}
              <em>
                {job.url ? (
                  <a href={job.url} {...ext}>
                    {job.company}
                  </a>
                ) : (
                  job.company
                )}
              </em>
            </h3>
            <p className="plain-when">
              {job.period.replace(" - ", " – ")}
              {job.location && <span>{job.location}</span>}
            </p>
            <ul>
              {job.description.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="plain-tech">{job.tech.join(DOT)}</p>
          </article>
        ))}
      </Section>

      <Section title="Projects">
        {projects.categories.map((cat) => (
          <div key={cat.name} className="plain-cat">
            <h3>
              {cat.name} <span>{cat.projects.length}</span>
            </h3>
            <ul>
              {cat.projects.map((p) => {
                const href = p.link ?? p.github;
                return (
                  <li key={p.title}>
                    <h4>
                      {href ? (
                        <a href={href} {...ext}>
                          {p.title} <span aria-hidden>↗</span>
                        </a>
                      ) : (
                        p.title
                      )}
                    </h4>
                    <p>{p.description}</p>
                    <p className="plain-tech">{p.tech.join(DOT)}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Skills">
        <dl className="plain-dl">
          {skills.categories.map((c) => (
            <div key={c.name}>
              <dt>{c.name}</dt>
              <dd>{c.skills.join(", ")}</dd>
            </div>
          ))}
          <div>
            <dt>Learning now</dt>
            <dd>{skills.currentlyLearning}</dd>
          </div>
        </dl>
      </Section>

      <Section title="About">
        <dl className="plain-dl">
          <div>
            <dt>Education</dt>
            <dd>{facts.education}</dd>
          </div>
          <div>
            <dt>Based in</dt>
            <dd>{facts.location}</dd>
          </div>
          <div>
            <dt>From</dt>
            <dd>{facts.hometown}</dd>
          </div>
          <div>
            <dt>Off the clock</dt>
            <dd>{facts.funFact}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Contact">
        <p className="plain-lede">{contact.intro}</p>
        <dl className="plain-dl">
          {contact.socialLinks.map((l) => (
            <div key={l.name}>
              <dt>{l.name}</dt>
              <dd>
                <a href={l.url} {...linkProps(l.url)}>
                  {l.handle}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <footer className="plain-foot">
        <span>
          Rather play it?{" "}
          {(["game", "cursor", "scroll"] as const).map((id) => (
            <a key={id} href={ROUTES[id].path}>
              {ROUTES[id].label}
            </a>
          ))}
        </span>
        <span>
          © {new Date().getFullYear()} {about.name}
        </span>
      </footer>
    </main>
  );
}
