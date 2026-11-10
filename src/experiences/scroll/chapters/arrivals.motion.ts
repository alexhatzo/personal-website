import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

// Giant welcome rises; the departures board flips its statuses like split-flap letters.
export default function arrivals(el: HTMLElement) {
  const q = gsap.utils.selector(el);
  const chars = SplitText.create(q(".arr-title > span"), { type: "chars", mask: "chars" }).chars;
  gsap.from(chars, { yPercent: 110, stagger: 0.035, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: q(".arr-title"), start: "top 85%" } });

  q(".fids-status, .fids-flight").forEach((flap, i) =>
    gsap.to(flap, {
      scrambleText: { text: flap.textContent ?? "", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", revealDelay: 0.4, speed: 0.5 },
      duration: 1.5,
      delay: i * 0.07,
      scrollTrigger: { trigger: q(".fids"), start: "top 85%" },
    }),
  );
}
