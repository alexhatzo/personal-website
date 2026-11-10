/** Keyboard state + a virtual joystick fed by the touch UI. */
export class Input {
  keys = new Set<string>();
  /** touch joystick: direction in screen space (x right, y up), magnitude 0..1 */
  joy = { x: 0, y: 0, active: false };
  jumpQueued = false;
  enabled = true;
  private onKey: (code: string, e: KeyboardEvent) => void;

  constructor(onKey: (code: string, e: KeyboardEvent) => void) {
    this.onKey = onKey;
    window.addEventListener("keydown", this.down);
    window.addEventListener("keyup", this.up);
    window.addEventListener("blur", this.blur);
  }

  private down = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    if (!e.repeat) this.onKey(e.code, e);
    if (!this.enabled) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      // keep the page from scrolling, but let Space/Enter activate focused buttons
      if (!(e.code === "Space" && t && t.tagName === "BUTTON")) e.preventDefault();
    }
    if (e.code === "Space" && !e.repeat) this.jumpQueued = true;
    this.keys.add(e.code);
  };
  private up = (e: KeyboardEvent) => this.keys.delete(e.code);
  private blur = () => this.keys.clear();

  has(...codes: string[]) {
    return codes.some((c) => this.keys.has(c));
  }

  dispose() {
    window.removeEventListener("keydown", this.down);
    window.removeEventListener("keyup", this.up);
    window.removeEventListener("blur", this.blur);
  }
}
