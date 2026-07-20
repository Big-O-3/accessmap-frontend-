import { useState } from "react";
import DetectionImage from "../components/DetectionImage";
import ScoreBadge from "../components/ScoreBadge";
import { analyzeImage, scoreFromDetections, summarizeAccessibility } from "../lib/detect";

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

// Upload a venue photo, run it through Grounding DINO, and preview the accessibility
// score + detected features. Upload-only for now; a "take a photo" option is
// planned (a camera capture input) but intentionally not built yet.
export default function AnalyzePage() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null); // { detections, altTextSuggestion }
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState(null);

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

      {/* Upload control — a full-width tap target that works well on mobile. */}
      <label
        htmlFor="photo-input"
        className="mt-8 block cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 focus-within:border-indigo-500"
      >
        <span className="block font-medium text-gray-900">
          Tap to upload a photo
        </span>
        <span className="mt-1 block text-xs text-gray-500">
          JPG or PNG — a clear photo of the entrance works best
        </span>
        <input
          id="photo-input"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>

      {/* Camera capture is planned but not enabled yet. */}
      <p className="mt-2 text-center text-xs text-gray-400">
        Taking a photo with your camera is coming soon.
      </p>

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

          <p className="text-center text-xs text-gray-400">
            AI detections are a starting point — the community verifies each one
            before it counts toward a venue's official score.
          </p>
        </section>
      )}
    </div>
  );
}
