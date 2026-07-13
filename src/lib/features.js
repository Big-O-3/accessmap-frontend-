// Accessibility features used across search filters, venue detail, and scoring.
// Keys match the backend's mapped accessibility feature strings.
export const ACCESSIBILITY_FEATURES = [
  { key: "entrance_detected", label: "Wheelchair accessible entrance", icon: "♿" },
  { key: "restroom_available", label: "Accessible restroom", icon: "🚽" },
  { key: "parking_area", label: "Accessible parking", icon: "🅿️" },
  { key: "seating_available", label: "Seating available", icon: "🪑" },
  { key: "indoor_seating", label: "Indoor seating", icon: "🪑" },
  { key: "stairs_present", label: "Stairs present (barrier)", icon: "🪜", barrier: true },
];

export const FEATURE_BY_KEY = Object.fromEntries(
  ACCESSIBILITY_FEATURES.map((f) => [f.key, f]),
);

// Feature keys a visitor can filter by (barriers excluded).
export const FILTERABLE_FEATURES = ACCESSIBILITY_FEATURES.filter((f) => !f.barrier);

export function featureLabel(key) {
  return FEATURE_BY_KEY[key]?.label ?? key;
}

export function featureIcon(key) {
  return FEATURE_BY_KEY[key]?.icon ?? "•";
}
