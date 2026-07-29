// Shared button styles so every call site looks and behaves the same.
//
// Before this, the primary-button classes ("rounded-xl bg-brand-600 …
// hover:bg-brand-700 text-white") were copy-pasted across many pages. This one
// component owns them. Sizes carry a min-height so tap targets clear the 44px
// mobile guideline.
//
// It renders a real <button> by default. For a link that looks like a button,
// pass `as`: <Button as={Link} to="/search">…</Button> or <Button as="a" …>.
const VARIANTS = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
  outline:
    "bg-surface text-ink ring-1 ring-inset ring-sand-200 hover:bg-sand-100 hover:ring-brand-400",
  ghost: "text-ink-soft hover:bg-sand-100 hover:text-ink",
};

const SIZES = {
  sm: "text-sm px-3.5 rounded-lg min-h-9",
  md: "text-base px-4 rounded-xl min-h-11",
  lg: "text-lg px-6 rounded-xl min-h-12",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";
  return (
    <Comp
      className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
