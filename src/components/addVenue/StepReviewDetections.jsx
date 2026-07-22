import { useEffect, useState } from "react";
import DetectionImage from "../DetectionImage";
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

  // Trigger analysis for any photo that hasn't been analyzed yet, once.
  useEffect(() => {
    for (const photo of photos) {
      if (photo.status === "pending") onAnalyze(photo.id);
    }
    // We intentionally depend only on the set of photo ids/statuses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.map((p) => `${p.id}:${p.status}`).join(",")]);

  if (photos.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No photos to review. Go back and add at least one photo.
      </p>
    );
  }

  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Confirm what the AI found
        </h2>
        <p className="mt-1 text-sm text-gray-500">
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
            className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-40"
          >
            ◀ Prev
          </button>
          <span className="text-gray-500" aria-live="polite">
            Photo {active + 1} of {photos.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setActive((a) => Math.min(photos.length - 1, a + 1))
            }
            disabled={active === photos.length - 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-40"
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
      <div
        className="rounded-xl bg-white p-8 text-center text-sm text-gray-600 ring-1 ring-gray-200"
        role="status"
      >
        Analyzing photo… this can take a few seconds.
      </div>
    );
  }

  if (photo.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-700 ring-1 ring-red-600/20"
      >
        <p className="font-medium">Couldn&apos;t analyze this photo.</p>
        <p className="mt-1">{photo.error}</p>
        <p className="mt-1 text-xs text-red-600">
          Make sure the backend and ML service are reachable.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
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
        <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-200">
          No accessibility features detected in this photo. Try a clearer photo
          of the entrance, restroom, parking, or seating.
        </p>
      ) : (
        <fieldset>
          <legend className="sr-only">
            Detected accessibility features — uncheck any the AI got wrong
          </legend>
          <ul className="divide-y divide-gray-100 rounded-xl bg-white ring-1 ring-gray-200">
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
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {featureLabel(d.accessibilityFeature)}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
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
        <p className="text-xs text-gray-400">
          Suggested alt text: {photo.altText}
        </p>
      )}
    </div>
  );
}
