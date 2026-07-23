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
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white">
        {/* Soft decorative glow so the hero doesn't read as a flat block. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-zinc-400/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-zinc-200 ring-1 ring-white/20">
            ◆ Community-verified · AI-assisted
          </span>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl font-semibold leading-[1.05]">
            Find places that
            <br />
            <span className="italic text-[#ff8c69]">actually</span> welcome you
          </h1>
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex max-w-xl gap-2 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city…"
              className="flex-1 rounded-xl border border-sand-200 px-4 py-3 text-ink placeholder:text-ink-faint outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section
        aria-labelledby="how-heading"
        className="bg-surface border-b border-sand-200"
      >
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2
            id="how-heading"
            className="font-display text-3xl font-semibold text-ink text-center"
          >
            How it works
          </h2>
          <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-semibold text-white shadow-sm"
                >
                  {i + 1}
                </span>
                <h3 className="font-semibold text-ink">{step.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-3xl font-semibold text-ink">
            Featured venues
          </h2>
          <Link
            to="/search"
            className="text-link hover:underline text-sm font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featured.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      <section className="bg-sand-100 border-t border-sand-200">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold text-ink">
            Help build the map
          </h2>
          <p className="mt-3 text-ink-soft text-lg">
            Every photo you add makes it easier for someone to visit a new place
            with confidence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/add-venue"
              className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Add a venue
            </Link>
            <Link
              to="/search"
              className="rounded-xl border border-sand-200 bg-surface px-6 py-3 font-semibold text-ink-soft transition-colors hover:bg-sand-50"
            >
              Find accessible places
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
