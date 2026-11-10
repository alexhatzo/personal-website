import { useRef, useState } from "react";
import { PLACE, type PlaceId } from "../engine/places";

/** Left-thumb joystick + right-thumb action buttons. */
export default function Touch({
  near,
  onJoy,
  onJump,
  onHorn,
  onInteract,
}: {
  near: PlaceId | null;
  onJoy: (x: number, y: number, active: boolean) => void;
  onJump: () => void;
  onHorn: () => void;
  onInteract: () => void;
}) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const id = useRef<number | null>(null);
  const R = 52;
  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const l = Math.hypot(x, y);
    if (l > R) {
      x = (x / l) * R;
      y = (y / l) * R;
    }
    setKnob({ x, y });
    onJoy(x / R, -y / R, true);
  };
  const end = () => {
    id.current = null;
    setKnob({ x: 0, y: 0 });
    onJoy(0, 0, false);
  };
  const p = near ? PLACE[near] : null;
  return (
    <div className="hz-touch">
      <div
        ref={base}
        className="hz-joy"
        onPointerDown={(e) => {
          id.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={(e) => id.current === e.pointerId && move(e)}
        onPointerUp={end}
        onPointerCancel={end}
        aria-hidden
      >
        <div className="hz-joy__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="hz-acts">
        {p && (
          <button className="hz-act hz-act--open" onClick={onInteract} style={{ ["--accent" as string]: p.color }}>
            <b>Open</b>
            <small>{p.name}</small>
          </button>
        )}
        <button className="hz-act hz-act--jump" onPointerDown={onJump} aria-label="Jump">
          Jump
        </button>
        <button className="hz-act hz-act--horn" onPointerDown={onHorn} aria-label="Horn">
          Horn
        </button>
      </div>
    </div>
  );
}
