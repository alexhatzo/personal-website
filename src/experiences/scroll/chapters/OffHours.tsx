import { useEffect, useRef, useState } from "react";
import type { PortfolioData } from "../../../types/portfolio";
import { Chips, Hl, Kicker } from "../bits";
import { hostOf, projectsIn } from "../state";

const BPM = 128;
const BARS = 44;
const TRACK = { src: "/Kosh%20-%20Benefit%20Of%20The%20Doubt.mp3", label: "Kosh — Benefit Of The Doubt" };

export default function OffHours({ data }: { data: PortfolioData }) {
  const life = projectsIn(data, "Life");
  const dj = life.find((p) => /\bDJ/i.test(p.title));
  const rest = life.filter((p) => p !== dj);

  const deck = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const live = useRef(false);
  const [playing, setPlaying] = useState(false);

  // One rAF loop drives the waveform, beat lights and metronome: 128 bpm synthetic pulse,
  // or the real spectrum while the track plays. Runs only while the deck is on screen.
  useEffect(() => {
    const el = deck.current;
    const player = audio.current;
    if (!el) return;
    const bars = Array.from(el.querySelectorAll<HTMLElement>(".dj-wave i"));
    const beats = Array.from(el.querySelectorAll<HTMLElement>(".dj-beats i"));
    const arm = el.querySelector<HTMLElement>(".dj-arm");
    const shape = bars.map((_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i * 0.83) * Math.cos(i * 0.31)));
    const freq = new Uint8Array(64);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bars.forEach((b, i) => (b.style.transform = `scaleY(${shape[i] * 0.6})`));
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const beat = ((now / 1000) * BPM) / 60;
      const env = Math.exp(-(beat % 1) * 5);
      const an = live.current ? analyser.current : null;
      if (an) an.getByteFrequencyData(freq);
      for (let i = 0; i < bars.length; i++) {
        const v = an
          ? freq[Math.floor((i * 40) / bars.length)] / 255
          : shape[i] * (0.2 + 0.8 * env * (0.55 + 0.45 * Math.sin(i * 1.7 + Math.floor(beat) * 2.1)));
        bars[i].style.transform = `scaleY(${(0.05 + v * 0.95).toFixed(3)})`;
      }
      const n = Math.floor(beat) % 4;
      beats.forEach((d, i) => d.classList.toggle("on", i === n));
      if (arm) arm.style.transform = `rotate(${(Math.cos(beat * Math.PI) * 26).toFixed(2)}deg)`;
    };

    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting && !still) raf = requestAnimationFrame(frame);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      player?.pause();
      audioCtx.current?.close();
    };
  }, []);

  const toggle = async () => {
    const a = audio.current;
    if (!a) return;
    if (!a.paused) return a.pause();
    if (!audioCtx.current) {
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 128;
      an.smoothingTimeConstant = 0.75;
      ctx.createMediaElementSource(a).connect(an);
      an.connect(ctx.destination);
      audioCtx.current = ctx;
      analyser.current = an;
    }
    await audioCtx.current.resume();
    await a.play().catch(() => undefined);
  };

  return (
    <section className="ch ch-off" data-ch="8" aria-labelledby="h-off">
      <header className="off-head" data-r>
        <Kicker n={8}>Off-hours</Kicker>
        <h2 id="h-off" className="off-title">
          Off the <em>clock</em>
        </h2>
      </header>

      <div className="off-grid">
        {dj && (
          <article className="dj" data-r>
            <div className="dj-deck" ref={deck} aria-hidden="true">
              <div className="dj-bpm">
                <span className="dj-bpm-n">{BPM}</span>
                <span className="dj-bpm-u">BPM</span>
              </div>
              <div className="dj-metro">
                <span className="dj-arm" />
              </div>
              <div className="dj-beats">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="dj-wave">
                {Array.from({ length: BARS }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
            </div>
            <h3 className="dj-title">{dj.title}</h3>
            <p className="dj-desc">{dj.description}</p>
            <Chips items={dj.tech} />
            <div className="dj-actions">
              {dj.link && (
                <a className="dj-link" href={dj.link} target="_blank" rel="noreferrer">
                  {hostOf(dj.link)} <span aria-hidden="true">↗</span>
                </a>
              )}
              <button
                type="button"
                className="dj-play"
                aria-pressed={playing}
                onClick={() => {
                  live.current = !playing;
                  void toggle();
                }}
              >
                <span className="dj-play-icon" aria-hidden="true">
                  {playing ? "❚❚" : "▶"}
                </span>
                {playing ? "Pause" : "Play"} {TRACK.label}
              </button>
            </div>
            <audio
              ref={audio}
              src={TRACK.src}
              preload="none"
              onPlay={() => {
                live.current = true;
                setPlaying(true);
              }}
              onPause={() => {
                live.current = false;
                setPlaying(false);
              }}
            />
          </article>
        )}

        <div className="life">
          {rest.map((p, i) => (
            <article className={`life-card life-card--${i % 2 ? "ticket" : "linen"}`} key={p.title} data-r>
              <p className="life-n" aria-hidden="true">
                {i % 2 ? "Admit one" : "100% linen"}
              </p>
              <h3 className="life-title">{p.title}</h3>
              <p className="life-desc">
                <Hl text={p.description} />
              </p>
              <Chips items={p.tech} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
