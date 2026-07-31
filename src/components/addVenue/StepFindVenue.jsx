import { useEffect, useState } from "react";
import { searchVenues, createVenue } from "../../lib/api";
import PlaceAutocomplete from "../PlaceAutocomplete";
import Button from "../Button";

// Step 1 · Find or Create Venue.
// Search existing venues first (avoids duplicates); a match can be selected to
// "add to existing". Otherwise the contributor fills in a short create form.
// Calls onVenue(venue) with the chosen/created venue, then the page advances.
const CATEGORIES = [
  "cafe",
  "restaurant",
  "library",
  "museum",
  "concert_venue",
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

  // Create-form fields. latitude/longitude are optional — they're filled in
  // when the contributor picks a search suggestion (see fillFromPlace), which
  // pins the venue on the map, but a venue can be created without them.
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
    // Second arg flags this as an already-existing venue, so the flow can offer
    // the skip-photos / manual-checklist path.
    onVenue(venue, true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);

    // Coordinates are optional. If given they must be valid numbers (so a
    // half-typed coordinate isn't sent as NaN); if left blank the venue is
    // created without a map location.
    const hasLat = form.latitude !== "";
    const hasLng = form.longitude !== "";
    if (hasLat !== hasLng) {
      setError("Enter both latitude and longitude, or leave both blank.");
      return;
    }
    let latitude = null;
    let longitude = null;
    if (hasLat && hasLng) {
      latitude = parseFloat(form.latitude);
      longitude = parseFloat(form.longitude);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        setError("Latitude and longitude must be valid numbers.");
        return;
      }
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

  // When the user picks a Nominatim suggestion, fill everything at once so
  // they only need to review + set the category.
  function fillFromPlace(place) {
    setForm((f) => ({
      ...f,
      name: place.name,
      address: place.address || f.address,
      city: place.city || f.city,
      state: place.stateCode || place.state || f.state,
      zipCode: place.zipCode || f.zipCode,
      latitude: place.latitude.toFixed(6),
      longitude: place.longitude.toFixed(6),
    }));
    setMode("create");
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-ink">
          Find or create a venue
        </h2>
        <p className="mt-1 text-base text-ink-soft">
          Search first so we don&apos;t create a duplicate. Pick a match to add
          to it, or create a new venue below.
        </p>
      </div>

      {/* Search existing */}
      <div>
        <label
          htmlFor="venue-search"
          className="block text-base font-medium text-ink-soft"
        >
          Search a venue by name or address
        </label>
        <input
          id="venue-search"
          type="text"
          value={term}
          onFocus={() => setMode("search")}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g. Seattle Central Library"
          className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-base text-ink placeholder:text-ink-faint outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />

        {searching && (
          <p className="mt-2 text-sm text-ink-faint" role="status">
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
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-base transition-colors ${
                      isSelected
                        ? "border-brand-500 bg-brand-50"
                        : "border-sand-200 bg-surface hover:bg-sand-100"
                    }`}
                  >
                    <span>
                      <span className="font-medium text-ink">
                        {v.name}
                      </span>
                      <span className="block text-sm text-ink-soft">
                        {v.address}, {v.city}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-link">
                      {isSelected ? "Selected ✓" : "Add to existing"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm uppercase tracking-wide text-ink-faint">
        <span className="h-px flex-1 bg-sand-200" />
        or create a new venue
        <span className="h-px flex-1 bg-sand-200" />
      </div>

      {/* Create new */}
      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label
            htmlFor="venue-name"
            className="block text-base font-medium text-ink-soft"
          >
            Name
          </label>
          <PlaceAutocomplete
            id="venue-name"
            value={form.name}
            onChange={(v) => {
              setForm((f) => ({ ...f, name: v }));
              setMode("create");
            }}
            onPick={fillFromPlace}
            placeholder="Green Elephant Cafe"
            className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-base text-ink placeholder:text-ink-faint outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <p className="mt-1 text-sm text-ink-faint">
            Pick a suggestion to fill address & location automatically.
          </p>
        </div>

        <div>
          <label
            htmlFor="venue-address"
            className="block text-base font-medium text-ink-soft"
          >
            Address
          </label>
          <input
            id="venue-address"
            type="text"
            value={form.address}
            onChange={updateField("address")}
            placeholder="88 Elm St"
            className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-base text-ink placeholder:text-ink-faint outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="venue-city"
              className="block text-base font-medium text-ink-soft"
            >
              City
            </label>
            <input
              id="venue-city"
              type="text"
              value={form.city}
              onChange={updateField("city")}
              placeholder="Seattle"
              className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-base text-ink placeholder:text-ink-faint outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label
              htmlFor="venue-state"
              className="block text-base font-medium text-ink-soft"
            >
              State
            </label>
            <input
              id="venue-state"
              type="text"
              value={form.state}
              onChange={updateField("state")}
              placeholder="WA"
              className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-base text-ink placeholder:text-ink-faint outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="venue-category"
            className="block text-base font-medium text-ink-soft"
          >
            Category
          </label>
          <select
            id="venue-category"
            value={form.venueType}
            onChange={updateField("venueType")}
            className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-base capitalize text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {/* Show multi-word keys like "concert_venue" as "Concert Venue"
                    (the underscore is the stored value; spaces read nicely). */}
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger-soft px-3 py-2 text-base text-danger ring-1 ring-inset ring-danger-ring"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={creating || !form.name || !form.address || !form.city}
          className="w-full"
        >
          {creating ? "Creating…" : "Create venue & continue"}
        </Button>
      </form>
    </div>
  );
}
