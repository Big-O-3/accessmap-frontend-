import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchVenues } from "../lib/api";
import FilterPanel from "../components/FilterPanel";
import VenueCard from "../components/VenueCard";
import VenueMap from "../components/VenueMap";
import BottomSheet from "../components/BottomSheet";
import Card from "../components/Card";

// Default search origin: downtown San Francisco. Used to order results
// nearest-first even before the visitor shares their real location, so the
// list/map are geographically coherent instead of sorted by raw score. Kept at
// module scope so it's a stable reference across renders.
const SF_CENTER = { lat: 37.7793, lng: -122.4193 };

const VIEWS = ["split", "list", "map"];

function FilterGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3 5h18M6 12h12M10 19h4" />
    </svg>
  );
}

export default function SearchPage() {
  // Seed the city from the URL (?city=…) so the home-page search box carries
  // its value over and shows up pre-filled in the search bar here.
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(() => searchParams.get("city") ?? "");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [location, setLocation] = useState(null); // real GPS location { lat, lng }
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState("split"); // split | list | map
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile filter sheet

  // Re-run search whenever filters change (debounced for the city text input).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        // Order nearest-first: use the visitor's real location if shared,
        // otherwise fall back to downtown SF so results are still proximity-sorted.
        const origin = location ?? SF_CENTER;
        const filters = {
          city,
          features: selectedFeatures,
          types: selectedTypes,
          lat: origin.lat,
          lng: origin.lng,
        };
        const data = await searchVenues(filters);
        if (!cancelled) setVenues(data.venues);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [city, selectedFeatures, selectedTypes, location]);

  function toggleFeature(key) {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  }

  function toggleType(key) {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key],
    );
  }

  function useMyLocation() {
    if (location) {
      setLocation(null);
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Could not get your location."),
    );
  }

  // How many venues are shown in the list. Starts at 10 (closest); "See more"
  // reveals the next 10. Reset whenever the result set changes.
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [city, selectedFeatures, selectedTypes, location]);

  const visibleVenues = venues.slice(0, visibleCount);
  const hasMore = visibleCount < venues.length;
  const activeFilterCount =
    selectedFeatures.length +
    selectedTypes.length +
    (city ? 1 : 0) +
    (location ? 1 : 0);

  // Center the map on the visitor's real location, else the nearest venue that
  // actually has coordinates, else downtown SF as a last resort. (Venues added
  // without a location have null coords and can't anchor the map.)
  const firstMappable = venues.find(
    (v) => v.latitude != null && v.longitude != null,
  );
  const mapCenter =
    location ??
    (firstMappable
      ? { lat: firstMappable.latitude, lng: firstMappable.longitude }
      : SF_CENTER);

  const filterPanel = (
    <FilterPanel
      city={city}
      onCityChange={setCity}
      selectedFeatures={selectedFeatures}
      onToggleFeature={toggleFeature}
      selectedTypes={selectedTypes}
      onToggleType={toggleType}
      onUseMyLocation={useMyLocation}
      hasLocation={!!location}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
        Find accessible venues
      </h1>

      <div className="mt-4 mb-6 flex items-center gap-3">
        {/* Mobile: open the filter sheet. Hidden on desktop, where the
            sidebar is always visible. */}
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-sand-200 bg-surface px-4 py-2 text-base font-semibold text-ink shadow-sm hover:bg-sand-100 lg:hidden"
        >
          <FilterGlyph />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-brand-600 px-1.5 text-xs font-bold tabular-nums text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div
          role="group"
          aria-label="Result view"
          className="ml-auto flex overflow-hidden rounded-xl border border-sand-200 bg-surface text-base shadow-sm"
        >
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                view === v
                  ? "bg-brand-600 text-white"
                  : "bg-surface text-ink-soft hover:bg-sand-100"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Result count sits ABOVE the whole sidebar+results grid — not inside
          the results column — so the filter panel, the first venue card, and
          the map all start at the same top edge and line up side by side.
          (Only meaningful in split/list; hidden in map view.) The line's height
          is reserved with min-h even while loading, so the grid below doesn't
          jump down when the count appears. */}
      {view !== "map" && (
        <p className="mb-3 min-h-[1.5rem] text-base text-ink-soft">
          {loading ? (
            <span className="text-ink-faint">Searching…</span>
          ) : venues.length > 0 ? (
            <>
              Showing{" "}
              <span className="font-mono tabular-nums">
                {visibleVenues.length}
              </span>{" "}
              of <span className="font-mono tabular-nums">{venues.length}</span>{" "}
              venue{venues.length !== 1 && "s"}, closest first
            </>
          ) : null}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Desktop sidebar. On mobile the same panel lives in the sheet. */}
        <aside className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-20 rounded-2xl border border-sand-200 bg-surface p-5 shadow-sm">
            {filterPanel}
          </div>
        </aside>

        <section className="lg:col-span-3">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-danger-ring bg-danger-soft px-4 py-2 text-base text-danger"
            >
              {error}
            </div>
          )}

          <div
            className={`grid gap-4 ${
              view === "split" ? "lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {view !== "map" && (
              <div className="space-y-3">
                {loading ? (
                  <SkeletonList />
                ) : venues.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="font-display text-xl font-bold text-ink">
                      No venues match your filters
                    </p>
                    <p className="mt-2 text-lg text-ink-soft">
                      Try removing a filter or searching a different city.
                    </p>
                  </Card>
                ) : (
                  <>
                    {visibleVenues.map((venue) => (
                      <VenueCard
                        key={venue.id}
                        venue={venue}
                        active={venue.id === activeId}
                        onHover={setActiveId}
                      />
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        className="w-full rounded-xl border border-brand-200 bg-surface px-4 py-2.5 text-base font-semibold text-link transition-colors hover:bg-brand-50"
                      >
                        See more (
                        <span className="font-mono tabular-nums">
                          {Math.min(PAGE_SIZE, venues.length - visibleCount)}
                        </span>{" "}
                        of{" "}
                        <span className="font-mono tabular-nums">
                          {venues.length - visibleCount}
                        </span>{" "}
                        remaining)
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {view !== "list" && (
              // On phones the map sits on top of the list (order-first) — the
              // maps-app layout. Desktop keeps its DOM order (list left, map
              // right) via lg:order-none. Shorter on mobile in split so the
              // list shows below the fold; taller when it's the only view.
              <div
                className={`order-first min-h-[260px] overflow-hidden rounded-2xl border border-sand-200 shadow-sm lg:order-none lg:h-[600px] ${
                  view === "map" ? "h-[70vh]" : "h-[42vh]"
                }`}
              >
                <VenueMap
                  venues={venues}
                  center={mapCenter}
                  activeId={activeId}
                  onSelect={setActiveId}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
      >
        {filterPanel}
      </BottomSheet>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-sand-200 bg-surface p-4"
        >
          <div className="h-4 w-1/2 rounded bg-sand-200" />
          <div className="mt-2 h-3 w-2/3 rounded bg-sand-100" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-20 rounded-full bg-sand-100" />
            <div className="h-5 w-24 rounded-full bg-sand-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
