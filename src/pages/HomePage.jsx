import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchVenues } from "../lib/api";
import VenueCard from "../components/VenueCard";

const STEPS = [
  {
    title: "Contributors upload photos",
    body: "Snap a photo of an entrance, restroom, parking area, or seating — no tedious forms to fill out.",
  },
  {
    title: "AI detects accessibility features",
    body: "A Grounding DINO computer-vision model finds features like ramps, wide doors, and seating, and shows exactly where each one is.",
  },
  {
    title: "The community verifies",
    body: "Other members confirm or correct each detection, so information is trustworthy — never AI-only.",
  },
  {
    title: "Visitors decide with confidence",
    body: "Every venue gets a 0–100 accessibility score with photo evidence, so you can plan a visit before leaving home.",
  },
];

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
            Community-verified accessibility details and AI-detected features —
            so the 61 million Americans with disabilities can find accessible
            venues before they leave home.
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

      <section
        aria-labelledby="how-heading"
        className="bg-white border-b border-gray-100"
      >
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2
            id="how-heading"
            className="text-2xl font-bold text-gray-900 text-center"
          >
            How it works
          </h2>
          <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700"
                >
                  {i + 1}
                </span>
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
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

      <section className="bg-white border-t border-gray-100">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Help build the map</h2>
          <p className="mt-2 text-gray-600">
            Every photo you add makes it easier for someone to visit a new place
            with confidence.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/add-venue"
              className="rounded-md bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
            >
              Add a venue
            </Link>
            <Link
              to="/search"
              className="rounded-md border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Find accessible places
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
