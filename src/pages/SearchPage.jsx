import { useEffect, useState } from "react";
import { searchVenues } from "../lib/api";
import { getAnalyzedSpots } from "../lib/analyzedSpots";
import FilterPanel from "../components/FilterPanel";
import VenueCard from "../components/VenueCard";
import VenueMap from "../components/VenueMap";

export default function SearchPage() {
  const [city, setCity] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState("split"); // split | list | map

  // Re-run search whenever filters change (debounced for the city text input).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const filters = { city, features: selectedFeatures };
        if (location) {
          filters.lat = location.lat;
          filters.lng = location.lng;
        }
        const data = await searchVenues(filters);

        // Merge in any "analyzed spots" the user dropped from the Analyze page.
        // Apply the same feature filter so they behave like real venues; city
        // filtering is skipped since analyzed spots have no city.
        let analyzed = getAnalyzedSpots();
        if (selectedFeatures.length) {
          analyzed = analyzed.filter((s) =>
            selectedFeatures.every((f) => s.featureKeys.includes(f)),
          );
        }

        if (!cancelled) setVenues([...analyzed, ...data.venues]);
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
  }, [city, selectedFeatures, location]);

  function toggleFeature(key) {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
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

  const mapCenter = location
    ? location
    : venues[0]
      ? { lat: venues[0].latitude, lng: venues[0].longitude }
      : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Find accessible venues</h1>
        <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
          {["split", "list", "map"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 capitalize ${
                view === v
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-4 sticky top-6">
            <FilterPanel
              city={city}
              onCityChange={setCity}
              selectedFeatures={selectedFeatures}
              onToggleFeature={toggleFeature}
              onUseMyLocation={useMyLocation}
              hasLocation={!!location}
            />
          </div>
        </aside>

        <section className="lg:col-span-3">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
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
                  <p className="text-gray-500 text-sm py-8 text-center">
                    No venues match your filters.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">
                      {venues.length} venue{venues.length !== 1 && "s"}
                    </p>
                    {venues.map((venue) => (
                      <VenueCard
                        key={venue.id}
                        venue={venue}
                        active={venue.id === activeId}
                        onHover={setActiveId}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {view !== "list" && (
              <div className="h-[60vh] min-h-[320px] lg:h-[600px] rounded-lg overflow-hidden border border-gray-200">
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
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-4 animate-pulse"
        >
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
          <div className="mt-2 h-3 w-2/3 bg-gray-100 rounded" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
            <div className="h-5 w-24 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
