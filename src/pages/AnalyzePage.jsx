import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DetectionImage from "../components/DetectionImage";
import CameraCapture from "../components/CameraCapture";
import PlaceAutocomplete from "../components/PlaceAutocomplete";
import ScanningOverlay from "../components/ScanningOverlay";
import Button from "../components/Button";
import {
  analyzeImage,
  featureChecklist,
  summarizeAccessibility,
} from "../lib/detect";
import { saveAnalyzedVenue } from "../lib/api";

// Plain-English verdict shown at the top of the results, keyed by summary.level.
// Colors come from the shared tier tokens (success / warning / danger) so the
// verdict matches score plates, map pins, and banners everywhere else.
const VERDICTS = {
  accessible: {
    text: "Looks accessible",
    detail: "Accessible features detected, with no barriers spotted in this photo.",
    className: "bg-success-soft text-success ring-success-ring",
  },
  partial: {
    text: "Partially accessible",
    detail: "Some accessible features detected, but also a barrier — check the details.",
    className: "bg-warning-soft text-warning ring-warning-ring",
  },
  "not-accessible": {
    text: "Barriers detected",
    detail: "A barrier was detected and no accessible features were found in this photo.",
    className: "bg-danger-soft text-danger ring-danger-ring",
  },
  unknown: {
    text: "No features detected",
    detail: "Nothing recognizable was found. Try a clearer photo of the entrance.",
    className: "bg-sand-100 text-ink-soft ring-sand-200",
  },
};

// Upload a venue photo or capture one with the device camera, run it through
// Grounding DINO, and preview the accessibility score + detected features.
export default function AnalyzePage() {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null); // { detections, altTextSuggestion }
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [venueName, setVenueName] = useState("");
  // When the user picks a place from the autocomplete, remember its
  // coordinates — that's where the venue actually is, not where the phone is.
  const [pickedPlace, setPickedPlace] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  // The contributor's confirm/reject decision per detected feature, keyed by
  // feature key ({ entrance_detected: true }). AI detections are a starting
  // point — the user has the final say, exactly like the Add-Venue review step.
  // High-confidence hits start checked; "likely" ones start unchecked so the
  // user opts in. Everything downstream (score, verdict, counts, the boxes on
  // the photo, and the save) reads from this set, not the raw ML output.
  const [confirmed, setConfirmed] = useState({});

  function toggleFeature(key) {
    setConfirmed((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  }

  // Get the browser's current position as a Promise.
  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Location isn't available on this device."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("Couldn't get your location. Allow location access.")),
      );
    });
  }

  // Save this analysis at the user's location under the given venue name —
  // persists as a real venue via the contributions API so it shows up on the
  // shared map for everyone.
  async function confirmPlaceOnMap() {
    if (!venueName.trim()) {
      setError("Please enter a name for this place.");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      // Prefer the picked place's coordinates (the venue's actual location).
      // Only fall back to the phone's location if the user typed a name
      // without picking a suggestion.
      const coords = pickedPlace
        ? { lat: pickedPlace.latitude, lng: pickedPlace.longitude }
        : await getPosition();
      await saveAnalyzedVenue({
        name: venueName.trim(),
        lat: coords.lat,
        lng: coords.lng,
        // Save only what the contributor confirmed, not every raw detection.
        detections: confirmedDetections,
      });
      navigate("/search");
    } catch (err) {
      setPlacing(false);
      setError(err.message || "Couldn't save this place.");
    }
  }

  async function handleFile(file) {
    if (!file) return;

    // Show the picked image immediately while we analyze it.
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setConfirmed({}); // clear a prior photo's decisions
    setStatus("loading");

    try {
      const data = await analyzeImage(file);
      // Pre-confirm high-confidence detections (matching Add-Venue's behavior);
      // "likely" ones are shown unchecked so the user consciously confirms them.
      const initial = {};
      for (const d of data.detections ?? []) {
        if (d.highConfidence ?? d.confidence >= 0.85) {
          initial[d.accessibilityFeature] = true;
        }
      }
      setConfirmed(initial);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.message || "Something went wrong analyzing the photo.");
      setStatus("error");
    }
  }

  const detections = result?.detections ?? [];
  // Only the detections whose feature the contributor has confirmed. The score,
  // verdict, counts, and the save all flow from this set — unchecking a feature
  // takes it out of every one of them, so the preview reflects the user's call,
  // not just the model's.
  const confirmedDetections = detections.filter(
    (d) => confirmed[d.accessibilityFeature],
  );
  const summary = result ? summarizeAccessibility(confirmedDetections) : null;
  // The checklist still lists every feature (so the user sees what was and
  // wasn't detected); the detected rows carry a checkbox driven by `confirmed`.
  const checklist = result ? featureChecklist(detections) : [];
  const totalAccessibleFeatures = checklist.filter(
    (row) => row.status !== "barrier" && row.key !== "stairs_present",
  ).length;
  const confirmedAccessibleCount = checklist.filter(
    (row) => row.status === "yes" && confirmed[row.key],
  ).length;
  const barrierCount = checklist.filter(
    (row) => row.status === "barrier" && confirmed[row.key],
  ).length;

  // A photo object in the shape DetectionImage expects. Only confirmed
  // detections get boxes — unchecking a feature in the checklist removes its
  // box from the photo too, so the overlay always matches what the user has
  // agreed the AI got right.
  const photo = previewUrl
    ? { imageUrl: previewUrl, detections: confirmedDetections }
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink">
          Check a venue's accessibility
        </h1>
        <p className="mt-2 text-base sm:text-lg text-ink-soft">
          Upload a photo and our AI will detect accessibility features — ramps,
          doors, seating, restrooms — and flag barriers like stairs, with a
          preview score.
        </p>
      </header>

      {/* Two ways to add a photo: upload a file or open the camera. */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <label
          htmlFor="photo-input"
          className="block cursor-pointer rounded-2xl border-2 border-dashed border-sand-200 bg-surface p-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 focus-within:border-brand-500"
        >
          <span className="block font-medium text-ink">
            Upload a photo
          </span>
          <span className="mt-1 block text-sm text-ink-soft">
            JPG or PNG from your device
          </span>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className="rounded-2xl border-2 border-dashed border-sand-200 bg-surface p-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 focus:border-brand-500 focus:outline-none"
        >
          <span className="block font-medium text-ink">
            Take a photo
          </span>
          <span className="mt-1 block text-sm text-ink-soft">
            Use your device's camera
          </span>
        </button>
      </div>

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => {
            setCameraOpen(false);
            handleFile(file);
          }}
        />
      )}

      {status === "loading" && (
        <div className="mt-8">
          <ScanningOverlay
            imageUrl={previewUrl}
            label="Analyzing photo… this can take a few seconds."
          />
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="mt-8 rounded-xl bg-danger-soft p-4 text-center text-base text-danger ring-1 ring-inset ring-danger-ring"
        >
          <p className="font-semibold">Couldn't analyze the photo.</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-sm opacity-80">
            Make sure the ML service is running on its port.
          </p>
        </div>
      )}

      {/* Results */}
      {status === "done" && photo && (
        <section className="mt-8 space-y-6">
          {/* Camera guidance from the ML service — non-venue warning and/or a
              framing hint (step back / step closer / recenter). aria-live so
              screen readers announce it after each capture. */}
          {(result.isVenue === false || result.framingHint) && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl bg-warning-soft p-4 text-base text-warning ring-1 ring-inset ring-warning-ring"
            >
              {result.isVenue === false && (
                <p className="font-semibold">
                  This doesn&apos;t look like a venue photo. Try a shot that
                  clearly shows the entrance, storefront, or signage.
                </p>
              )}
              {result.framingHint && (
                <p className={result.isVenue === false ? "mt-1" : ""}>
                  {result.framingHint}
                </p>
              )}
              <p className="mt-2 text-sm opacity-80">
                Retake the photo for a more accurate score.
              </p>
            </div>
          )}

          {/* Overall verdict — the "degree of accessibility" at a glance. This
              plain-language verdict IS the main rating shown to the user; the
              numeric score still exists under the hood (drives search, the map
              pins, and what the backend stores) but is never surfaced here. */}
          <div
            className={`rounded-xl p-5 ring-1 ring-inset ${VERDICTS[summary.level].className}`}
          >
            <p className="text-xl font-bold">{VERDICTS[summary.level].text}</p>
            <p className="mt-1 text-base opacity-90">
              {VERDICTS[summary.level].detail}
            </p>
            {/* Plain-English count so the "degree" is spelled out. */}
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide opacity-80">
              {confirmedAccessibleCount} of {totalAccessibleFeatures} accessible
              features confirmed
              {barrierCount > 0
                ? ` · ${barrierCount} barrier${barrierCount > 1 ? "s" : ""}`
                : ""}
            </p>
          </div>

          {/* The photo with bounding boxes drawn over detections. */}
          <DetectionImage photo={photo} />

          {/* One unified checklist so the user sees every feature we checked
              for, not just the ones we found. Detected features (Yes / barrier)
              carry a checkbox — the contributor confirms or unchecks each one,
              and the score + verdict + what gets saved all follow. Features that
              weren't detected are shown but aren't checkable (there's nothing to
              confirm). */}
          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-sm">
            <h2 className="border-b border-sand-100 px-4 py-3 font-display text-base font-extrabold text-ink">
              Accessibility checklist
            </h2>
            <p className="border-b border-sand-100 px-4 py-2 text-sm text-ink-soft">
              Uncheck anything the AI got wrong — you have the final say. Only
              confirmed features count toward the score and get saved.
            </p>
            <ul className="divide-y divide-sand-100">
              {checklist.map((row) => {
                const detected = row.status === "yes" || row.status === "barrier";
                const isChecked = !!confirmed[row.key];
                const inputId = `confirm-${row.key}`;

                // Not-detected rows have nothing to confirm — render them as a
                // plain, non-interactive row so the user still sees we looked.
                if (!detected) {
                  return (
                    <li
                      key={row.key}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-base font-medium text-ink-faint">
                        <span aria-hidden>—</span>
                        {row.label}
                      </span>
                      <span className="text-sm font-semibold text-ink-faint">
                        Not detected
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={row.key}>
                    <label
                      htmlFor={inputId}
                      className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="flex items-center gap-3 text-base font-medium text-ink">
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature(row.key)}
                          className="h-4 w-4 rounded border-sand-200 text-brand-600 focus:ring-brand-500"
                        />
                        {row.label}
                      </span>
                      {row.status === "yes" && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ring-inset ${
                            row.highConfidence
                              ? "bg-success-soft text-success ring-success-ring"
                              : "bg-warning-soft text-warning ring-warning-ring"
                          }`}
                        >
                          {row.highConfidence ? "Detected" : "Likely — verify"}
                        </span>
                      )}
                      {row.status === "barrier" && (
                        <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-sm font-semibold text-danger ring-1 ring-inset ring-danger-ring">
                          Barrier detected
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-sand-100 px-4 py-3 text-sm text-ink-soft">
              &ldquo;Not detected&rdquo; means we didn&apos;t see it in this photo
              — the feature could still exist at the venue.
            </p>
          </div>

          {result.altTextSuggestion && (
            <p className="text-center text-sm text-ink-faint">
              {result.altTextSuggestion}
            </p>
          )}

          {/* Connect this analysis to the map — save it as a place. */}
          {(summary.present.length > 0 || summary.barriers.length > 0) &&
            (showNameInput ? (
              <div className="space-y-2 rounded-2xl border border-sand-200 bg-surface p-4 shadow-sm">
                <label
                  htmlFor="venue-name"
                  className="block text-base font-medium text-ink-soft"
                >
                  Name this place
                </label>
                <PlaceAutocomplete
                  id="venue-name"
                  value={venueName}
                  onChange={(v) => {
                    setVenueName(v);
                    // Typing after a pick invalidates the coordinates — the
                    // user may be editing the name away from the picked place.
                    if (pickedPlace && v !== pickedPlace.name) {
                      setPickedPlace(null);
                    }
                  }}
                  onPick={(place) => {
                    setVenueName(place.name);
                    setPickedPlace(place);
                  }}
                  placeholder="e.g. Salesforce Tower"
                  className="w-full rounded-xl border border-sand-200 px-3 py-2 text-base text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <p className="text-sm text-ink-faint">
                  {pickedPlace
                    ? `Saving at ${pickedPlace.displayName}.`
                    : "Pick a suggestion to save at that address, or we'll use your current location."}
                </p>
                <Button
                  type="button"
                  onClick={confirmPlaceOnMap}
                  disabled={placing}
                  className="w-full"
                >
                  {placing ? "Saving…" : "Save & show on map"}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setShowNameInput(true)}
                className="w-full"
              >
                Place this result on the map
              </Button>
            ))}

          <p className="text-center text-sm text-ink-faint">
            AI detections are a starting point — the community verifies each one
            before it counts toward a venue's official score.
          </p>
        </section>
      )}
    </div>
  );
}
