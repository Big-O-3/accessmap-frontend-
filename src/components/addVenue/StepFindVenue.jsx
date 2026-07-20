import { useEffect, useState } from "react";
import { searchVenues, createVenue } from "../../lib/api";

// Step 1 · Find or Create Venue.
// Search existing venues first (avoids duplicates); a match can be selected to
// "add to existing". Otherwise the contributor fills in a short create form.
// Calls onVenue(venue) with the chosen/created venue, then the page advances.
const CATEGORIES = [
  "cafe",
  "restaurant",
  "library",
  "museum",
  "market",
  "park",
  "store",
  "other",
];

export default function StepFindVenue({ initialVenue, onVenue }) {
  const [term, setTerm] = useState("");
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState(initialVenue ? "selected" : "search");
  const [selected, setSelected] = useState(initialVenue ?? null);

  // Create-form fields. latitude/longitude are required by the backend, so we
  // capture them explicitly (browser geolocation or manual entry).
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    venueType: "cafe",
    latitude: "",
    longitude: "",
  });
  const [creating, setCreating] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search against the existing venue list.
  useEffect(() => {
    const q = term.trim();
    if (mode !== "search" || q.length < 2) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        // The backend's search filters by city server-side, which would drop
        // every venue when the user types a place *name*. So fetch unfiltered
        // and match the query against name, city, and address on the client.
        const { venues } = await searchVenues({});
        const lower = q.toLowerCase();
        const matched = venues.filter(
          (v) =>
            v.name.toLowerCase().includes(lower) ||
            v.city.toLowerCase().includes(lower) ||
            v.address.toLowerCase().includes(lower),
        );
        if (!cancelled) setMatches(matched.slice(0, 5));
      } catch {
        if (!cancelled) setMatches([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, mode]);

  function chooseExisting(venue) {
    setSelected(venue);
    onVenue(venue);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported by your browser — enter coordinates manually.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location — enter coordinates manually.");
        setLocating(false);
      },
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);

    // The backend requires numeric coordinates; guard before the request so the
    // user gets clear guidance instead of a generic 400.
    const latitude = parseFloat(form.latitude);
    const longitude = parseFloat(form.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Add the venue's location — use “Use my location” or enter coordinates.");
      return;
    }

    setCreating(true);
    try {
      const venue = await createVenue({ ...form, latitude, longitude });
      onVenue(venue);
    } catch (err) {
      setError(err.message || "Could not create the venue.");
    } finally {
      setCreating(false);
    }
  }

  const updateField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const hasCoords = form.latitude !== "" && form.longitude !== "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Find or create a venue
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Search first so we don&apos;t create a duplicate. Pick a match to add
          to it, or create a new venue below.
        </p>
      </div>

      {/* Search existing */}
      <div>
        <label
          htmlFor="venue-search"
          className="block text-sm font-medium text-gray-700"
        >
          Search a place by name or address
        </label>
        <input
          id="venue-search"
          type="text"
          value={term}
          onFocus={() => setMode("search")}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g. Seattle Central Library"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />

        {searching && (
          <p className="mt-2 text-xs text-gray-400" role="status">
            Searching…
          </p>
        )}

        {matches.length > 0 && (
          <ul className="mt-2 space-y-1" aria-label="Matching venues">
            {matches.map((v) => {
              const isSelected = selected?.id === v.id;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => chooseExisting(v)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span>
                      <span className="font-medium text-gray-900">
                        {v.name}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {v.address}, {v.city}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-indigo-600">
                      {isSelected ? "Selected ✓" : "Add to existing"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or create a new venue
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Create new */}
      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label
            htmlFor="venue-name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            id="venue-name"
            type="text"
            value={form.name}
            onChange={updateField("name")}
            onFocus={() => setMode("create")}
            placeholder="Green Elephant Cafe"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="venue-address"
            className="block text-sm font-medium text-gray-700"
          >
            Address
          </label>
          <input
            id="venue-address"
            type="text"
            value={form.address}
            onChange={updateField("address")}
            placeholder="88 Elm St"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="venue-city"
              className="block text-sm font-medium text-gray-700"
            >
              City
            </label>
            <input
              id="venue-city"
              type="text"
              value={form.city}
              onChange={updateField("city")}
              placeholder="Seattle"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="venue-state"
              className="block text-sm font-medium text-gray-700"
            >
              State
            </label>
            <input
              id="venue-state"
              type="text"
              value={form.state}
              onChange={updateField("state")}
              placeholder="WA"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="venue-category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="venue-category"
            value={form.venueType}
            onChange={updateField("venueType")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm capitalize outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Location — required by the backend. Geolocation button plus manual
            entry so keyboard users and desktops without GPS have a path. */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Location</legend>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                hasCoords
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {locating
                ? "Locating…"
                : hasCoords
                  ? "Location set"
                  : "Use my location"}
            </button>
            <span className="text-xs text-gray-400">or enter below</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="venue-lat" className="sr-only">
                Latitude
              </label>
              <input
                id="venue-lat"
                type="number"
                step="any"
                inputMode="decimal"
                value={form.latitude}
                onChange={updateField("latitude")}
                placeholder="Latitude"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="venue-lng" className="sr-only">
                Longitude
              </label>
              <input
                id="venue-lng"
                type="number"
                step="any"
                inputMode="decimal"
                value={form.longitude}
                onChange={updateField("longitude")}
                placeholder="Longitude"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/20"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={
            creating || !form.name || !form.address || !form.city || !hasCoords
          }
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {creating ? "Creating…" : "Create venue & continue"}
        </button>
      </form>
    </div>
  );
}
