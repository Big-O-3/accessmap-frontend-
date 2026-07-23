// API client for the AccessMap backend.
//
// Auth is handled by attaching the Supabase access token as a Bearer header on
// every request. The backend's requireAuth middleware verifies that JWT using
// SUPABASE_JWT_SECRET.

import { detectionsToFeatures } from "./detect";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error(
    "VITE_API_URL is not set. Copy .env.example → .env.local and point it at the backend.",
  );
}

// Typed error so callers can distinguish "not signed in" from other failures
// (e.g. guarded actions can redirect to login).
export class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
    this.status = 401;
  }
}

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const auth = await authHeader();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    throw new AuthError(body.error || "Authentication required");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// GET /api/venues/search
// filters: { city, features: string[], radius, lat, lng }
export async function searchVenues(filters = {}) {
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
  return request(`/api/venues/${id}`);
}

// GET /api/reviews?venueId=
export async function getReviews(venueId) {
  return request(`/api/reviews?venueId=${venueId}`);
}

// POST /api/reviews — leave a review on a venue (requires sign-in).
// { venueId, rating (1-5), comment, visitDate? } → the created review.
export async function createReview({ venueId, rating, comment, visitDate }) {
  if (!venueId) throw new Error("A venue is required.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Please choose a rating from 1 to 5 stars.");
  }
  if (!comment?.trim()) throw new Error("Please write a short comment.");

  return request("/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      venueId,
      rating,
      comment: comment.trim(),
      visitDate: visitDate || null,
    }),
  });
}

// Recommended venues for the dashboard. There's no dedicated recommendations
// endpoint yet, so this reuses venue search: nearest-first when a location is
// given, else highest-scored. Each result carries a plain-English `reason`.
export async function getRecommendations({ lat, lng, limit = 3 } = {}) {
  const filters = {};
  if (lat != null && lng != null) {
    filters.lat = lat;
    filters.lng = lng;
  }
  const { venues } = await searchVenues(filters);

  return venues.slice(0, limit).map((v) => ({
    ...v,
    reason:
      v.distance != null
        ? `${v.distance.toFixed(1)} mi away with a strong accessibility score`
        : "Highly rated for accessibility by the community",
  }));
}

// POST /api/venues  (Add Venue · Step 1 "create a new venue")
export async function createVenue(input) {
  const { name, address, city, state, zipCode, latitude, longitude, venueType } =
    input;

  if (!name || !address || !city) {
    throw new Error("Name, address, and city are required.");
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
// score from them) plus any photos that carry a hosted URL. `previewScore` is
// computed client-side; the real endpoint returns its own recomputed
// `accessibilityScore`, which we surface under the same key.
export async function submitContribution({ venue, features, previewScore, note, photos }) {
  if (!venue?.id) throw new Error("A venue is required.");
  if (!features?.length) {
    throw new Error("Confirm at least one detected feature before submitting.");
  }

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

  return {
    ...data,
    previewScore: data.accessibilityScore ?? previewScore,
    featuresConfirmed: data.featuresConfirmed ?? features.length,
  };
}

// POST /api/photos — upload a photo file to a venue (multipart/form-data).
// The backend streams it to Cloudinary and returns the created Photo row
// (id + hosted imageUrl).
export async function uploadPhoto(venueId, file) {
  const form = new FormData();
  form.append("venueId", venueId);
  form.append("image", file);

  // NOTE: do NOT set Content-Type here — the browser adds the multipart
  // boundary. request() forces application/json, so we fetch directly.
  const auth = await authHeader();
  const res = await fetch(`${API_URL}/api/photos`, {
    method: "POST",
    headers: auth,
    body: form,
  });
  if (res.status === 401) {
    throw new AuthError();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
  return res.json();
}

// POST /api/photos/:id/analyze — run detection on an already-uploaded photo and
// persist the MLAnalysis + Detection rows.
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

// Persist an Analyze-page result as a real venue (Analyze → Map, saved to DB).
//
// Reuses POST /api/contributions with an INLINE venue: it creates the venue,
// writes its accessibility features, recomputes the score, and the venue then
// shows up immediately via GET /api/venues/search.
export async function saveAnalyzedVenue({ name, lat, lng, detections }) {
  if (!name?.trim()) throw new Error("A venue name is required.");
  if (lat == null || lng == null) throw new Error("A location is required.");

  const features = detectionsToFeatures(detections).map((f) => ({
    featureType: f.type,
    mlDetected: true,
    confidence: f.confidence,
  }));
  if (features.length === 0) {
    throw new Error("No accessibility features to save.");
  }

  return request("/api/contributions", {
    method: "POST",
    body: JSON.stringify({
      venue: {
        name: name.trim(),
        address: "Added from Analyze",
        // Backend requires city to be non-empty; we don't collect it on the
        // Analyze page, so use a stable placeholder the venue can be edited from.
        city: "Unknown",
        latitude: lat,
        longitude: lng,
        venueType: "other",
      },
      features,
      note: "Created from an analyzed photo.",
    }),
  });
}

export { request };
