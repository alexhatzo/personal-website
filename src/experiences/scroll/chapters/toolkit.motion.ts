import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Belts drift on their own; scroll velocity boosts speed, flips direction and skews the type.
export default function toolkit(el: HTMLElement) {
  const tracks = gsap.utils.toArray<HTMLElement>(".row-track", el);
  const setX = tracks.map((t) => gsap.quickSetter(t, "xPercent"));
  const setSkew = tracks.map((t) => gsap.quickSetter(t, "skewX", "deg"));
  const xs: number[] = tracks.map((_, i) => (i % 2 ? -50 : 0));
  const wrap = gsap.utils.wrap(-50, 0);
  let v = 0, dir = 1, skew = 0;

  const st = ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      v = self.getVelocity();
      if (v) dir = Math.sign(v);
    },
  });

  const tick = (_t: number, dt: number) => {
    if (!st.isActive) return;
    v *= 0.9;
    const boost = 1 + Math.min(Math.abs(v) / 250, 14);
    skew += (gsap.utils.clamp(-12, 12, -v / 220) - skew) * 0.12;
    tracks.forEach((_, i) => {
      xs[i] = wrap(xs[i] + (i % 2 ? 1 : -1) * dir * 1.1 * boost * (dt / 1000));
      setX[i](xs[i]);
      setSkew[i](skew);
    });
  };
  gsap.ticker.add(tick);

  gsap.from(gsap.utils.toArray(".row", el), {
    autoAlpha: 0,
    x: (i: number) => (i % 2 ? 120 : -120),
    duration: 1.4,
    stagger: 0.1,
    ease: "expo.out",
    scrollTrigger: { trigger: el.querySelector(".rows"), start: "top 80%" },
  });
  return () => gsap.ticker.remove(tick);
}
