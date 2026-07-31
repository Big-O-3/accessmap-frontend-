import { useToasts } from "../hooks/useToasts";
import { dismiss } from "../lib/toast";

// Renders the app-wide toast stack (store in src/lib/toast.js). Fixed above all
// app chrome; bottom-center on phones (clear of the bottom nav + safe area),
// bottom-right on desktop. Each toast carries its own role so screen readers
// announce it when it appears: role="alert" (assertive) for errors, role="status"
// (polite) otherwise. The enter animation lives in index.css and is disabled
// under prefers-reduced-motion.
const TOAST_STYLES = {
  success: { ring: "ring-success-ring", icon: "text-success", glyph: "✓" },
  error: { ring: "ring-danger-ring", icon: "text-danger", glyph: "!" },
  info: { ring: "ring-brand-200", icon: "text-link", glyph: "i" },
};

export default function ToastViewport() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end">
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.type] ?? TOAST_STYLES.info;
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`toast-item pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-surface px-4 py-3 text-ink shadow-lg ring-1 ring-inset ${s.ring}`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-sm font-bold ${s.icon}`}
            >
              {s.glyph}
            </span>
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 flex-none rounded-md p-1 text-lg leading-none text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
