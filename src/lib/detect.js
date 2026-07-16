// Client for the Python ML service (accessmap-ml) that runs Grounding DINO.
//
// The Analyze page posts an image straight to this service and gets back
// detections. We also turn those detections into the "features" shape that
// calculateAccessibilityScore expects, so we can preview a score for a single
// photo before any backend/venue exists.

import { calculateAccessibilityScore } from "./score";

// Where the Flask ML service lives. Override with VITE_ML_URL if needed.
const ML_URL = import.meta.env.VITE_ML_URL || "http://localhost:5001";

// Send an image File/Blob to the ML service and return its JSON response:
//   { detections: [{ cocoLabel, accessibilityFeature, confidence,
//                     highConfidence, boundingBox }], altTextSuggestion }
export async function analyzeImage(file) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${ML_URL}/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`ML service error (${res.status})`);
  }
  return res.json();
}

// Collapse detections into one scoreable feature per accessibility type, keeping
// the highest confidence seen for that type. Prevents e.g. two detected chairs
// from double-counting in the score.
export function detectionsToFeatures(detections = []) {
  const bestByType = new Map();
  for (const d of detections) {
    const prev = bestByType.get(d.accessibilityFeature);
    if (!prev || d.confidence > prev.confidence) {
      bestByType.set(d.accessibilityFeature, {
        type: d.accessibilityFeature,
        mlDetected: true,
        confidence: d.confidence,
        verifiedCount: 0, // nothing is community-verified in a fresh upload
      });
    }
  }
  return [...bestByType.values()];
}

// Convenience: raw detections -> a 0-100 preview score.
export function scoreFromDetections(detections = []) {
  return calculateAccessibilityScore(detectionsToFeatures(detections));
}

export { ML_URL };
