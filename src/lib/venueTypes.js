// Venue categories a visitor can filter by. Keys match the backend's
// Venue.venueType values (set by the OSM importer / Add Venue flow).
export const VENUE_TYPES = [
  { key: "restaurant", label: "Restaurants" },
  { key: "cafe", label: "Cafés" },
  { key: "museum", label: "Museums" },
  { key: "concert_venue", label: "Concert venues" },
  { key: "arena", label: "Arenas & stadiums" },
];

export const VENUE_TYPE_BY_KEY = Object.fromEntries(
  VENUE_TYPES.map((t) => [t.key, t]),
);

export function venueTypeLabel(key) {
  return VENUE_TYPE_BY_KEY[key]?.label ?? key;
}
