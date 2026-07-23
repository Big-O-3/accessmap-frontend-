import { useEffect, useRef } from "react";

// A soft spotlight that follows the pointer. Writes the cursor position to
// CSS custom properties (--cursor-x/--cursor-y) that the .cursor-glow layer in
// index.css reads. Updates are batched into a single rAF so rapid mousemove
// events never thrash layout. Hidden on touch devices (no pointer to follow)
// and for users who prefer reduced motion (handled in CSS).
export default function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    // Skip on devices without a fine pointer (phones/tablets).
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = ref.current;
    let frame = 0;
    let x = -100;
    let y = -100;

    function onMove(e) {
      x = e.clientX;
      y = e.clientY;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (el) {
            el.style.setProperty("--cursor-x", `${x}px`);
            el.style.setProperty("--cursor-y", `${y}px`);
          }
        });
      }
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}
