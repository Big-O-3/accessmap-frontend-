import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DetectionImage from "../DetectionImage";
import ScanningOverlay from "../ScanningOverlay";
import Button from "../Button";
import { featureLabel } from "../../lib/features";

// Step 3 · AI Detection Review (the primary ML feature).
// Each uploaded photo is analyzed by the ML service, then shown with bounding
// boxes and a per-detection checklist. Every detection is announced as TEXT
// (feature name + confidence), not conveyed by the boxes alone — critical for
// screen-reader users. The contributor has the final say: uncheck false
// positives. High-confidence detections start pre-checked (handled by the
// reducer). Analysis is kicked off once per photo when this step mounts.
export default function StepReviewDetections({
  photos,
  confirmed,
  detKey,
  onAnalyze,
  onToggle,
}) {
  const [active, setActive] = useState(0);

  // Analyze photos ONE AT A TIME, not all at once. The ML service runs a single
  // inference near the memory ceiling of its instance, so firing every pending
  // photo concurrently used to OOM-kill it (a 502 to the user). We kick off the
  // next pending photo only when nothing else is currently analyzing; each
  // completion re-runs this effect and starts the following one.
  useEffect(() => {
    const inFlight = photos.some((p) => p.status === "analyzing");
    if (inFlight) return;
    const next = photos.find((p) => p.status === "pending");
    if (next) onAnalyze(next.id);
    // We intentionally depend only on the set of photo ids/statuses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.map((p) => `${p.id}:${p.status}`).join(",")]);

  if (photos.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        No photos to review. Go back and add at least one photo.
      </p>
    );
  }

  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-extrabold text-ink">
          Confirm what the AI found
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Our AI analyzed your photos. Uncheck anything it got wrong — you have
          the final say.
        </p>
      </div>

      {/* Photo pager */}
      {photos.length > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setActive((a) => Math.max(0, a - 1))}
            disabled={active === 0}
            className="rounded-xl border border-sand-200 px-3 py-1.5 text-ink-soft disabled:opacity-40"
          >
            ◀ Prev
          </button>
          <span className="text-ink-soft" aria-live="polite">
            Photo {active + 1} of {photos.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setActive((a) => Math.min(photos.length - 1, a + 1))
            }
            disabled={active === photos.length - 1}
            className="rounded-xl border border-sand-200 px-3 py-1.5 text-ink-soft disabled:opacity-40"
          >
            Next ▶
          </button>
        </div>
      )}

      <PhotoReview
        photo={current}
        confirmed={confirmed}
        detKey={detKey}
        onToggle={onToggle}
        onRetry={() => onAnalyze(current.id)}
      />
    </div>
  );
}

function PhotoReview({ photo, confirmed, detKey, onToggle, onRetry }) {
  if (photo.status === "analyzing" || photo.status === "pending") {
    return (
      <ScanningOverlay
        imageUrl={photo.previewUrl}
        label="Analyzing photo… this can take a few seconds."
      />
    );
  }

  // An expired session and an unreachable service both surface here, but the
  // fix is completely different — retrying a 401 will never work. Say so, and
  // point at the login page instead of at the ML service.
  if (photo.status === "error" && photo.authError) {
    // The backend separates a genuinely expired session from a token it could
    // not verify at all. Only the first is fixed by signing in again; offering
    // that button for the second walks people round a loop that cannot ever
    // succeed, because the thing to fix is on the server. Default to treating
    // an unlabelled 401 as an expiry — that's the common case.
    const expired = !photo.error || /expired/i.test(photo.error);
    return (
      <div
        role="alert"
        className="rounded-xl bg-warning-soft p-6 text-center text-sm text-warning ring-1 ring-inset ring-warning-ring"
      >
        <p className="font-semibold">
          {expired ? "Your session expired." : photo.error}
        </p>
        {expired ? (
          <>
            <p className="mt-1">
              Sign in again to analyze photos. Anything on this page won&apos;t
              be saved, so you&apos;ll need to re-add your photos afterwards.
            </p>
            <Button as={Link} to="/login" size="sm" className="mt-3">
              Sign in again
            </Button>
          </>
        ) : (
          <p className="mt-1">
            The server couldn&apos;t verify your sign-in, so signing in again
            won&apos;t help — the backend&apos;s Supabase credentials need
            attention.
          </p>
        )}
      </div>
    );
  }

  if (photo.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-xl bg-danger-soft p-6 text-center text-sm text-danger ring-1 ring-inset ring-danger-ring"
      >
        <p className="font-semibold">Couldn&apos;t analyze this photo.</p>
        <p className="mt-1">{photo.error}</p>
        {/* Reassure the contributor that the failed analysis left nothing
            behind — the photo is rolled back on failure (see analyzePhoto). */}
        <p className="mt-1 text-xs opacity-80">
          This photo wasn&apos;t saved to the venue. Make sure the backend and
          ML service are reachable, then retry.
        </p>
        <Button type="button" onClick={onRetry} size="sm" className="mt-3">
          Retry
        </Button>
      </div>
    );
  }

  const detections = photo.detections ?? [];

  return (
    <div className="space-y-4">
      {/* Announce completion + result count to screen readers (the boxes and
          checklist below are visual/interactive; this is the text summary). */}
      <p className="sr-only" role="status">
        {detections.length === 0
          ? "Analysis complete. No accessibility features detected in this photo."
          : `Analysis complete. ${detections.length} accessibility feature${
              detections.length === 1 ? "" : "s"
            } detected — review and confirm below.`}
      </p>

      {/* photo shape DetectionImage expects */}
      <DetectionImage photo={{ imageUrl: photo.previewUrl, detections }} />

      {detections.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-ink-soft ring-1 ring-sand-200">
          No accessibility features detected in this photo. Try a clearer photo
          of the entrance, restroom, parking, or seating.
        </p>
      ) : (
        <fieldset>
          <legend className="sr-only">
            Detected accessibility features — uncheck any the AI got wrong
          </legend>
          <ul className="divide-y divide-sand-100 rounded-xl bg-surface ring-1 ring-sand-200">
            {detections.map((d, idx) => {
              const key = detKey(photo.id, idx);
              const pct = Math.round((d.confidence ?? 0) * 100);
              const id = `det-${key}`;
              return (
                <li key={key}>
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="flex items-center gap-3">
                      <input
                        id={id}
                        type="checkbox"
                        checked={!!confirmed[key]}
                        onChange={() => onToggle(photo.id, idx)}
                        className="h-4 w-4 rounded border-sand-200 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm font-medium text-ink">
                        {featureLabel(d.accessibilityFeature)}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-ink-soft">
                      {pct}% confidence
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {photo.altText && (
        <p className="text-xs text-ink-faint">
          Suggested alt text: {photo.altText}
        </p>
      )}
    </div>
  );
}
