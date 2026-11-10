import gsap from "gsap";

// Luggage tags drop in on their string, then sway around the hole as they cross the screen.
export default function gigs(el: HTMLElement) {
  gsap.utils.toArray<HTMLElement>(".tag", el).forEach((tag, i) => {
    gsap.from(tag, {
      y: 200,
      autoAlpha: 0,
      duration: 1.5,
      delay: i * 0.14,
      ease: "expo.out",
      scrollTrigger: { trigger: el.querySelector(".gigs"), start: "top 82%" },
    });
    gsap.fromTo(
      tag,
      { rotation: i % 2 ? -4 : 4 },
      { rotation: i % 2 ? 2.5 : -2.5, ease: "none", scrollTrigger: { trigger: tag, start: "top bottom", end: "bottom top", scrub: 0.8 } },
    );
  });
}
