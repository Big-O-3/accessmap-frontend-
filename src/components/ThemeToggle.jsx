import { useEffect, useState } from "react";

// Light/dark theme switch. The initial <html class="dark"> is set pre-paint by
// the inline script in index.html; this component reads that state, lets the
// user flip it, and persists the choice to localStorage.
export default function ThemeToggle({ compact = false }) {
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem("accessmap-theme", dark ? "dark" : "light");
    } catch (e) {
      // Ignore storage errors (private mode) — theme still applies for the session.
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`inline-flex items-center justify-center rounded-lg text-ink-soft hover:bg-sand-100 hover:text-ink transition-colors ${
        compact ? "px-3 py-3 text-base w-full justify-start gap-2" : "h-9 w-9"
      }`}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {dark ? "☀" : "☾"}
      </span>
      {compact && <span>{dark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
