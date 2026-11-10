import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { flight, LEG_SHARE, ROUTE_KM } from "../state";

// Pinned: dots surface, the flight plan draws ATH -> LAX, then the plane flies the first leg
// (to mid-Canada) with the distance counter racing; the destination card lands.
export default function takeoff(el: HTMLElement, desk: boolean) {
  const q = gsap.utils.selector(el);
  const plane = el.querySelector<SVGGElement>(".to-plane")!;
  const flown = el.querySelector<SVGPathElement>(".to-flown")!;
  const kmEl = q(".to-km-num")[0] as HTMLElement;
  const len = flown.getTotalLength();
  const share = LEG_SHARE.takeoff;
  flown.style.strokeDasharray = `${len} ${len}`;

  const render = () => {
    const t = flight.takeoff * share;
    const p = flown.getPointAtLength(len * t);
    const n = flown.getPointAtLength(Math.min(len, len * t + 2));
    const angle = (Math.atan2(n.y - p.y, n.x - p.x) * 180) / Math.PI;
    plane.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    flown.style.strokeDashoffset = String(len * (1 - t));
    kmEl.textContent = Math.round(ROUTE_KM * t).toLocaleString("en-US");
  };
  render();

  const title = SplitText.create(q(".to-title"), { type: "chars", mask: "chars" });
  gsap.from(title.chars, {
    yPercent: 110,
    stagger: 0.05,
    duration: 1.3,
    ease: "expo.out",
    scrollTrigger: { trigger: el, start: "top 65%" },
  });

  gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: el, start: "top top", end: desk ? "+=260%" : "+=200%", pin: true, scrub: 0.6 },
    })
    .fromTo(q(".to-dots"), { opacity: 0.4 }, { opacity: 1, duration: 0.12 }, 0)
    .from(q(".to-map"), { scale: 1.12, duration: 0.3, ease: "power2.out", transformOrigin: "60% 40%" }, 0)
    .from(q(".to-city--ath"), { scale: 0, transformOrigin: "center", duration: 0.05, ease: "back.out(3)" }, 0.02)
    .from(q(".to-plan"), { drawSVG: "0%", duration: 0.26 }, 0.04)
    .from(q(".to-city--lax"), { scale: 0, transformOrigin: "center", duration: 0.05, ease: "back.out(3)" }, 0.27)
    .from(q(".to-readout"), { autoAlpha: 0, y: 30, duration: 0.08, ease: "power2.out" }, 0.25)
    .from(plane, { autoAlpha: 0, duration: 0.03 }, 0.3)
    .to(flight, { takeoff: 1, duration: 0.58, ease: "power1.inOut", onUpdate: render }, 0.31)
    .from(q(".to-dest"), { autoAlpha: 0, y: 40, duration: 0.1, ease: "power2.out" }, 0.74)
    .to({}, { duration: 0.1 });
}
