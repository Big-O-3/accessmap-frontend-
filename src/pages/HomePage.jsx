import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchVenues } from "../lib/api";
import VenueCard from "../components/VenueCard";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Card from "../components/Card";
import useCountUp from "../hooks/useCountUp";

// Brand gradient for the primary "Scan" tile on the mobile home — matches the
// raised Scan button in the bottom nav so the two read as the same action.
const MARK_GRADIENT =
  "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))";

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
    body: "Every venue shows a clear rating — Accessible, Partially accessible, or Not accessible — backed by photo evidence, so you can plan a visit before leaving home.",
  },
];

function SearchGlyph({ className }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MapPinGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

// A single cross-fading layer inside the story phone. Only the active step's
// layer is shown; the rest fade out.
function Layer({ show, children }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {children}
    </div>
  );
}

function DetectionTag({ className, label, conf }) {
  return (
    <div
      className={`absolute rounded-lg border-2 border-dashed border-brand-400 ${className}`}
    >
      <span className="absolute -top-3 left-0 whitespace-nowrap rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {label} <span className="font-mono">{conf}</span>
      </span>
    </div>
  );
}

// The sticky "phone" that walks through the four steps as the text scrolls by
// (the Apple-style "take a closer look" pattern). Purely decorative — the same
// story is spelled out in the numbered text steps beside it, so nothing here is
// required to understand how AccessMap works.
function StoryPhone({ activeStep }) {
  return (
    <div className="mx-auto w-full max-w-[clamp(20rem,26vw,28rem)]">
      <div className="relative overflow-hidden rounded-[2rem] border border-sand-200 bg-surface shadow-xl">
        <div
          className="relative aspect-[4/5]"
          style={{ background: "linear-gradient(150deg,#23485e,#0f2230)" }}
        >
          {/* 1 — a fresh photo */}
          <Layer show={activeStep === 0}>
            <div className="flex h-full flex-col items-center justify-center gap-3 text-white/90">
              <CameraGlyph />
              <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold backdrop-blur">
                Entrance photo
              </span>
            </div>
          </Layer>

          {/* 2 — AI detections drawn on the photo */}
          <Layer show={activeStep === 1}>
            <DetectionTag
              className="left-6 top-10 h-24 w-20"
              label="Ramp"
              conf="0.94"
            />
            <DetectionTag
              className="bottom-14 right-6 h-20 w-16"
              label="Wide door"
              conf="0.88"
            />
          </Layer>

          {/* 3 — community verification */}
          <Layer show={activeStep === 2}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="rounded-2xl bg-black/45 px-4 py-3 text-center text-sm font-semibold text-white backdrop-blur">
                <span className="text-success">✓</span> Verified by 3 people
              </span>
            </div>
          </Layer>

          {/* 4 — the plain-language rating users actually see (no raw number) */}
          <Layer show={activeStep === 3}>
            <div className="flex h-full flex-col justify-end p-4">
              <div className="rounded-2xl bg-black/50 p-4 backdrop-blur">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Accessibility
                </span>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-base font-semibold text-success ring-1 ring-inset ring-success-ring">
                    <span aria-hidden="true">✓</span> Accessible
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/70">
                  A clear rating from real photos — no number to decode.
                </p>
              </div>
            </div>
          </Layer>
        </div>

        {/* Caption + progress dots follow the active step. */}
        <div className="p-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((step, i) => (
              <span
                key={step.title}
                className={`h-1.5 rounded-full transition-all ${
                  activeStep === i ? "w-6 bg-brand-500" : "w-1.5 bg-sand-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 font-display font-bold text-ink">
            {STEPS[activeStep].title}
          </p>
        </div>
      </div>
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-sand-200 bg-surface p-4 shadow-sm"
        >
          <div className="h-5 w-2/3 animate-pulse rounded bg-sand-100" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-sand-100" />
          <div className="mt-4 flex gap-1.5">
            <div className="h-6 w-24 animate-pulse rounded-full bg-sand-100" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-sand-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// One of the two smaller quick-action tiles under the primary "Scan" tile.
function SecondaryTile({ to, glyph, label }) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-3 rounded-3xl border border-sand-200 bg-surface p-4 shadow-sm transition-transform active:scale-[0.98]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {glyph}
      </span>
      <span className="font-display text-base font-bold text-ink">{label}</span>
    </Link>
  );
}

// The phone home screen: an app-style, task-first layout that replaces the
// marketing page on small screens (below md). Search sits up top, the primary
// actions are big thumb-friendly tiles, and a short venue list rounds it out.
// It reuses the featured-venue data the page already fetched, so there's no
// extra request. The full marketing story still shows on tablet/desktop.
function MobileHome({ query, setQuery, handleSearch, featured, status }) {
  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink">
        Find accessible places
      </h1>
      <p className="mt-1 text-base text-ink-soft">
        Community-verified, AI-assisted.
      </p>

      {/* Search — the fastest path to a venue, so it leads. */}
      <form
        onSubmit={handleSearch}
        className="mt-5 flex items-center gap-2 rounded-2xl border border-sand-200 bg-surface p-2 pl-4 shadow-sm"
      >
        <SearchGlyph className="h-5 w-5 flex-none text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by city…"
          aria-label="Search venues by city"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink outline-none placeholder:text-ink-faint"
        />
        <Button type="submit">Search</Button>
      </form>

      {/* Primary actions, sized for thumbs. Scan leads as the hero task. */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          to="/analyze"
          className="col-span-2 flex items-center gap-4 rounded-3xl p-5 text-white shadow-lg transition-transform active:scale-[0.98]"
          style={{ background: MARK_GRADIENT }}
        >
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/20">
            <CameraGlyph />
          </span>
          <span>
            <span className="block font-display text-lg font-extrabold">
              Scan a place
            </span>
            <span className="block text-sm text-white/85">
              Detect accessibility from a photo
            </span>
          </span>
        </Link>
        <SecondaryTile to="/add-venue" glyph={<PlusGlyph />} label="Add a venue" />
        <SecondaryTile to="/search" glyph={<MapPinGlyph />} label="Explore map" />
      </div>

      {/* A short taste of the map — full list is one tap away. */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold text-ink">
          Featured venues
        </h2>
        <Link to="/search" className="text-sm font-semibold text-link">
          View all →
        </Link>
      </div>

      <div className="mt-3">
        {status === "loading" && (
          <>
            <p role="status" className="sr-only">
              Loading featured venues…
            </p>
            <FeaturedSkeleton />
          </>
        )}

        {status === "error" && (
          <Card className="p-5 text-center">
            <p role="alert" className="text-ink-soft">
              We couldn't load venues right now.
            </p>
            <div className="mt-3 flex justify-center">
              <Button as={Link} to="/search" variant="outline">
                Browse all venues
              </Button>
            </div>
          </Card>
        )}

        {status === "ready" && featured.length === 0 && (
          <Card className="p-6 text-center">
            <p className="font-display text-lg font-bold text-ink">
              No venues yet
            </p>
            <p className="mt-1 text-ink-soft">
              Be the first to map an accessible place.
            </p>
            <div className="mt-4 flex justify-center">
              <Button as={Link} to="/add-venue">
                Add a venue
              </Button>
            </div>
          </Card>
        )}

        {status === "ready" && featured.length > 0 && (
          <div className="space-y-3">
            {featured.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  // Which "How it works" step is centered in the viewport (drives the phone).
  const [activeStep, setActiveStep] = useState(0);
  const stepsRef = useRef(null);
  // Read once: reduced-motion users get the calm, all-visible layout.
  const [reduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // The "61 million" beat counts up when it scrolls into view.
  const [countRef, count] = useCountUp(61);

  useEffect(() => {
    let alive = true;
    searchVenues({})
      .then((data) => {
        if (!alive) return;
        setFeatured(data.venues.slice(0, 3));
        setStatus("ready");
      })
      .catch(() => {
        if (alive) setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  // Track the active step with a thin "trip line" across the middle of the
  // screen: whichever step block crosses it becomes active. Skipped entirely
  // for reduced-motion users (the phone just stays on step one).
  useEffect(() => {
    if (reduced || !("IntersectionObserver" in window)) return;
    const container = stepsRef.current;
    if (!container) return;

    const items = container.querySelectorAll("[data-step]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveStep(Number(entry.target.dataset.step));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reduced]);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/search?city=${encodeURIComponent(query)}`);
  }

  return (
    <div>
      {/* Phones get a compact, app-style home (search + quick actions + a short
          venue list). Everything below is the full marketing story for md+. */}
      <div className="md:hidden">
        <MobileHome
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
          featured={featured}
          status={status}
        />
      </div>

      <div className="hidden md:block">
      {/* ===================== HERO ===================== */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center sm:pt-28">
        <Reveal delay={0.05}>
          <span className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-surface/70 px-4 py-1.5 text-sm font-semibold text-ink-soft backdrop-blur">
            <span className="text-gradient">◆</span> Community-verified ·
            AI-assisted
          </span>
        </Reveal>
        <Reveal
          as="h1"
          delay={0.12}
          className="mt-6 font-display text-5xl font-extrabold leading-[1.03] tracking-tight text-ink sm:text-6xl"
        >
          Find truly <span className="text-gradient">accessible</span> places
        </Reveal>
        <Reveal
          as="p"
          delay={0.2}
          className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft"
        >
          Community-verified accessibility details and AI-detected features — so
          you can find a venue that welcomes you before you leave home.
        </Reveal>
        <Reveal delay={0.28} className="mx-auto mt-9 max-w-xl">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 rounded-2xl border border-sand-200 bg-surface p-2 pl-4 shadow-lg"
          >
            <SearchGlyph className="h-5 w-5 flex-none text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city…"
              aria-label="Search venues by city"
              className="min-w-0 flex-1 bg-transparent py-2 text-ink outline-none placeholder:text-ink-faint"
            />
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
        </Reveal>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-sand-200 to-transparent" />
      </div>

      {/* ===================== HOW IT WORKS (pinned) ===================== */}
      <section
        aria-labelledby="how-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24"
      >
        <Reveal className="max-w-2xl">
          <h2
            id="how-heading"
            className="font-display text-3xl font-extrabold text-ink sm:text-4xl"
          >
            How it works
          </h2>
          <p className="mt-3 text-lg text-ink-soft">
            From one quick photo to a score you can trust — here's the path every
            venue takes.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Sticky visual — desktop only, so mobile stays a calm list.
              Vertically centered in the viewport so the phone lines up with the
              active step as it scrolls past the middle of the screen. */}
          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center">
              <StoryPhone activeStep={activeStep} />
            </div>
          </div>

          <ol ref={stepsRef} className="space-y-6 lg:space-y-0">
            {STEPS.map((step, i) => {
              const dim = !reduced && activeStep !== i;
              return (
                <li
                  key={step.title}
                  data-step={i}
                  className={`rounded-3xl border border-sand-200 bg-surface p-6 shadow-sm transition-opacity duration-500 lg:flex lg:min-h-[70vh] lg:flex-col lg:justify-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none ${
                    dim ? "lg:opacity-40" : "lg:opacity-100"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 font-display text-xl font-extrabold text-white shadow-md"
                  >
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-md text-lg leading-relaxed text-ink-soft">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ===================== BEAT — why it matters ===================== */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center sm:py-24">
        <Reveal>
          <p className="font-display text-5xl font-black tracking-tight sm:text-7xl">
            <span ref={countRef} className="text-gradient font-mono tabular-nums">
              {count}
            </span>
            <span className="text-gradient">M+</span>
          </p>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
            Americans live with a disability. AccessMap helps them know a place
            is accessible before they leave home.
          </p>
        </Reveal>
      </section>

      {/* ===================== FEATURED VENUES ===================== */}
      <section
        aria-labelledby="featured-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
      >
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2
              id="featured-heading"
              className="font-display text-3xl font-extrabold text-ink sm:text-4xl"
            >
              Featured venues
            </h2>
            <p className="mt-2 text-lg text-ink-soft">
              A few places the community has mapped recently.
            </p>
          </div>
          <Link
            to="/search"
            className="whitespace-nowrap text-sm font-semibold text-link hover:underline"
          >
            View all →
          </Link>
        </Reveal>

        {status === "loading" && (
          <>
            <p role="status" className="sr-only">
              Loading featured venues…
            </p>
            <FeaturedSkeleton />
          </>
        )}

        {status === "error" && (
          <Card className="p-6 text-center">
            <p role="alert" className="text-ink-soft">
              We couldn't load featured venues right now.
            </p>
            <div className="mt-4 flex justify-center">
              <Button as={Link} to="/search" variant="outline">
                Browse all venues
              </Button>
            </div>
          </Card>
        )}

        {status === "ready" && featured.length === 0 && (
          <Card className="p-8 text-center">
            <p className="font-display text-lg font-bold text-ink">
              No venues yet
            </p>
            <p className="mt-2 text-ink-soft">
              Be the first to put an accessible place on the map.
            </p>
            <div className="mt-5 flex justify-center">
              <Button as={Link} to="/add-venue">
                Add a venue
              </Button>
            </div>
          </Card>
        )}

        {status === "ready" && featured.length > 0 && (
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((venue, i) => (
              <Reveal key={venue.id} delay={i * 0.08}>
                <VenueCard venue={venue} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ===================== CTA ===================== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-sand-200 bg-surface p-10 text-center shadow-lg sm:p-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -top-24 h-64"
              style={{
                background:
                  "radial-gradient(50% 60% at 50% 0%, var(--color-brand-400), transparent 70%)",
                opacity: 0.22,
              }}
            />
            <h2 className="relative font-display text-3xl font-extrabold text-ink sm:text-4xl">
              Help build the map
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-lg text-ink-soft">
              Every photo you add makes it easier for someone to visit a new
              place with confidence.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button as={Link} to="/add-venue" size="lg">
                Add a venue
              </Button>
              <Button as={Link} to="/search" variant="outline" size="lg">
                Find accessible places
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
      </div>
    </div>
  );
}
