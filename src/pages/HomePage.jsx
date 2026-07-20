import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchVenues } from "../lib/api";
import VenueCard from "../components/VenueCard";

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    searchVenues({}).then((data) => setFeatured(data.venues.slice(0, 3)));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/search?city=${encodeURIComponent(query)}`);
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-indigo-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">
            Find truly accessible places
          </h1>
          <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
            Community-verified accessibility details and AI-detected features.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-8 flex max-w-xl mx-auto gap-2 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city…"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-3 gap-4 text-center mb-12">
          <Stat label="Venues reviewed" value="200+" />
          <Stat label="Photos analyzed" value="1,000+" />
          <Stat label="Features detected" value="5,000+" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Featured venues</h2>
          <Link to="/search" className="text-indigo-600 hover:underline text-sm">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 py-6">
      <p className="text-3xl font-bold text-indigo-600">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
