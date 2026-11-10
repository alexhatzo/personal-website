import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

// Intro: the full name rises letter by letter. Scroll: ALEXANDROS lifts away, POULOS drops,
// HATZO slides to the centre and scales up to the wordmark while the boarding-pass stub tears off.
export default function boarding(el: HTMLElement) {
  const q = gsap.utils.selector(el);
  const stage = q(".board-stage")[0] as HTMLElement;
  const hz = q(".board-hatzo")[0] as HTMLElement;
  // Intro animates the letters inside their masks; scroll animates the masks themselves,
  // so the two never fight over the same transform.
  const split = (sel: string) =>
    q(sel).length ? SplitText.create(q(sel), { type: "chars", mask: "chars", aria: "none" }) : { chars: [], masks: [] };
  const a = split(".board-first"), b = split(".board-hatzo"), c = split(".board-rest");
  const [first, rest] = [a.masks, c.masks];

  gsap
    .timeline({ defaults: { ease: "expo.out" }, delay: 0.15 })
    .from([...a.chars, ...b.chars, ...c.chars], { yPercent: 115, duration: 1.5, stagger: 0.035 })
    .from(q(".board-kicker > *"), { autoAlpha: 0, y: 14, stagger: 0.08, duration: 0.9 }, 0.35)
    .from(q(".pass"), { y: 120, autoAlpha: 0, rotation: 4, duration: 1.6 }, 0.55);

  // Where HATZO must go to sit centred and fill the stage (layout boxes, transforms ignored).
  const fit = () => {
    let x = 0, y = 0;
    for (let n: HTMLElement | null = hz; n && n !== stage; n = n.offsetParent as HTMLElement | null) {
      x += n.offsetLeft;
      y += n.offsetTop;
    }
    const W = stage.clientWidth, H = stage.clientHeight;
    const s = Math.min((W * 0.9) / hz.offsetWidth, (H * 0.46) / hz.offsetHeight);
    return { s, x: W / 2 - (x + hz.offsetWidth / 2), y: H * 0.44 - (y + hz.offsetHeight / 2) };
  };

  const lift = () => hz.offsetHeight * 1.15;
  gsap
    .timeline({
      defaults: { ease: "power2.in" },
      scrollTrigger: { trigger: el, start: "top top", end: "+=130%", pin: true, scrub: 0.6, invalidateOnRefresh: true },
    })
    .to(q(".board-kicker, .board-cue"), { autoAlpha: 0, duration: 0.12 }, 0)
    .to(first, { y: () => -lift(), rotation: -8, autoAlpha: 0, stagger: { each: 0.018, from: "end" }, duration: 0.28 }, 0)
    .to(rest, { y: () => lift(), rotation: 8, autoAlpha: 0, stagger: 0.02, duration: 0.28 }, 0.03)
    .to(hz, { x: () => fit().x, y: () => fit().y, scale: () => fit().s, duration: 0.5, ease: "power3.inOut" }, 0.18)
    .to(q(".pass-stub"), { rotation: 16, xPercent: 18, yPercent: 70, autoAlpha: 0, duration: 0.28 }, 0.22)
    .to(q(".pass-main"), { y: () => window.innerHeight * 0.5, rotation: -3, autoAlpha: 0, duration: 0.32 }, 0.36)
    .from(q(".board-sub"), { autoAlpha: 0, y: 24, duration: 0.2, ease: "power2.out" }, 0.62)
    .to({}, { duration: 0.18 });
}
