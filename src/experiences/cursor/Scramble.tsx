import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>▚▞░";

// Decodes text in place. Screen readers get the real string from the visually hidden twin.
export default function Scramble({ text, delay = 0, still = false }: { text: string; delay?: number; still?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (still) {
      el.textContent = text;
      return;
    }
    const dur = Math.min(900, 320 + text.length * 14);
    const start = performance.now() + delay;
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / dur;
      if (t >= 1) {
        el.textContent = text;
        return;
      }
      const shown = Math.max(0, Math.floor(t * text.length));
      let out = text.slice(0, shown);
      for (let i = shown; i < text.length; i++) {
        const ch = text[i];
        out += ch === " " || t < 0 ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, still]);
  return (
    <>
      <span className="cx-sr">{text}</span>
      <span aria-hidden="true" ref={ref}>
        {text}
      </span>
    </>
  );
}
