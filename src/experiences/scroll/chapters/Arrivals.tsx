import type { PortfolioData } from "../../../types/portfolio";
import { ROUTES, type RouteId } from "../../../shared/routes";
import { Kicker } from "../bits";

const OTHER: { id: RouteId; flight: string; status: string }[] = [
  { id: "game", flight: "HZ 101", status: "Boarding" },
  { id: "cursor", flight: "HZ 202", status: "Boarding" },
  { id: "plain", flight: "HZ 303", status: "On time" },
  { id: "hub", flight: "HZ 000", status: "Gate open" },
];

export default function Arrivals({ data }: { data: PortfolioData }) {
  const { contact, about } = data;
  const socials = contact.socialLinks.filter((s) => !s.url.startsWith("mailto:"));
  return (
    <section className="ch ch-arr" data-ch="9" aria-labelledby="h-arr">
      <div className="arr-top">
        <Kicker n={9}>Arrivals · {about.quickFacts.location}</Kicker>
        <h2 id="h-arr" className="arr-title">
          <span>Welcome</span> <span>to LA.</span>
        </h2>
      </div>

      <div className="arr-grid">
        <div className="arr-contact" data-r>
          <p className="arr-intro">{contact.intro}</p>
          <a className="arr-email" href={`mailto:${contact.email}`}>
            <span className="arr-email-k">Write to me</span>
            <span className="arr-email-v">{contact.email}</span>
          </a>
          <ul className="arr-social">
            {socials.map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  <span>{s.name}</span>
                  <span className="arr-handle">{s.handle}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="fids" aria-labelledby="h-fids" data-r>
          <h3 id="h-fids" className="fids-title">
            Departures · other versions
          </h3>
          <ul>
            {OTHER.map((o) => (
              <li key={o.id}>
                <a href={ROUTES[o.id].path}>
                  <span className="fids-flight">{o.flight}</span>
                  <span className="fids-dest">{ROUTES[o.id].label}</span>
                  <span className="fids-gate">{ROUTES[o.id].path}</span>
                  <span className="fids-status" data-status={o.status}>
                    {o.status}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <footer className="arr-foot">
        <button type="button" className="arr-again" data-goto="0">
          <span aria-hidden="true">↑</span> Fly again
        </button>
        <span>
          © {new Date().getFullYear()} {about.name}
        </span>
      </footer>
    </section>
  );
}
