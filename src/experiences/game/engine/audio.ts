export const TRACK_URL = "/" + encodeURIComponent("Kosh - Benefit Of The Doubt.mp3");

/** Synthesized SFX + the one streamed DJ track. Nothing is created before the first user gesture. */
export class Sound {
  ctx: AudioContext | null = null;
  master!: GainNode;
  muted = false;
  private engOsc!: OscillatorNode;
  private engOsc2!: OscillatorNode;
  private engGain!: GainNode;
  private engFilter!: BiquadFilterNode;
  private waveGain!: GainNode;
  private noise!: AudioBuffer;
  music: HTMLAudioElement | null = null;
  private analyser: AnalyserNode | null = null;
  private freq: Uint8Array<ArrayBuffer> | null = null;
  onMusicChange: (playing: boolean) => void = () => {};

  init() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(ctx.destination);
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // engine: two detuned saws through a lowpass that opens with speed
    this.engFilter = ctx.createBiquadFilter();
    this.engFilter.type = "lowpass";
    this.engFilter.frequency.value = 400;
    this.engFilter.Q.value = 4;
    this.engGain = ctx.createGain();
    this.engGain.gain.value = 0;
    this.engOsc = ctx.createOscillator();
    this.engOsc.type = "sawtooth";
    this.engOsc2 = ctx.createOscillator();
    this.engOsc2.type = "square";
    this.engOsc.connect(this.engFilter);
    this.engOsc2.connect(this.engFilter);
    this.engFilter.connect(this.engGain);
    this.engGain.connect(this.master);
    this.engOsc.start();
    this.engOsc2.start();

    // waves: looping noise, lowpassed, slow swell
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    this.waveGain = ctx.createGain();
    this.waveGain.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain);
    lfoGain.connect(this.waveGain.gain);
    src.connect(lp);
    lp.connect(this.waveGain);
    this.waveGain.connect(this.master);
    src.start();
    lfo.start();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  engine(speed01: number, throttle: number, boost: boolean, shoreProximity: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const f = 48 + speed01 * 120 + (boost ? 25 : 0);
    this.engOsc.frequency.setTargetAtTime(f, t, 0.06);
    this.engOsc2.frequency.setTargetAtTime(f * 1.01 * 0.5, t, 0.06);
    this.engFilter.frequency.setTargetAtTime(250 + speed01 * 900 + throttle * 300, t, 0.08);
    this.engGain.gain.setTargetAtTime(0.025 + speed01 * 0.05 + Math.abs(throttle) * 0.02, t, 0.1);
    this.waveGain.gain.setTargetAtTime(0.03 + shoreProximity * 0.07, t, 0.5);
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private hiss(dur: number, vol: number, freq: number, q = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    s.start(t, Math.random());
    s.stop(t + dur);
  }

  pickup(i = 0) {
    const base = 660 * Math.pow(2, (i % 5) / 12);
    this.tone("triangle", base, base * 1.5, 0.12, 0.18);
    this.tone("sine", base * 1.5, base * 2, 0.18, 0.12, 0.07);
  }
  horn() {
    this.tone("square", 520, 500, 0.16, 0.12);
    this.tone("square", 660, 640, 0.16, 0.08);
    this.tone("square", 520, 500, 0.22, 0.12, 0.2);
    this.tone("square", 660, 640, 0.22, 0.08, 0.2);
  }
  thud(v: number) {
    this.tone("sine", 120, 40, 0.25, Math.min(0.5, 0.08 + v * 0.03));
    this.hiss(0.15, Math.min(0.3, v * 0.02), 900);
  }
  jump() {
    this.tone("sine", 220, 520, 0.18, 0.08);
  }
  land(v: number) {
    this.hiss(0.2, Math.min(0.25, v * 0.02), 400);
  }
  splash() {
    this.hiss(0.9, 0.35, 700, 0.6);
  }
  click() {
    this.tone("triangle", 900, 700, 0.05, 0.08);
  }
  open() {
    this.tone("sine", 440, 660, 0.12, 0.1);
    this.tone("sine", 660, 880, 0.14, 0.07, 0.06);
  }
  achievement() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone("triangle", f, f, 0.22, 0.13, i * 0.09));
  }
  hit() {
    this.tone("square", 300, 180, 0.06, 0.08);
  }

  toggleMusic() {
    this.init();
    if (!this.ctx) return;
    if (!this.music) {
      const a = new Audio();
      a.preload = "none";
      a.src = TRACK_URL;
      a.loop = true;
      this.music = a;
      const src = this.ctx.createMediaElementSource(a);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
      const g = this.ctx.createGain();
      g.gain.value = 0.9;
      src.connect(this.analyser);
      this.analyser.connect(g);
      g.connect(this.master);
      a.addEventListener("play", () => this.onMusicChange(true));
      a.addEventListener("pause", () => this.onMusicChange(false));
    }
    if (this.music.paused) void this.music.play().catch(() => this.onMusicChange(false));
    else this.music.pause();
  }

  get playing() {
    return !!this.music && !this.music.paused;
  }

  /** 0..1 low-end energy for the speakers. */
  bass() {
    if (!this.analyser || !this.freq || !this.playing) return 0;
    this.analyser.getByteFrequencyData(this.freq);
    let s = 0;
    for (let i = 1; i < 6; i++) s += this.freq[i];
    return Math.max(0, (s / 5 / 255 - 0.45) / 0.55);
  }

  dispose() {
    this.music?.pause();
    void this.ctx?.close();
  }
}
