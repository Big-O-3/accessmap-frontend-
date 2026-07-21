// React hooks over the localStorage-backed user data (src/lib/userData.js).
// useSyncExternalStore is React's built-in way to read from an external store
// and re-render subscribers when it changes — so saving a venue anywhere
// instantly updates the dashboard, the save button, everything.

import { useSyncExternalStore } from "react";
import {
  subscribe,
  getSavedVenues,
  getActivity,
  getStats,
  isSaved,
  toggleSaved,
} from "../lib/userData";

export function useSavedVenues() {
  return useSyncExternalStore(subscribe, getSavedVenues, getSavedVenues);
}

export function useActivity() {
  return useSyncExternalStore(subscribe, getActivity, getActivity);
}

export function useStats() {
  return useSyncExternalStore(subscribe, getStats, getStats);
}

// Whether a single venue is saved, plus a toggle. Reuses the saved-venues
// subscription so the button reflects changes made from any other view.
export function useSaveVenue(venue) {
  const saved = useSyncExternalStore(
    subscribe,
    () => isSaved(venue?.id),
    () => isSaved(venue?.id),
  );
  return { saved, toggle: () => toggleSaved(venue) };
}
