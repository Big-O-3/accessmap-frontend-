import { Link } from "react-router-dom";
import Button from "../components/Button";

// Fallback page for unbuilt routes and the 404 catch-all. Kept minimal so
// unfinished features and unknown URLs land somewhere navigable - but wrapped
// in the shared card idiom so it still reads as part of the app.
export default function StubPage({ title }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <div className="rounded-2xl border border-sand-200 bg-surface p-8 text-center shadow-sm sm:p-10">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-link ring-1 ring-inset ring-brand-200">
          Coming soon
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">
          {title}
        </h1>
        <p className="mt-2 text-base text-ink-soft">
          This page is not built yet. In the meantime, you can keep exploring venues.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/search">
            Find venues
          </Button>
          <Button as={Link} to="/" variant="outline">
            Back home
          </Button>
        </div>
      </div>
    </div>
  );
}
