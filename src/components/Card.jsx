// The one card surface used across the app: a rounded panel with a hairline
// border, the theme's surface color, and a soft shadow. Callers add their own
// padding (p-4 / p-5 / p-6) so the same card works at any density.
//
// Renders a <div> by default; pass `as` for a <section>, <article>, etc.
export default function Card({ as: Comp = "div", className = "", ...props }) {
  return (
    <Comp
      className={`rounded-2xl border border-sand-200 bg-surface shadow-sm ${className}`}
      {...props}
    />
  );
}
