import { useEffect, useRef, useState } from "react";

// Counts up to a number: 12 -> 0..12, "75%" -> 0..75%, "₹1200" is left as plain text.
// Respects "reduce motion" and falls back to the final value instantly.
export default function AnimatedNumber({ value, duration = 900 }) {
  const text = String(value ?? "");
  const match = text.match(/^(-?\d+(?:\.\d+)?)(\D*)$/);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : "";
  const decimals = match && match[1].includes(".") ? match[1].split(".")[1].length : 0;

  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (target === null) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || duration <= 0) {
      setShown(target);
      fromRef.current = target;
      return undefined;
    }

    const from = fromRef.current;
    let start = null; // taken from the first animation frame, so both clocks always agree
    let frame = 0;

    const tick = (now) => {
      if (start === null) start = now;
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      const current = from + (target - from) * eased;
      setShown(current);
      fromRef.current = current;
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  if (target === null) return <>{text}</>;

  return (
    <span className="animated-number">
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}
