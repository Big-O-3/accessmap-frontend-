// API client for the AccessMap backend.
//
// When VITE_API_URL is set the client hits the real Node backend. Until then
// it falls back to local mock data so the frontend can be built independently.
// Every function returns a Promise, so swapping to the real API later is a
// no-op for calling components.

import { MOCK_VENUES, MOCK_PHOTOS, MOCK_REVIEWS } from "./mockData";
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
      photos: MOCK_PHOTOS[id] ?? [],
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

export { USE_MOCK };
