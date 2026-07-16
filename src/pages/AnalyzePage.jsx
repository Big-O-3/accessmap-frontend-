import { useState } from "react";
import DetectionImage from "../components/DetectionImage";
import ScoreBadge from "../components/ScoreBadge";
import { featureLabel } from "../lib/features";
import { analyzeImage, detectionsToFeatures, scoreFromDetections } from "../lib/detect";

// Upload a venue photo, run it through YOLO-World, and preview the accessibility
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
  const features = detectionsToFeatures(detections);
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
          Upload a photo and our AI will detect accessibility features like
          ramps, doors, and seating — and give you a preview score.
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
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-5 ring-1 ring-gray-200 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-500">Preview accessibility score</p>
              <p className="text-xs text-gray-400">
                Based on {detections.length} detected feature
                {detections.length === 1 ? "" : "s"} in this photo
              </p>
            </div>
            <ScoreBadge score={score} size="lg" />
          </div>

          {/* The photo with bounding boxes drawn over detections. */}
          <DetectionImage photo={photo} />

          {/* Per-feature breakdown. */}
          {features.length > 0 ? (
            <ul className="divide-y divide-gray-100 rounded-xl bg-white ring-1 ring-gray-200">
              {features.map((f) => (
                <li
                  key={f.type}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {featureLabel(f.type)}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {Math.round(f.confidence * 100)}% confidence
                  </span>
                </li>
              ))}
            </ul>
          ) : (
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
