import { useEffect, useRef, useState } from "react";

// useCountUp — animate a number from 0 up to `target` the first time the
// element scrolls into view (the "benchmark bar filling in" effect from
// product pages). Returns [ref, value].
//
// Anyone who prefers reduced motion — or whose browser lacks the animation
// APIs — is shown the final value immediately, with no motion and no wait, so
// the number never depends on the animation to be readable.
//
// Usage:
//   const [ref, value] = useCountUp(88);
//   <span ref={ref} className="font-mono">{value}</span>
export default function useCountUp(target, { duration = 1200 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (
      prefersReduced ||
      !("IntersectionObserver" in window) ||
      !window.requestAnimationFrame
    ) {
      setValue(target);
      return;
    }

    let raf = 0;
    let startTime = null;

    const tick = (now) => {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease-out cubic so the count decelerates into its final value.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            raf = window.requestAnimationFrame(tick);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return [ref, value];
}
