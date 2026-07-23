// Progress stepper for the Add Venue flow. Purely presentational — the current
// step lives in the page's reducer. Rendered as an ordered list so screen
// readers announce "step N of 4" and the current step is marked aria-current.
const STEPS = [
  { n: 1, label: "Venue" },
  { n: 2, label: "Photos" },
  { n: 3, label: "AI Review" },
  { n: 4, label: "Submit" },
];

export default function Stepper({ current }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const done = step.n < current;
          const active = step.n === current;
          return (
            <li key={step.n} className="flex flex-1 items-center gap-1 sm:gap-2">
              <div
                className="flex items-center gap-2"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ${
                    active
                      ? "bg-brand-600 text-white ring-brand-600"
                      : done
                        ? "bg-brand-100 text-link ring-brand-200"
                        : "bg-surface text-ink-faint ring-sand-200"
                  }`}
                >
                  {done ? "✓" : step.n}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:inline ${
                    active ? "text-link" : "text-ink-soft"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded ${
                    done ? "bg-brand-300" : "bg-sand-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs text-ink-soft sm:hidden">
        Step {current} of {STEPS.length} · {STEPS[current - 1].label}
      </p>
    </nav>
  );
}
