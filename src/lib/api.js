// API client for the AccessMap backend.
//
// When VITE_API_URL is set the client hits the real Node backend. Until then
// it falls back to local mock data so the frontend can be built independently.
// Every function returns a Promise, so swapping to the real API later is a
// no-op for calling components.

import { MOCK_VENUES, MOCK_REVIEWS } from "./mockData";
import { calculateAccessibilityScore } from "./score";

const API_URL = import.meta.env.VITE_API_URL;
const USE_MOCK = !API_URL;

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

function withScore(venue) {
  return {
    ...venue,
    accessibilityScore: calculateAccessibilityScore(venue.features),
    featureKeys: venue.features.map((f) => f.type),
  };
}

// Haversine distance in miles between two lat/lng points.
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/venues/search
// filters: { city, features: string[], radius, lat, lng }
export async function searchVenues(filters = {}) {
  if (USE_MOCK) {
    await delay();
    let results = MOCK_VENUES.map(withScore);

    if (filters.city) {
      const c = filters.city.toLowerCase();
      results = results.filter((v) => v.city.toLowerCase().includes(c));
    }

    if (filters.features?.length) {
      results = results.filter((v) =>
        filters.features.every((f) => v.featureKeys.includes(f)),
      );
    }

    if (filters.lat != null && filters.lng != null) {
      results = results.map((v) => ({
        ...v,
        distance: distanceMiles(filters.lat, filters.lng, v.latitude, v.longitude),
      }));
      if (filters.radius) {
        results = results.filter((v) => v.distance <= filters.radius);
      }
      results.sort((a, b) => a.distance - b.distance);
    } else {
      results.sort((a, b) => b.accessibilityScore - a.accessibilityScore);
    }

    return { venues: results, total: results.length };
  }

  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.features?.length) params.set("features", filters.features.join(","));
  if (filters.radius) params.set("radius", filters.radius);
  if (filters.lat != null) params.set("lat", filters.lat);
  if (filters.lng != null) params.set("lng", filters.lng);
  return request(`/api/venues/search?${params.toString()}`);
}

// GET /api/venues/:id
export async function getVenue(id) {
  if (USE_MOCK) {
    await delay();
    const venue = MOCK_VENUES.find((v) => v.id === id);
    if (!venue) throw new Error("Venue not found");
    return {
      ...withScore(venue),
      photos: [], // real photos come from the backend once venues have uploads
      reviews: MOCK_REVIEWS[id] ?? [],
    };
  }
  return request(`/api/venues/${id}`);
}

// GET /api/reviews?venueId=
export async function getReviews(venueId) {
  if (USE_MOCK) {
    await delay();
    return { reviews: MOCK_REVIEWS[venueId] ?? [] };
  }
  return request(`/api/reviews?venueId=${venueId}`);
}

// POST /api/venues  (Add Venue · Step 1 "create a new venue")
// The real backend route is unauthenticated and expects
//   { name, address, city, latitude, longitude, ... }
// and responds with a serialized venue (id, accessibilityScore, featureKeys…).
// In mock mode we synthesize that same shape so the stepper works offline.
export async function createVenue(input) {
  const { name, address, city, state, zipCode, latitude, longitude, venueType } =
    input;

  if (!name || !address || !city) {
    throw new Error("Name, address, and city are required.");
  }

  if (USE_MOCK) {
    await delay();
    const venue = {
      id: `venue-local-${mockId()}`,
      name,
      address,
      city,
      state: state ?? "",
      zipCode: zipCode ?? "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      venueType: venueType ?? "other",
      accessibilityScore: 0,
      totalReviews: 0,
      totalPhotos: 0,
      features: [],
      featureKeys: [],
    };
    // Seed it into the mock store so getVenue/searchVenues can resolve it —
    // otherwise the "View venue" link after submitting would 404 in mock mode.
    MOCK_VENUES.push(venue);
    return venue;
  }

  return request("/api/venues", {
    method: "POST",
    body: JSON.stringify({
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      venueType,
    }),
  });
}

// POST /api/contributions — submit a completed Add Venue contribution (Step 4).
//
// Persists the contributor-confirmed features (the backend recomputes the venue
// score from them) plus any photos that carry a hosted URL. The endpoint takes
// optional auth, so this works before the frontend has a sign-in flow.
// `previewScore` is computed by the caller from the shared scoring model and is
// used for the mock response / optimistic display; the real endpoint returns
// its own recomputed `accessibilityScore`, which we surface under the same key.
export async function submitContribution({ venue, features, previewScore, note, photos }) {
  if (!venue?.id) throw new Error("A venue is required.");
  if (!features?.length) {
    throw new Error("Confirm at least one detected feature before submitting.");
  }

  if (USE_MOCK) {
    await delay();
    return {
      id: `contribution-${mockId()}`,
      venueId: venue.id,
      previewScore,
      featuresConfirmed: features.length,
      status: "pending_verification",
      note: note ?? "",
    };
  }

  // Map the frontend feature shape ({ type, ... }) to the API's ({ featureType,
  // ... }). The venue already exists at this point (Step 1 created/selected it),
  // so we reference it by id.
  const data = await request("/api/contributions", {
    method: "POST",
    body: JSON.stringify({
      venueId: venue.id,
      note: note ?? "",
      features: features.map((f) => ({
        featureType: f.type,
        mlDetected: f.mlDetected ?? false,
        confidence: f.confidence,
      })),
      photos: photos ?? [],
    }),
  });

  // Normalize so the success screen can read previewScore/featuresConfirmed
  // regardless of which branch produced the result.
  return {
    ...data,
    previewScore: data.accessibilityScore ?? previewScore,
    featuresConfirmed: data.featuresConfirmed ?? features.length,
  };
}

// POST /api/photos — upload a photo file to a venue (multipart/form-data).
// The backend streams it to Cloudinary and returns the created Photo row
// (id + hosted imageUrl). In mock mode we can't host an image, so we return a
// synthetic photo carrying the local preview URL for display only.
export async function uploadPhoto(venueId, file, localPreviewUrl) {
  if (USE_MOCK) {
    await delay();
    return {
      id: `photo-local-${mockId()}`,
      venueId,
      imageUrl: localPreviewUrl ?? null,
      thumbnailUrl: null,
      mlAnalyzed: false,
    };
  }

  const form = new FormData();
  form.append("venueId", venueId);
  form.append("image", file);

  // NOTE: do NOT set Content-Type here — the browser adds the multipart
  // boundary. request() forces application/json, so we fetch directly.
  const res = await fetch(`${API_URL}/api/photos`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
  return res.json();
}

// POST /api/photos/:id/analyze — run detection on an already-uploaded photo and
// persist the MLAnalysis + Detection rows. Returns detections that include their
// DB `id` (needed to confirm/reject them) plus an altTextSuggestion.
export async function analyzeUploadedPhoto(photoId) {
  return request(`/api/photos/${photoId}/analyze`, { method: "POST" });
}

// PATCH /api/photos/:id/detections — confirm (verify) or reject (delete) the
// contributor's detections by id.
export async function patchDetections(photoId, { confirmed = [], rejected = [] }) {
  return request(`/api/photos/${photoId}/detections`, {
    method: "PATCH",
    body: JSON.stringify({ confirmed, rejected }),
  });
}

// Short pseudo-unique id for locally-created records (no crypto dependency).
let _mockSeq = 0;
function mockId() {
  _mockSeq += 1;
  return `${_mockSeq}${Math.floor(performance.now())}`;
}

export { USE_MOCK };
