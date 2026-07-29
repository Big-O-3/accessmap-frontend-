// Small rounded tag used for accessibility features throughout the app
// (venue cards, the feature breakdown, recommendations, the add-venue preview).
//
// - "default"  → an accent-tinted chip for a present feature
// - "barrier"  → a red-tinted chip for a barrier (e.g. stairs)
// - "neutral"  → a plain grey chip
//
// Pass `dot` to show a small leading status dot, matching the mockup's chips.
const VARIANTS = {
  default: {
    chip: "bg-brand-50 text-link ring-brand-100",
    dot: "bg-brand-500",
  },
  barrier: {
    chip: "bg-danger-soft text-danger ring-danger-ring",
    dot: "bg-danger",
  },
  neutral: {
    chip: "bg-sand-100 text-ink-soft ring-sand-200",
    dot: "bg-ink-faint",
  },
};

export default function Pill({
  variant = "default",
  dot = false,
  className = "",
  children,
  ...props
}) {
  const styles = VARIANTS[variant] ?? VARIANTS.default;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles.chip} ${className}`}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
        />
      )}
      {children}
    </span>
  );
}
