import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

// Desktop: pinned horizontal gallery, cards tilt in as they arrive. Phone: CSS sticky deck.
export default function side(el: HTMLElement, desk: boolean) {
  const q = gsap.utils.selector(el);
  const title = SplitText.create(q(".side-title"), { type: "chars", mask: "chars" }).chars;
  gsap.from(title, { yPercent: 110, stagger: 0.04, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 60%" } });

  if (!desk) {
    q(".quest").forEach((c) =>
      gsap.to(c, { scale: 0.94, ease: "none", scrollTrigger: { trigger: c, start: "top 12%", end: "bottom top", scrub: true } }),
    );
    return;
  }

  const track = q(".side-track")[0] as HTMLElement;
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const ride = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: q(".side-pin"), start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
  });
  ride.to(track, { x: () => -dist(), duration: 1 }, 0).fromTo(q(".side-progress i"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);

  q(".quest").forEach((c, i) => {
    gsap.from(c, {
      rotation: i % 2 ? 5 : -4,
      yPercent: i % 2 ? 10 : -6,
      ease: "none",
      scrollTrigger: { trigger: c, containerAnimation: ride, start: "left right", end: "left 50%", scrub: true },
    });
  });
}
