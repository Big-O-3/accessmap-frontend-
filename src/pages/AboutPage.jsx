import { Link } from "react-router-dom";

// About AccessMap — a static, frontend-only content page describing the
// mission, how the platform works, and the AI behind it. Mirrors the visual
// language of the home page (indigo hero + max-w content sections).

const STEPS = [
  {
    title: "Contributors upload photos",
    body: "Snap a photo of an entrance, restroom, parking area, or seating — no tedious forms to fill out.",
  },
  {
    title: "AI detects accessibility features",
    body: "Our computer-vision model finds features like ramps, wide doors, and seating, and draws boxes showing exactly where each one is.",
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

const COMPARISONS = [
  {
    name: "Generic map apps",
    problem: 'A single "wheelchair accessible" badge with no detail — no door widths, ramps, or grab bars, and no photo proof.',
  },
  {
    name: "Crowdsourced wheelchair maps",
    problem: "Often wheelchair-only and photo-free, ignoring vision, hearing, and sensory needs.",
  },
  {
    name: "Review sites",
    problem: "Accessibility info is buried in free-text reviews with no structured filtering.",
  },
];

function Section({ title, children, id }) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-3xl px-4 py-10">
      <h2 id={id} className="text-2xl font-bold text-gray-900">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-gray-600">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">About AccessMap</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
            Community-powered accessibility discovery — so the 61 million
            Americans with disabilities can find truly accessible venues before
            they leave home.
          </p>
        </div>
      </section>

      {/* Mission */}
      <Section id="mission-heading" title="Our mission">
        <p>
          People with disabilities can&apos;t trust the accessibility
          information they find online. Most platforms show a vague
          &quot;wheelchair accessible&quot; label with no specifics — nothing
          about door widths, ramp slopes, restroom grab bars, parking, or
          sensory accommodations — and no proof.
        </p>
        <p>
          AccessMap turns community photos into a trustworthy database. An AI
          vision model detects accessibility features in uploaded photos, the
          community verifies each detection, and together they produce a
          detailed, photo-backed accessibility score for every venue.
        </p>
      </Section>

      {/* How it works */}
      <div className="bg-white">
        <Section id="how-heading" title="How it works">
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-gray-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {/* The AI */}
      <Section id="ai-heading" title="The AI behind AccessMap">
        <p>
          Our primary AI feature is computer-vision accessibility detection.
          When a contributor uploads a photo, a Grounding DINO object-detection
          model identifies accessibility features and returns bounding boxes
          showing exactly where each one is located.
        </p>
        <p>
          Detection is always a starting point, never the final word. Every
          result shows a confidence score, is announced as text (not conveyed by
          boxes alone), and enters the community verification queue — a feature
          only counts toward a venue&apos;s official score once real people
          confirm it.
        </p>
      </Section>

      {/* Why we're different */}
      <div className="bg-white">
        <Section id="different-heading" title="Why we're different">
          <ul className="space-y-4">
            {COMPARISONS.map((c) => (
              <li
                key={c.name}
                className="rounded-lg border border-gray-200 p-4"
              >
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{c.problem}</p>
              </li>
            ))}
          </ul>
          <p>
            AccessMap combines structured, filterable features with photo
            evidence and community verification across mobility, vision,
            hearing, and sensory needs — not just a single yes/no badge.
          </p>
        </Section>
      </div>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
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
      </section>
    </div>
  );
}
