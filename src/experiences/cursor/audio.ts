// Tiny synthesized soundscape: a filtered drone that opens up with cursor speed, plus blips.
const SCALE = [0, 3, 5, 7, 10, 12, 15]; // minor pentatonic-ish, one note per section

export class Synth {
  private ctx: AudioContext | null = null;
  private filter: BiquadFilterNode | null = null;
  private master: GainNode | null = null;

  get on() {
    return !!this.ctx && this.ctx.state === "running";
  }

  async toggle() {
    if (this.on) {
      await this.ctx!.suspend();
      return false;
    }
    if (!this.ctx) this.build();
    await this.ctx!.resume();
    return true;
  }

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(ctx.destination);
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 220;
    this.filter.Q.value = 6;
    const drone = ctx.createGain();
    drone.gain.value = 0.05;
    this.filter.connect(drone).connect(this.master);
    for (const [f, d] of [[55, -6], [55, 7], [82.4, 0]]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = d;
      o.connect(this.filter);
      o.start();
    }
  }

  speed(pxPerSec: number) {
    if (!this.on) return;
    const f = 200 + Math.min(pxPerSec, 4000) * 0.6;
    this.filter!.frequency.setTargetAtTime(f, this.ctx!.currentTime, 0.12);
  }

  note(index: number, long = false) {
    if (!this.on) return;
    const ctx = this.ctx!, t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 440 * Math.pow(2, (SCALE[index % SCALE.length] - 9) / 12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(long ? 0.12 : 0.07, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (long ? 1.4 : 0.35));
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 1.5);
  }

  whoosh() {
    if (!this.on) return;
    const ctx = this.ctx!, t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
    const g = ctx.createGain();
    g.gain.value = 0.18;
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t);
  }

  dispose() {
    void this.ctx?.close();
  }
}
