// Bridges the Analyze page to the Search/Map page.
//
// An "analyzed spot" is a one-off result from uploading a photo on the Analyze
// page: we know its detected accessibility features and a preview score, and
// the user drops it at a location. It isn't a saved backend venue, so we stash
// it in sessionStorage (survives the client-side navigation to /search) and the
// map renders it alongside real venues as a pin.

import { scoreFromDetections, detectionsToFeatures } from "./detect";

const KEY = "accessmap.analyzedSpots";

// Build a venue-shaped object the map/search code already understands, from a
// set of detections plus a chosen location.
export function makeAnalyzedSpot({ detections, lat, lng, name }) {
  return {
    id: `analyzed-${Math.round(performance.now())}`,
    name: name || "Analyzed photo",
    address: "Dropped from Analyze",
    city: "",
    state: "",
    latitude: lat,
    longitude: lng,
    accessibilityScore: scoreFromDetections(detections),
    featureKeys: detectionsToFeatures(detections).map((f) => f.type),
    totalReviews: 0,
    totalPhotos: 1,
    analyzed: true, // marks this as an Analyze result, not a real venue
  };
}

export function getAnalyzedSpots() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function addAnalyzedSpot(spot) {
  const spots = getAnalyzedSpots();
  spots.push(spot);
  sessionStorage.setItem(KEY, JSON.stringify(spots));
}
