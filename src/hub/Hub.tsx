import type { PointerEvent } from "react";
import type { PortfolioData } from "../types/portfolio";
import { ROUTES } from "../shared/routes";
import "./hub.css";

const DOORS = [
  {
    id: "game",
    verb: "Play",
    blurb: "An open world. Ride a scooter around a Greek island and bump into my résumé.",
  },
  {
    id: "cursor",
    verb: "Move",
    blurb: "A field of particles and your cursor. Point at something and it takes shape.",
  },
  {
    id: "scroll",
    verb: "Scroll",
    blurb: "Athens to Los Angeles as one long flight. Scroll to fly.",
  },
] as const;

// Feeds the cursor position to CSS so each door's art can react without a render.
function track(e: PointerEvent<HTMLAnchorElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
}

function Art({ id }: { id: (typeof DOORS)[number]["id"] }) {
  if (id === "game") {
    return (
      <svg className="hub-art" viewBox="0 0 400 640" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <circle className="hub-sun" cx="290" cy="250" r="54" fill="#fff3d6" />
        <rect y="330" width="400" height="310" fill="#176d86" />
        <path d="M0 330h400" stroke="#fff3d6" strokeOpacity=".5" />
        <path d="M-20 345 Q90 235 210 300 T420 345Z" fill="#c9a36a" />
        <path d="M-20 345 Q90 262 210 316 T420 345Z" fill="#8d9a5b" />
        <g fill="#fbf7ee">
          <rect x="70" y="268" width="44" height="34" />
          <rect x="118" y="280" width="34" height="26" />
          <rect x="160" y="274" width="30" height="36" />
        </g>
        <path d="M70 268a22 22 0 0 1 44 0Z" fill="#2456c4" />
        <rect x="170" y="290" width="9" height="20" fill="#2456c4" />
        <path d="M0 372q25-9 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" className="hub-wave" />
        <path d="M0 412q25-9 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" className="hub-wave hub-wave-2" />
      </svg>
    );
  }
  if (id === "cursor") return <div className="hub-art hub-dots" aria-hidden />;
  return (
    <svg className="hub-art" viewBox="0 150 400 230" preserveAspectRatio="xMidYMin meet" aria-hidden>
      <path id="hub-route" d="M40 330 Q200 60 360 250" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
      <circle cx="40" cy="330" r="5" fill="currentColor" />
      <circle cx="360" cy="250" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="40" y="356" textAnchor="middle">ATH</text>
      <text x="360" y="276" textAnchor="middle">LAX</text>
      <path className="hub-plane" d="M-11-7 11 0-11 7-6 0Z" fill="currentColor" />
    </svg>
  );
}

export default function Hub({ data }: { data: PortfolioData }) {
  const { about, contact } = data;
  return (
    <main className="hub">
      <header className="hub-top">
        <span>{about.title}</span>
        <span>{about.quickFacts.location}</span>
      </header>

      <div className="hub-head">
        <h1>{about.name}</h1>
        <p>One résumé, three ways in. Pick how you want to read it.</p>
      </div>

      <nav className="hub-doors" aria-label="Versions">
        {DOORS.map((d, i) => (
          <a key={d.id} href={ROUTES[d.id].path} className={`hub-door hub-door-${d.id}`} onPointerMove={track}>
            <Art id={d.id} />
            <span className="hub-kicker">
              0{i + 1} / {d.verb}
            </span>
            <span className="hub-title">{ROUTES[d.id].label}</span>
            <span className="hub-blurb">{d.blurb}</span>
            <span className="hub-cta" aria-hidden>
              Enter →
            </span>
          </a>
        ))}
      </nav>

      <footer className="hub-foot">
        <a href={ROUTES.plain.path}>In a hurry? Plain résumé →</a>
        <span>
          {contact.socialLinks.map((l) => (
            <a key={l.name} href={l.url} target={l.url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
              {l.name}
            </a>
          ))}
        </span>
      </footer>
    </main>
  );
}
