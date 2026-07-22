// Client for the Python ML service (accessmap-ml) that runs Grounding DINO.
//
// The Analyze page posts an image straight to this service and gets back
// detections. We also turn those detections into the "features" shape that
// calculateAccessibilityScore expects, so we can preview a score for a single
// photo before any backend/venue exists.

import { calculateAccessibilityScore } from "./score";
import { FEATURE_BY_KEY, featureLabel } from "./features";

// All ML traffic goes through the backend now — it forwards the image to the
// Python ML service. This keeps the ML URL and its CORS surface server-side.
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error("VITE_API_URL is not set. Point it at the backend.");
}

// Send an image File/Blob to the backend proxy and return the ML service's
// JSON response:
//   { detections: [{ cocoLabel, accessibilityFeature, confidence,
//                     highConfidence, boundingBox }], altTextSuggestion,
//     isVenue, framingHint }
export async function analyzeImage(file) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${API_URL}/api/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`Analyze failed (${res.status})`);
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

// Turn detections into a human-readable "degree of accessibility" summary:
// which accessibility features are present, which detected things are barriers
// (e.g. stairs), and a plain-English verdict. Used by the Analyze page to show
// more than a flat list.
export function summarizeAccessibility(detections = []) {
  const features = detectionsToFeatures(detections);

  const present = [];
  const barriers = [];
  for (const f of features) {
    const meta = FEATURE_BY_KEY[f.type];
    const entry = { key: f.type, label: featureLabel(f.type), confidence: f.confidence };
    if (meta?.barrier) {
      barriers.push(entry);
    } else {
      present.push(entry);
    }
  }

  // A simple verdict from what we found. Barriers with no accessible features
  // is the worst case; accessible features with no barriers is the best.
  let level;
  if (present.length === 0 && barriers.length === 0) {
    level = "unknown";
  } else if (barriers.length > 0 && present.length === 0) {
    level = "not-accessible";
  } else if (barriers.length > 0) {
    level = "partial";
  } else {
    level = "accessible";
  }

  return { level, present, barriers };
}

