import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import Lenis from "lenis";
import { flight, flownKm, LEGS, pad, type ChapterMeta } from "./state";
import boarding from "./chapters/boarding.motion";
import athens from "./chapters/athens.motion";
import gigs from "./chapters/gigs.motion";
import takeoff from "./chapters/takeoff.motion";
import p1 from "./chapters/p1.motion";
import oneoff from "./chapters/oneoff.motion";
import side from "./chapters/side.motion";
import toolkit from "./chapters/toolkit.motion";
import arrivals from "./chapters/arrivals.motion";

gsap.registerPlugin(
  ScrollTrigger,
  SplitText,
  DrawSVGPlugin,
  ScrambleTextPlugin,
);
ScrollTrigger.config({ ignoreMobileResize: true });

// A chapter's scroll choreography. Runs inside a gsap.matchMedia context, so tweens, ScrollTriggers
// and SplitTexts are reverted automatically; return a function for anything else (ticker callbacks).
export type ChapterMotion = (
  section: HTMLElement,
  desk: boolean,
) => void | (() => void);
const MOTIONS: (ChapterMotion | null)[] = [
  boarding,
  athens,
  gigs,
  takeoff,
  p1,
  oneoff,
  side,
  toolkit,
  null,
  arrivals,
];

const clamp01 = gsap.utils.clamp(0, 1);

export function startJourney(root: HTMLElement, meta: ChapterMeta[]) {
  const params = new URLSearchParams(window.location.search);
  const sections = gsap.utils.toArray<HTMLElement>("[data-ch]", root);
  let lenis: Lenis | null = null;
  let reduced = false;
  let jumped = !params.has("at") && !params.has("chapter");
  let starts: number[] = meta.map(() => 0);
  const raf = (t: number) => lenis?.raf(t * 1000);
  const maxScroll = () => ScrollTrigger.maxScroll(window) || 1;
  if (!jumped) history.scrollRestoration = "manual";

  // Chapter start = top of its pin-spacer (pinned) or of the section itself.
  const measure = () => {
    const found = new Map<number, number>();
    for (const s of sections) {
      const box = s.parentElement?.classList.contains("pin-spacer")
        ? s.parentElement
        : s;
      found.set(
        Number(s.dataset.ch),
        box.getBoundingClientRect().top + window.scrollY,
      );
    }
    let prev = 0;
    starts = meta.map((_, i) => (prev = found.get(i) ?? prev));
    root.querySelectorAll<HTMLElement>(".hud-tick").forEach((b, i) => {
      b.style.left = `${(clamp01(starts[i] / maxScroll()) * 100).toFixed(2)}%`;
    });
  };
  ScrollTrigger.addEventListener("refresh", measure);

  const chapterY = (n: number, offset = 0) => {
    const i = gsap.utils.clamp(0, meta.length - 1, Math.floor(n) || 0);
    const a = starts[i],
      b = starts[i + 1] ?? maxScroll();
    return a + (b - a) * clamp01(offset);
  };
  const scrollToY = (y: number, immediate: boolean) => {
    if (lenis) lenis.scrollTo(y, { immediate, force: true, duration: 2.4 });
    else
      window.scrollTo({
        top: y,
        behavior: immediate || reduced ? "instant" : "smooth",
      });
  };

  const jump = () => {
    if (jumped) return;
    jumped = true;
    const at = params.get("at");
    const y =
      at !== null
        ? clamp01(Number(at) || 0) * maxScroll()
        : chapterY(
            Number(params.get("chapter")),
            Number(params.get("offset")) || 0,
          );
    scrollToY(y, true);
    ScrollTrigger.update();
    // Settle scrub smoothing so a single headless frame shows the true state for this position.
    ScrollTrigger.getAll().forEach((st) => {
      const tw = st.getTween() as gsap.core.Tween | undefined;
      if (tw && typeof tw.progress === "function") tw.progress(1);
    });
  };

  const onClick = (e: MouseEvent) => {
    const t = (e.target as Element).closest<HTMLElement>("[data-goto]");
    if (t) scrollToY(chapterY(Number(t.dataset.goto)), false);
  };
  root.addEventListener("click", onClick);

  // ---- HUD + palette: derived from scroll position every frame, DOM written only on change.
  const hud = (k: string) =>
    root.querySelector<HTMLElement>(`[data-hud="${k}"]`)!;
  const el = {
    num: hud("num"),
    title: hud("title"),
    km: hud("km"),
    year: hud("year"),
    fill: hud("fill"),
    plane: hud("plane"),
  };
  const last = { ch: -1, km: "", year: "", pal: "", p: "" };

  const tick = () => {
    const y = window.scrollY,
      vh = window.innerHeight;
    let i = 0;
    while (i < starts.length - 1 && y >= starts[i + 1] - 1) i++;
    const span = (starts[i + 1] ?? maxScroll() + 1) - starts[i] || 1;
    const f = clamp01((y - starts[i]) / span);

    let label = i;
    while (label < starts.length - 1 && y + vh * 0.45 >= starts[label + 1])
      label++;
    if (label !== last.ch) {
      last.ch = label;
      el.num.textContent = pad(label);
      el.title.textContent = meta[label].title;
      root.dataset.chapter = String(label);
    }

    if (reduced)
      LEGS.forEach((l, k) => (flight[l] = clamp01(i + f - 3 - k * 0.5)));
    const km = Math.round(flownKm()).toLocaleString("en-US");
    if (km !== last.km) el.km.textContent = last.km = km;

    const [y0, y1] = meta[i].years;
    const year = String(Math.floor(y0 + (y1 - y0 + 0.999) * f));
    if (year !== last.year) el.year.textContent = last.year = year;

    const p = (clamp01(y / maxScroll()) * 100).toFixed(2);
    if (p !== last.p) {
      last.p = p;
      el.plane.style.transform = `translateX(${p}%)`;
      el.fill.style.transform = `scaleX(${Number(p) / 100})`;
    }

    // Palette: blend into the next chapter over `blend` viewports before it starts.
    const next = meta[i + 1];
    const w = next ? next.blend * vh : 0;
    const t = next && w > 0 ? clamp01((y - (starts[i + 1] - w)) / w) : 0;
    const a = meta[i].palette,
      b = next?.palette ?? a;
    const key = `${i}:${t.toFixed(3)}`;
    if (key !== last.pal) {
      last.pal = key;
      for (const k of ["bg", "ink", "accent"] as const) {
        root.style.setProperty(
          `--${k}`,
          t <= 0 ? a[k] : t >= 1 ? b[k] : gsap.utils.interpolate(a[k], b[k], t),
        );
      }
    }
  };
  gsap.ticker.add(tick);

  // Build the choreography once webfonts are in (SplitText and every measurement depend on them);
  // the page stays hidden for that moment (max 2.5s) so the intro never flashes unstyled.
  const mm = gsap.matchMedia();
  let alive = true;
  root.style.visibility = "hidden";
  const boot = () => {
    if (!alive) return;
    root.style.visibility = "";
    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        still: "(prefers-reduced-motion: reduce)",
        desk: "(min-width: 900px)",
      },
      (ctx) => {
        const { motion, desk } = ctx.conditions as {
          motion: boolean;
          desk: boolean;
        };
        reduced = !motion;
        root.classList.toggle("is-motion", motion);
        root.classList.toggle("is-desk", motion && desk);
        const cleanups: (() => void)[] = [];

        if (motion) {
          sections.forEach((s) => {
            const done = MOTIONS[Number(s.dataset.ch)]?.(s, desk);
            if (done) cleanups.push(done);
          });
          gsap.utils
            .toArray<HTMLElement>("[data-r]", root)
            .forEach((r) =>
              gsap.from(r, {
                y: 48,
                autoAlpha: 0,
                duration: 1.2,
                ease: "expo.out",
                scrollTrigger: { trigger: r, start: "top 88%" },
              }),
            );
          if (!params.has("nosmooth")) {
            lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
            lenis.on("scroll", ScrollTrigger.update);
            gsap.ticker.add(raf);
            gsap.ticker.lagSmoothing(0);
          }
        } else {
          LEGS.forEach((l) => (flight[l] = 0));
          gsap.utils
            .toArray<HTMLElement>("[data-r], .ch h2", root)
            .forEach((r) =>
              gsap.from(r, {
                autoAlpha: 0,
                duration: 0.8,
                ease: "power1.out",
                scrollTrigger: { trigger: r, start: "top 92%" },
              }),
            );
        }
        ScrollTrigger.refresh();

        return () => {
          cleanups.forEach((c) => c());
          lenis?.destroy();
          lenis = null;
          gsap.ticker.remove(raf);
          gsap.ticker.lagSmoothing(500, 33);
          root.classList.remove("is-motion", "is-desk");
        };
      },
      root,
    );
    jump();
  };
  Promise.race([
    document.fonts.ready,
    new Promise((r) => setTimeout(r, 2500)),
  ]).then(boot);

  return () => {
    alive = false;
    root.style.visibility = "";
    mm.revert();
    gsap.ticker.remove(tick);
    ScrollTrigger.removeEventListener("refresh", measure);
    root.removeEventListener("click", onClick);
    LEGS.forEach((l) => (flight[l] = 0));
  };
}
