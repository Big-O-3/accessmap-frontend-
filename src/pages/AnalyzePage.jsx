import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DetectionImage from "../components/DetectionImage";
import ScoreBadge from "../components/ScoreBadge";
import CameraCapture from "../components/CameraCapture";
import { analyzeImage, scoreFromDetections, summarizeAccessibility } from "../lib/detect";
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
    className: "bg-gray-50 text-gray-700 ring-gray-600/20",
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
      const { lat, lng } = await getPosition();
      await saveAnalyzedVenue({ name: venueName.trim(), lat, lng, detections });
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

  // A photo object in the shape DetectionImage expects.
  const photo = previewUrl ? { imageUrl: previewUrl, detections } : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Check a venue's accessibility
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-500">
          Upload a photo and our AI will detect accessibility features — ramps,
          doors, seating, restrooms — and flag barriers like stairs, with a
          preview score.
        </p>
      </header>

      {/* Two ways to add a photo: upload a file or open the camera. */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <label
          htmlFor="photo-input"
          className="block cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 focus-within:border-indigo-500"
        >
          <span className="block font-medium text-gray-900">
            Upload a photo
          </span>
          <span className="mt-1 block text-xs text-gray-500">
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
          className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 focus:border-indigo-500 focus:outline-none"
        >
          <span className="block font-medium text-gray-900">
            Take a photo
          </span>
          <span className="mt-1 block text-xs text-gray-500">
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
        <p className="mt-8 text-center text-gray-600" role="status">
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
              </div>
              <ScoreBadge score={score} size="lg" />
            </div>
          </div>

          {/* The photo with bounding boxes drawn over detections. */}
          <DetectionImage photo={photo} />

          {/* Accessible features found. */}
          {summary.present.length > 0 && (
            <div className="rounded-xl bg-white ring-1 ring-gray-200">
              <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
                Accessible features found
              </h2>
              <ul className="divide-y divide-gray-100">
                {summary.present.map((f) => (
                  <li
                    key={f.key}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <span className="text-green-600" aria-hidden>✓</span>
                      {f.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {Math.round(f.confidence * 100)}% confidence
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Barriers found (e.g. stairs). */}
          {summary.barriers.length > 0 && (
            <div className="rounded-xl bg-white ring-1 ring-red-200">
              <h2 className="border-b border-red-100 px-4 py-3 text-sm font-semibold text-red-800">
                Barriers detected
              </h2>
              <ul className="divide-y divide-red-100">
                {summary.barriers.map((f) => (
                  <li
                    key={f.key}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <span className="text-red-600" aria-hidden>⚠</span>
                      {f.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {Math.round(f.confidence * 100)}% confidence
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.present.length === 0 && summary.barriers.length === 0 && (
            <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-200">
              No accessibility features were detected in this photo. Try a
              clearer photo of the entrance.
            </p>
          )}

          {result.altTextSuggestion && (
            <p className="text-center text-xs text-gray-400">
              {result.altTextSuggestion}
            </p>
          )}

          {/* Connect this analysis to the map — save it as a place. */}
          {(summary.present.length > 0 || summary.barriers.length > 0) &&
            (showNameInput ? (
              <div className="space-y-2 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                <label
                  htmlFor="venue-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name this place
                </label>
                <input
                  id="venue-name"
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Downtown Library"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                <p className="text-xs text-gray-400">
                  Saves this place and its accessibility features to the map.
                </p>
                <button
                  type="button"
                  onClick={confirmPlaceOnMap}
                  disabled={placing}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                >
                  {placing ? "Saving…" : "Save & show on map"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNameInput(true)}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Place this result on the map
              </button>
            ))}

          <p className="text-center text-xs text-gray-400">
            AI detections are a starting point — the community verifies each one
            before it counts toward a venue's official score.
          </p>
        </section>
      )}
    </div>
  );
}
