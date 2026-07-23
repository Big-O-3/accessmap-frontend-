// Place autocomplete via Nominatim (OpenStreetMap's geocoder). Free, no API
// key required. Nominatim's usage policy allows up to 1 req/sec — we debounce
// keystrokes to well under that in the consumer.
//
// Docs: https://nominatim.org/release-docs/develop/api/Search/

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Search Nominatim for places matching a free-text query. Returns a normalized
// list ready to render as autocomplete suggestions.
//
// Each result:
//   {
//     id:            string,   // stable OSM id (place_id)
//     name:          string,   // best guess at a short display name
//     displayName:   string,   // full comma-separated string from Nominatim
//     latitude:      number,
//     longitude:     number,
//     address:       string,   // street + house number, if available
//     city:          string,
//     state:         string,
//     stateCode:     string,   // two-letter US state, if the raw string looked like one
//     zipCode:       string,
//     countryCode:   string,
//   }
export async function searchPlaces(query, { signal } = {}) {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
    limit: "6",
  });
  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    signal,
    // Nominatim asks callers to identify themselves. In-browser this is best-
    // effort — the browser sends its own User-Agent — but the Referer header
    // is passed automatically and satisfies the "identify yourself" ask.
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

  const raw = await res.json();
  return raw.map(normalizeResult);
}

function normalizeResult(raw) {
  const addr = raw.address ?? {};
  const streetNumber = addr.house_number ?? "";
  const street = addr.road ?? addr.pedestrian ?? addr.footway ?? "";
  const streetLine = [streetNumber, street].filter(Boolean).join(" ");

  const city =
    addr.city ??
    addr.town ??
    addr.village ??
    addr.hamlet ??
    addr.suburb ??
    "";

  const rawState = addr.state ?? "";
  const stateCode = US_STATE_TO_CODE[rawState] ?? "";

  // Nominatim's display_name is long. For the primary label, prefer the venue
  // name over the address so users see "Salesforce Tower" not "415 Mission St".
  const name = raw.name || raw.display_name.split(",")[0].trim();

  return {
    id: String(raw.place_id),
    name,
    displayName: raw.display_name,
    latitude: parseFloat(raw.lat),
    longitude: parseFloat(raw.lon),
    address: streetLine,
    city,
    state: rawState,
    stateCode,
    zipCode: addr.postcode ?? "",
    countryCode: (addr.country_code ?? "").toUpperCase(),
  };
}

// Full-name -> USPS two-letter code, so the "State" field on the create form
// gets a two-letter code (matches its existing "WA" placeholder).
const US_STATE_TO_CODE = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI",
  Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
  "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};
