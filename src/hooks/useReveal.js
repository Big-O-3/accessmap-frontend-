import { useEffect, useRef } from "react";

// useReveal - fade-and-rise an element in the first time it scrolls into view.
//
// Attach the returned ref to an element that also has the `rv` class (defined
// in src/index.css). When that element enters the viewport we add the `in`
// class once and stop watching it. Anyone who prefers reduced motion (or whose
// browser lacks IntersectionObserver) skips the animation and sees the content
// right away.
//
// Usage:
//   const ref = useReveal();
//   <section ref={ref} className="rv" style={{ "--rv-delay": "0.1s" }}>…</section>
export default function useReveal({
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.15,
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return ref;
}
