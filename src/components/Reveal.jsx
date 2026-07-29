import useReveal from "../hooks/useReveal";

// Reveal — wrap anything so it fades-and-rises into view on scroll.
//
// It applies the `rv` class (styled in src/index.css) and attaches the
// useReveal hook, which adds `in` the first time the element is seen. Because
// each <Reveal> is its own component, it's safe to use inside a .map() — every
// instance gets its own hook call. Stagger a group by passing an increasing
// `delay` (in seconds).
//
// Reduced-motion users skip the animation entirely (handled inside useReveal),
// so content is never hidden behind motion.
export default function Reveal({
  as: Comp = "div",
  delay = 0,
  className = "",
  style,
  children,
  ...props
}) {
  const ref = useReveal();
  return (
    <Comp
      ref={ref}
      className={`rv ${className}`}
      style={{ "--rv-delay": `${delay}s`, ...style }}
      {...props}
    >
      {children}
    </Comp>
  );
}
