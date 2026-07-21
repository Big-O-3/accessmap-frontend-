// Per-browser user data (saved venues + activity feed), persisted to
// localStorage. The app has no auth yet, so "your" data means "this browser's"
// data — this module is the single source of truth for it, and the swap-point
// for a real per-user backend once sign-in exists.
//
// A tiny pub/sub lets React subscribe via useSyncExternalStore (see hooks in
// src/hooks/useUserData.js) so every view updates the instant data changes.

const SAVED_KEY = "accessmap:savedVenues";
const ACTIVITY_KEY = "accessmap:activity";
const ACTIVITY_LIMIT = 50; // keep the feed bounded

const listeners = new Set();

// Cached snapshots. useSyncExternalStore requires getSnapshot to return a
// referentially STABLE value while nothing changes (otherwise it loops / warns).
// We parse localStorage once, cache the result, and only rebuild the cache when
// a write happens (emit() clears it).
let savedCache = null;
let activityCache = null;
let statsCache = null;

function invalidate() {
  savedCache = null;
  activityCache = null;
  statsCache = null;
}

function emit() {
  invalidate();
  for (const fn of listeners) fn();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// --- storage helpers (safe against disabled/full localStorage) -------------

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    // Private mode, quota, or corrupt JSON — fall back gracefully.
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write failures (e.g. Safari private mode) — the in-memory render
    // still reflects the attempted change for this session.
  }
}

// --- saved venues ----------------------------------------------------------

// A saved venue stores just enough to render a card without a re-fetch.
// Shape: { id, name, city, address, accessibilityScore, savedAt }

export function getSavedVenues() {
  if (savedCache === null) {
    const list = read(SAVED_KEY, []);
    savedCache = Array.isArray(list) ? list : [];
  }
  return savedCache;
}

export function isSaved(venueId) {
  return getSavedVenues().some((v) => v.id === venueId);
}

export function saveVenue(venue) {
  if (!venue?.id) return;
  const list = getSavedVenues();
  if (list.some((v) => v.id === venue.id)) return; // already saved

  const entry = {
    id: venue.id,
    name: venue.name,
    city: venue.city ?? "",
    address: venue.address ?? "",
    accessibilityScore: venue.accessibilityScore ?? 0,
    savedAt: new Date().toISOString(),
  };
  write(SAVED_KEY, [entry, ...list]);
  logActivity({
    type: "saved",
    venueId: venue.id,
    venueName: venue.name,
    detail: `Saved ${venue.name} to favorites`,
  });
  emit();
}

export function unsaveVenue(venueId) {
  const list = getSavedVenues();
  const next = list.filter((v) => v.id !== venueId);
  if (next.length === list.length) return; // nothing removed
  write(SAVED_KEY, next);
  emit();
}

export function toggleSaved(venue) {
  if (isSaved(venue.id)) unsaveVenue(venue.id);
  else saveVenue(venue);
}

// --- activity feed ----------------------------------------------------------

// Shape: { id, type, detail, venueId?, venueName?, createdAt }
// `type` is one of: "saved" | "contributed".

export function getActivity() {
  if (activityCache === null) {
    const list = read(ACTIVITY_KEY, []);
    activityCache = Array.isArray(list) ? list : [];
  }
  return activityCache;
}

export function logActivity(event) {
  const entry = {
    id: `act-${idSeq()}`,
    type: event.type,
    detail: event.detail,
    venueId: event.venueId ?? null,
    venueName: event.venueName ?? null,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...getActivity()].slice(0, ACTIVITY_LIMIT);
  write(ACTIVITY_KEY, next);
  emit();
}

// --- derived stats ----------------------------------------------------------

// Honest, device-scoped counts derived from the two stores above. The
// planning doc's "people helped" style metrics need a server + auth, so we
// surface only what we can truthfully compute here.
export function getStats() {
  if (statsCache === null) {
    const activity = getActivity();
    const contributions = activity.filter((a) => a.type === "contributed").length;
    statsCache = {
      savedCount: getSavedVenues().length,
      contributionCount: contributions,
      activityCount: activity.length,
    };
  }
  return statsCache;
}

// Monotonic id without crypto or Date.now collisions across a burst.
let _seq = 0;
function idSeq() {
  _seq += 1;
  return `${_seq}${Math.floor(performance.now())}`;
}
