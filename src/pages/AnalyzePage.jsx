import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DetectionImage from "../components/DetectionImage";
import ScoreBadge from "../components/ScoreBadge";
import CameraCapture from "../components/CameraCapture";
import PlaceAutocomplete from "../components/PlaceAutocomplete";
import {
  analyzeImage,
  featureChecklist,
  scoreFromDetections,
  summarizeAccessibility,
} from "../lib/detect";
import { saveAnalyzedVenue } from "../lib/api";

// Plain-English verdict shown at the top of the results, keyed by summary.level.
const VERDICTS = {
  accessible: {
    text: "Looks accessible",
    detail: "Accessible features detected, with no barriers spotted in this photo.",
    className: "bg-green-50 text-green-800 ring-green-600/20",
  },
  partial: {
    text: "Partially accessible",
    detail: "Some accessible features detected, but also a barrier — check the details.",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
  },
  "not-accessible": {
    text: "Barriers detected",
    detail: "A barrier was detected and no accessible features were found in this photo.",
    className: "bg-red-50 text-red-800 ring-red-600/20",
  },
  unknown: {
    text: "No features detected",
    detail: "Nothing recognizable was found. Try a clearer photo of the entrance.",
    className: "bg-sand-100 text-ink-soft ring-ink-soft/20",
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
        detections,
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
    setStatus("loading");

    try {
      const data = await analyzeImage(file);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.message || "Something went wrong analyzing the photo.");
      setStatus("error");
    }
  }

  const detections = result?.detections ?? [];
  const summary = result ? summarizeAccessibility(detections) : null;
  const score = result ? scoreFromDetections(detections) : null;
  const checklist = result ? featureChecklist(detections) : [];
  const totalAccessibleFeatures = checklist.filter(
    (row) => row.status !== "barrier" && row.key !== "stairs_present",
  ).length;
  const detectedAccessibleCount = checklist.filter((row) => row.status === "yes").length;
  const barrierCount = checklist.filter((row) => row.status === "barrier").length;

  // A photo object in the shape DetectionImage expects.
  const photo = previewUrl ? { imageUrl: previewUrl, detections } : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
          Check a venue's accessibility
        </h1>
        <p className="mt-2 text-sm sm:text-base text-ink-soft">
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
          <span className="mt-1 block text-xs text-ink-soft">
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
          <span className="mt-1 block text-xs text-ink-soft">
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
        <p className="mt-8 text-center text-ink-soft" role="status">
          Analyzing photo… this can take a few seconds.
        </p>
      )}

      {status === "error" && (
        <div className="mt-8 rounded-lg bg-red-50 p-4 text-center text-sm text-red-700 ring-1 ring-red-600/20">
          <p className="font-medium">Couldn't analyze the photo.</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs text-red-600">
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
              className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-600/20"
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
              <p className="mt-2 text-xs text-amber-800/80">
                Retake the photo for a more accurate score.
              </p>
            </div>
          )}

          {/* Overall verdict — the "degree of accessibility" at a glance. */}
          <div
            className={`rounded-xl p-5 ring-1 ${VERDICTS[summary.level].className}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{VERDICTS[summary.level].text}</p>
                <p className="mt-1 text-sm opacity-90">
                  {VERDICTS[summary.level].detail}
                </p>
                {/* Plain-English count so the "degree" is spelled out, not just a number. */}
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                  {detectedAccessibleCount} of {totalAccessibleFeatures} accessible
                  features detected
                  {barrierCount > 0
                    ? ` · ${barrierCount} barrier${barrierCount > 1 ? "s" : ""}`
                    : ""}
                </p>
              </div>
              <ScoreBadge score={score} size="lg" />
            </div>
          </div>

          {/* The photo with bounding boxes drawn over detections. */}
          <DetectionImage photo={photo} />

          {/* One unified checklist so the user sees every feature we checked
              for, not just the ones we found. Yes / Not detected / Barrier is
              easier to scan than two separate lists with confidence percents. */}
          <div className="rounded-xl bg-surface ring-1 ring-sand-200">
            <h2 className="border-b border-sand-100 px-4 py-3 text-sm font-semibold text-ink">
              Accessibility checklist
            </h2>
            <ul className="divide-y divide-sand-100">
              {checklist.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    {row.status === "yes" && (
                      <span className="text-green-600" aria-hidden>✓</span>
                    )}
                    {row.status === "barrier" && (
                      <span className="text-red-600" aria-hidden>⚠</span>
                    )}
                    {row.status === "not-detected" && (
                      <span className="text-ink-faint" aria-hidden>—</span>
                    )}
                    {row.label}
                  </span>
                  {row.status === "yes" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.highConfidence
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.highConfidence ? "Yes" : "Likely — verify"}
                    </span>
                  )}
                  {row.status === "barrier" && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      Present
                    </span>
                  )}
                  {row.status === "not-detected" && (
                    <span className="text-xs font-semibold text-ink-faint">
                      Not detected
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="border-t border-sand-100 px-4 py-3 text-xs text-ink-soft">
              &ldquo;Not detected&rdquo; means we didn&apos;t see it in this photo
              — the feature could still exist at the venue.
            </p>
          </div>

          {result.altTextSuggestion && (
            <p className="text-center text-xs text-ink-faint">
              {result.altTextSuggestion}
            </p>
          )}

          {/* Connect this analysis to the map — save it as a place. */}
          {(summary.present.length > 0 || summary.barriers.length > 0) &&
            (showNameInput ? (
              <div className="space-y-2 rounded-xl bg-surface p-4 ring-1 ring-sand-200">
                <label
                  htmlFor="venue-name"
                  className="block text-sm font-medium text-ink-soft"
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
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                />
                <p className="text-xs text-ink-faint">
                  {pickedPlace
                    ? `Saving at ${pickedPlace.displayName}.`
                    : "Pick a suggestion to save at that address, or we'll use your current location."}
                </p>
                <button
                  type="button"
                  onClick={confirmPlaceOnMap}
                  disabled={placing}
                  className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                >
                  {placing ? "Saving…" : "Save & show on map"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNameInput(true)}
                className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition-colors hover:bg-brand-700"
              >
                Place this result on the map
              </button>
            ))}

          <p className="text-center text-xs text-ink-faint">
            AI detections are a starting point — the community verifies each one
            before it counts toward a venue's official score.
          </p>
        </section>
      )}
    </div>
  );
}
