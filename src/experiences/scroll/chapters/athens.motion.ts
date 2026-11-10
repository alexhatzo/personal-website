import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

export default function athens(el: HTMLElement) {
  const q = gsap.utils.selector(el);

  const title = SplitText.create(q(".ath-title"), { type: "chars", mask: "chars" });
  gsap.from(title.chars, {
    yPercent: 110,
    stagger: 0.05,
    duration: 1.4,
    ease: "expo.out",
    scrollTrigger: { trigger: q(".ath-title"), start: "top 85%" },
  });
  gsap.from(q(".ath-head .sx-kicker, .ath-coords"), {
    autoAlpha: 0,
    y: 16,
    stagger: 0.1,
    duration: 1,
    ease: "expo.out",
    scrollTrigger: { trigger: q(".ath-head"), start: "top 80%" },
  });

  gsap.from(q(".meander path"), {
    drawSVG: "0%",
    ease: "none",
    scrollTrigger: { trigger: q(".meander"), start: "top 98%", end: "top 35%", scrub: true },
  });

  // Bio reads itself in, word by word, as it crosses the viewport.
  q(".ath-line").forEach((p) => {
    const words = SplitText.create(p, { type: "words" }).words;
    gsap.fromTo(
      words,
      { opacity: 0.14 },
      { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 50%", scrub: true } },
    );
  });

  // Passport stamps slam down one after another.
  gsap.from(q(".stamp"), {
    scale: 1.9,
    autoAlpha: 0,
    rotation: (i: number) => (i % 2 ? 16 : -14),
    duration: 0.55,
    ease: "back.out(2.2)",
    stagger: 0.22,
    scrollTrigger: { trigger: q(".stamps"), start: "top 78%" },
  });
}
