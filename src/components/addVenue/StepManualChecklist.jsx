import { ACCESSIBILITY_FEATURES } from "../../lib/features";

// Manual checklist step — the no-photo path for a venue that already exists.
// Instead of uploading a photo for the AI to read, the contributor ticks the
// accessibility features they know about. These are recorded as
// community-confirmed features (trusted at full weight, same as confirmed AI
// detections) so they still feed the venue's score. A note can be added on the
// next step. Every row is a real checkbox with a visible label, so the whole
// thing is keyboard- and screen-reader-navigable.
export default function StepManualChecklist({
  venue,
  selected,
  onToggle,
  onSwitchToPhotos,
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-ink">
          Tell us what&apos;s accessible
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Adding to <span className="font-medium text-ink">{venue?.name}</span>{" "}
          without a photo. Tick everything you know about — leave the rest
          unchecked.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">Accessibility features present</legend>
        <ul className="divide-y divide-sand-100 rounded-xl bg-surface ring-1 ring-sand-200">
          {ACCESSIBILITY_FEATURES.map((feature) => {
            const id = `manual-${feature.key}`;
            const checked = !!selected[feature.key];
            return (
              <li key={feature.key}>
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(feature.key)}
                      className="h-4 w-4 rounded border-sand-200 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-ink">
                      {feature.label}
                    </span>
                  </span>
                  {feature.barrier && (
                    <span className="text-xs font-semibold text-red-600">
                      Barrier
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <p className="text-sm text-ink-soft">
        Have a photo instead?{" "}
        <button
          type="button"
          onClick={onSwitchToPhotos}
          className="font-medium text-link hover:underline"
        >
          Upload one for the AI to analyze
        </button>
        .
      </p>
    </div>
  );
}
