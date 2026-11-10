import { ROUTES, type RouteId } from "./routes";
import "./switcher.css";

// Global version switcher, pinned top-right on every experience. Experiences keep that corner clear.
export default function Switcher({ current }: { current: RouteId }) {
  return (
    <details className="xp-switcher">
      <summary>
        <span aria-hidden>◐</span> {ROUTES[current].label}
      </summary>
      <nav aria-label="Switch version">
        {(Object.keys(ROUTES) as RouteId[]).map((id) => (
          <a key={id} href={ROUTES[id].path} aria-current={id === current ? "page" : undefined}>
            {ROUTES[id].label}
          </a>
        ))}
      </nav>
    </details>
  );
}
