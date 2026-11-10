import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { flight } from "../state";

// Desktop, pinned: sunset approach -> the sun sinks, the editorial page wipes up over it,
// the masthead types in, garments fan out along the rail.
// Phone: sunset scrubs on its own, the page flows, garments are a native swipe row.
export default function oneoff(el: HTMLElement, desk: boolean) {
  const q = gsap.utils.selector(el);
  const title = SplitText.create(q(".oo-title"), { type: "chars", mask: "chars" }).chars;

  if (!desk) {
    gsap
      .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: q(".oo-sunset"), start: "top bottom", end: "bottom top", scrub: true } })
      .fromTo(q(".oo-sun"), { yPercent: -40 }, { yPercent: 50 }, 0)
      .to(flight, { landing: 1 }, 0);
    gsap.from(title, { yPercent: 110, stagger: 0.06, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: q(".oo-title"), start: "top 85%" } });
    gsap.from(q(".oo-mast > *, .oo-role, .oo-lede, .oo-link"), {
      autoAlpha: 0,
      y: 24,
      stagger: 0.08,
      duration: 1,
      ease: "expo.out",
      scrollTrigger: { trigger: q(".oo-paper"), start: "top 70%" },
    });
    gsap.from(q(".garment"), { autoAlpha: 0, x: 60, stagger: 0.1, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: q(".oo-rail"), start: "top 80%" } });
    return;
  }

  const rail = q(".oo-rail")[0] as HTMLElement;
  const cards = q(".garment");
  const n = cards.length;
  const slot = (i: number) => (n > 1 ? (i * (rail.clientWidth - cards[i].offsetWidth)) / (n - 1) : 0);
  const centre = (i: number) => (rail.clientWidth - cards[i].offsetWidth) / 2;
  const tilt = (i: number) => (i - (n - 1) / 2) * 2.2;

  gsap.set(q(".oo-paper"), { clipPath: "inset(100% 0% 0% 0%)" });
  gsap
    .timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: el, start: "top top", end: "+=280%", pin: true, scrub: 0.6, invalidateOnRefresh: true },
    })
    .to(flight, { landing: 1, duration: 0.3, ease: "power1.out" }, 0)
    .fromTo(q(".oo-sun"), { yPercent: -10 }, { yPercent: 55, duration: 0.36, ease: "none" }, 0)
    .to(q(".oo-city"), { yPercent: -30, duration: 0.36, ease: "none" }, 0)
    .to(q(".oo-approach"), { autoAlpha: 0, duration: 0.08 }, 0.22)
    .to(q(".oo-paper"), { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power3.inOut" }, 0.26)
    .to(q(".oo-sunset"), { yPercent: -18, duration: 0.2, ease: "power3.inOut" }, 0.26)
    .from(q(".oo-mast > *"), { autoAlpha: 0, y: 14, stagger: 0.02, duration: 0.08 }, 0.32)
    .from(title, { yPercent: 112, stagger: 0.025, duration: 0.18, ease: "expo.out" }, 0.3)
    .from(q(".oo-ticker"), { autoAlpha: 0, yPercent: 100, duration: 0.12 }, 0.34)
    .from(q(".oo-role, .oo-lede, .oo-link"), { autoAlpha: 0, y: 30, stagger: 0.03, duration: 0.12 }, 0.42)
    .from(q(".oo-bar"), { scaleX: 0, transformOrigin: "left center", duration: 0.12, ease: "power3.inOut" }, 0.44)
    .fromTo(cards, { x: centre, rotation: 0, autoAlpha: 0, y: -40 }, { x: centre, rotation: 0, autoAlpha: 1, y: 0, stagger: 0.02, duration: 0.1 }, 0.52)
    .to(cards, { x: slot, rotation: tilt, duration: 0.22, ease: "power3.inOut", stagger: 0.015 }, 0.66)
    .to({}, { duration: 0.12 });
}
