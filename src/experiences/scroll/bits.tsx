import type { ReactNode } from "react";
import { METRIC } from "./state";

export function Plane({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22 12c0-.7-.6-1.2-1.3-1.2h-5.2L10.4 3H8.3l2.6 7.8H6.1L4.3 8.4H2.6l1 3.6-1 3.6h1.7l1.8-2.4h4.8L8.3 21h2.1l5.1-7.8h5.2c.7 0 1.3-.5 1.3-1.2z"
      />
    </svg>
  );
}

// Wraps the numbers worth shouting about (50%+, <5 min, $200k+) in <mark>.
export function Hl({ text }: { text: string }) {
  return (
    <>
      {text.split(METRIC).map((part, i) =>
        i % 2 ? (
          <mark key={i} className="sx-metric">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function Chips({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`sx-chips ${className}`} aria-label="Tech">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export function Kicker({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="sx-kicker">
      <span>{String(n).padStart(2, "0")}</span>
      <span aria-hidden="true">/</span>
      <span>{children}</span>
    </p>
  );
}
