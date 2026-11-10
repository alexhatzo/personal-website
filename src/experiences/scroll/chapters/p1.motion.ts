import gsap from "gsap";
import { flight } from "../state";

// Part A, pinned: one bullet per step, the metric wipes in huge.
// Part B, desktop only: the P1 projects roll past as shipping containers on a pinned horizontal track.
export default function p1(el: HTMLElement, desk: boolean) {
  const q = gsap.utils.selector(el);
  const stepsEl = q(".p1-steps")[0] as HTMLElement;
  const steps = q(".p1-step");
  const big = (s: Element) => s.querySelector(".p1-big");

  gsap.from(q(".p1-head > *"), {
    autoAlpha: 0,
    y: 30,
    stagger: 0.08,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: stepsEl, start: "top 60%" },
  });
  gsap.set(steps.slice(1), { autoAlpha: 0 });

  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: { trigger: stepsEl, start: "top top", end: `+=${steps.length * (desk ? 85 : 70)}%`, pin: true, scrub: 0.5 },
  });
  tl.from(big(steps[0]), { clipPath: "inset(0% 100% 0% 0%)", duration: 0.5, ease: "power2.inOut" }, 0).to({}, { duration: 0.6 });
  steps.slice(1).forEach((s, i) => {
    const prev = steps[i];
    tl.to(prev, { autoAlpha: 0, yPercent: -18, duration: 0.4, ease: "power2.in" })
      .fromTo(s, { autoAlpha: 0, yPercent: 18 }, { autoAlpha: 1, yPercent: 0, duration: 0.5 }, "<0.25")
      .from(big(s), { clipPath: "inset(0% 100% 0% 0%)", duration: 0.55, ease: "power2.inOut" }, "<")
      .to({}, { duration: 0.6 });
  });
  const total = tl.duration();
  tl.fromTo(q(".p1-prog i"), { scaleY: 0 }, { scaleY: 1, ease: "none", duration: total }, 0)
    .to(flight, { cruiseA: 1, ease: "none", duration: total }, 0)
    .to(q(".clouds i"), { xPercent: (i: number) => -30 - i * 22, ease: "none", duration: total }, 0);

  if (!desk) {
    gsap.from(q(".crate, .p1-intro"), {
      autoAlpha: 0,
      y: 40,
      stagger: 0.08,
      duration: 1,
      ease: "expo.out",
      scrollTrigger: { trigger: q(".p1-gallery"), start: "top 75%", onEnter: () => gsap.to(flight, { cruiseB: 1, duration: 1.2 }) },
    });
    return;
  }

  const gallery = q(".p1-gallery")[0] as HTMLElement;
  const track = q(".p1-track")[0] as HTMLElement;
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const ride = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: gallery, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
  });
  ride.to(track, { x: () => -dist(), duration: 1 }, 0).to(flight, { cruiseB: 1, duration: 1 }, 0);

  q(".crate").forEach((c, i) => {
    gsap.from(c, {
      yPercent: i % 2 ? 14 : -10,
      rotation: i % 2 ? 4 : -3,
      ease: "none",
      scrollTrigger: { trigger: c, containerAnimation: ride, start: "left right", end: "left 45%", scrub: true },
    });
  });
}
