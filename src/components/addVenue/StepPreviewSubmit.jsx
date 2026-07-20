import { useEffect, useRef } from "react";
import ScoreBadge from "../ScoreBadge";
import { featureLabel } from "../../lib/features";

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
        className="rounded-xl bg-green-50 p-6 text-center ring-1 ring-green-600/20"
      >
        <p
          ref={successHeadingRef}
          tabIndex={-1}
          className="text-lg font-semibold text-green-800 outline-none"
        >
          Contribution submitted
        </p>
        <p className="mt-2 text-sm text-green-700">
          Your {result.featuresConfirmed} confirmed feature
          {result.featuresConfirmed === 1 ? "" : "s"} for{" "}
          <span className="font-medium">{venue?.name}</span> entered the
          community verification queue.
        </p>
        <p className="mt-1 text-sm text-green-700">
          Preview accessibility score: {result.previewScore}/100
        </p>
        <button
          type="button"
          onClick={onViewVenue}
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          View venue →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Preview &amp; submit
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {venue?.name}
          {venue?.address ? ` · ${venue.address}` : ""}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white p-5 ring-1 ring-gray-200">
        <div>
          <p className="text-sm text-gray-500">Estimated accessibility score</p>
          <p className="text-xs text-gray-400">
            Preview — updates as the community verifies features
          </p>
        </div>
        <ScoreBadge score={previewScore} size="lg" />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700">
          Confirmed features ({features.length})
        </h3>
        {features.length === 0 ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-600/20">
            No features confirmed yet. Go back to the AI review step and confirm
            at least one detection before submitting.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {features.map((f) => (
              <li
                key={f.type}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
              >
                {featureLabel(f.type)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label
          htmlFor="contribution-note"
          className="block text-sm font-medium text-gray-700"
        >
          Add a note (optional)
        </label>
        <textarea
          id="contribution-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
          placeholder="e.g. Ramp is on the left side of the main entrance."
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Your photos will enter the community verification queue. Features are
        confirmed by the community before they count toward the official score.
      </p>

      {submitState === "error" && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/20"
        >
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitState === "submitting" || features.length === 0}
        className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {submitState === "submitting"
          ? "Submitting…"
          : "Submit contribution ✓"}
      </button>
    </div>
  );
}
