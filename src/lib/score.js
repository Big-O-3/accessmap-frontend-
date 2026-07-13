// Accessibility score algorithm (0-100).
//
// Each feature contributes base points, scaled by ML detection confidence
// (community-added features count at full weight) and a small bonus once the
// community has verified it enough times. Barriers (e.g. stairs) subtract.
//
// A venue "feature" is expected to look like:
//   { type: "entrance_detected", mlDetected: true, confidence: 0.92, verifiedCount: 4 }

const WEIGHTS = {
  entrance_detected: 20,
  restroom_available: 20,
  parking_area: 15,
  seating_available: 10,
  indoor_seating: 10,
  stairs_present: -15, // barrier
  community_verified: 5,
};

const COMMUNITY_VERIFIED_THRESHOLD = 3;
const COMMUNITY_BONUS_MULTIPLIER = 1.2;

export function calculateAccessibilityScore(features = []) {
  let score = 0;

  for (const feature of features) {
    const basePoints = WEIGHTS[feature.type] ?? 0;
    if (basePoints === 0) continue;

    // Community-added (non-ML) features are trusted at full weight.
    const confidence = feature.mlDetected ? (feature.confidence ?? 0) : 1;
    const communityBonus =
      (feature.verifiedCount ?? 0) >= COMMUNITY_VERIFIED_THRESHOLD
        ? COMMUNITY_BONUS_MULTIPLIER
        : 1;

    score += basePoints * confidence * communityBonus;
  }

  return Math.round(Math.max(0, Math.min(score, 100)));
}

// Buckets for badge coloring in the UI.
export function scoreTier(score) {
  if (score >= 75) return "high";
  if (score >= 40) return "medium";
  return "low";
}
