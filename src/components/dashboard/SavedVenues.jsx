import { Link } from "react-router-dom";
import ScoreBadge from "../ScoreBadge";
import SaveButton from "../SaveButton";

// Grid of the venues saved in this browser, plus a "find more" tile back to
// search. Reads the live saved list passed in from the page.
export default function SavedVenues({ saved }) {
  return (
    <section aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="font-display text-xl font-semibold text-ink">
        Your saved venues
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {saved.map((v) => (
          <div
            key={v.id}
            className="flex flex-col justify-between rounded-2xl border border-sand-200 bg-surface p-4 shadow-sm"
          >
            <div>
              <Link
                to={`/venue/${v.id}`}
                className="font-display font-semibold text-ink hover:underline"
              >
                {v.name}
              </Link>
              {v.city && <p className="mt-0.5 text-xs text-ink-soft">{v.city}</p>}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <ScoreBadge score={v.accessibilityScore} size="sm" />
              <SaveButton venue={v} size="sm" />
            </div>
          </div>
        ))}

        {/* Find-more tile. */}
        <Link
          to="/search"
          className="flex min-h-[7rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sand-200 p-4 text-center text-sm font-semibold text-link transition-colors hover:border-brand-400 hover:bg-brand-50/40"
        >
          + Find more venues
        </Link>
      </div>
    </section>
  );
}
