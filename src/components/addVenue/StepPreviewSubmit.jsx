import { useEffect, useRef } from "react";
import ScoreBadge from "../ScoreBadge";
import Button from "../Button";
import Pill from "../Pill";
import { featureLabel } from "../../lib/features";
import { scoreVerdict } from "../../lib/score";

// Step 4 · Preview & Submit.
// Shows the auto-calculated preview score (from the same scoring model the
// backend uses) and the confirmed features, plus an optional note. On submit
// the contribution enters the community verification queue. The success state
// replaces the form and offers a link to the venue.
export default function StepPreviewSubmit({
  venue,
  features,
  previewScore,
  note,
  onNoteChange,
  submitState,
  submitError,
  result,
  onSubmit,
  onViewVenue,
}) {
  // A contribution is submittable with at least one feature OR a written note.
  const canSubmit = features.length > 0 || note.trim().length > 0;
  const successHeadingRef = useRef(null);

  // Move focus to the success heading when submission completes so screen-reader
  // users are taken to (and hear) the confirmation instead of being orphaned on
  // a now-unmounted submit button.
  const done = submitState === "done" && !!result;
  useEffect(() => {
    if (done) successHeadingRef.current?.focus();
  }, [done]);

  if (done) {
    return (
      <div
        role="status"
        className="rounded-2xl bg-success-soft p-6 text-center ring-1 ring-inset ring-success-ring"
      >
        <p
          ref={successHeadingRef}
          tabIndex={-1}
          className="font-display text-xl font-extrabold text-success outline-none"
        >
          Contribution submitted
        </p>
        <p className="mt-2 text-base text-ink-soft">
          {result.featuresConfirmed > 0 ? (
            <>
              Your {result.featuresConfirmed} confirmed feature
              {result.featuresConfirmed === 1 ? "" : "s"} for{" "}
              <span className="font-medium text-ink">{venue?.name}</span> entered
              the community verification queue.
            </>
          ) : (
            <>
              Your note for{" "}
              <span className="font-medium text-ink">{venue?.name}</span> was
              recorded.
            </>
          )}
        </p>
        <p className="mt-1 text-base text-ink-soft">
          Preview rating:{" "}
          {scoreVerdict(result.previewScore)?.label ?? "Not yet rated"}
        </p>
        <Button type="button" onClick={onViewVenue} className="mt-4">
          View venue →
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-ink">
          Preview &amp; submit
        </h2>
        <p className="mt-1 text-base text-ink-soft">
          {venue?.name}
          {venue?.address ? ` · ${venue.address}` : ""}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-surface p-5 ring-1 ring-sand-200">
        <div>
          <p className="text-base text-ink-soft">Estimated accessibility</p>
          <p className="text-sm text-ink-faint">
            Preview — updates as the community verifies features
          </p>
        </div>
        <ScoreBadge score={previewScore} size="lg" />
      </div>

      <div>
        <h3 className="text-base font-medium text-ink-soft">
          Confirmed features ({features.length})
        </h3>
        {features.length === 0 ? (
          <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 text-base text-warning ring-1 ring-inset ring-warning-ring">
            No features selected. Go back to add at least one feature, or leave a
            note below describing this venue before submitting.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {features.map((f) => (
              <li key={f.type}>
                <Pill dot>{featureLabel(f.type)}</Pill>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label
          htmlFor="contribution-note"
          className="block text-base font-medium text-ink-soft"
        >
          Add a note (optional)
        </label>
        <textarea
          id="contribution-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
          placeholder="e.g. Ramp is on the left side of the main entrance."
          className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-base text-ink placeholder:text-ink-faint outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <p className="rounded-lg bg-sand-100 px-3 py-2 text-sm text-ink-soft">
        Your contribution enters the community verification queue. Features are
        confirmed by the community before they count toward the official score.
      </p>

      {submitState === "error" && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-3 py-2 text-base text-danger ring-1 ring-inset ring-danger-ring"
        >
          {submitError}
        </p>
      )}

      <Button
        type="button"
        onClick={onSubmit}
        loading={submitState === "submitting"}
        disabled={!canSubmit}
        className="w-full"
      >
        Submit contribution ✓
      </Button>
    </div>
  );
}
