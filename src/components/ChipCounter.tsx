import { useEffect, useRef, useState } from "react";
import "./ChipCounter.css";

interface ChipCounterProps {
  value: number;
}

/**
 * A brass-plaque counter that tweens toward the new balance instead of
 * snapping, evoking a mechanical tally rather than a plain number.
 */
export function ChipCounter({ value }: ChipCounterProps) {
  const [displayed, setDisplayed] = useState(value);
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef(value);

  useEffect(() => {
    fromRef.current = displayed;
    const from = fromRef.current;
    const to = value;
    const start = performance.now();
    const duration = 500;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const rising = displayed < value;
  const falling = displayed > value;

  return (
    <div
      className="chip-counter"
      role="status"
      aria-label={`Chip balance: ${value.toLocaleString()}`}
    >
      <span className="chip-counter__rivet chip-counter__rivet--tl" />
      <span className="chip-counter__rivet chip-counter__rivet--tr" />
      <span className="chip-counter__rivet chip-counter__rivet--bl" />
      <span className="chip-counter__rivet chip-counter__rivet--br" />
      <span className="chip-counter__label">Chips</span>
      <span
        className={`chip-counter__value ${rising ? "is-rising" : ""} ${falling ? "is-falling" : ""}`}
      >
        {displayed.toLocaleString()}
      </span>
    </div>
  );
}
