import { Link } from "react-router-dom";
import ScoreBadge from "../ScoreBadge";
import SaveButton from "../SaveButton";

// Grid of the venues saved in this browser, plus a "find more" tile back to
// search. Reads the live saved list passed in from the page.
export default function SavedVenues({ saved }) {
  return (
    <section aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="text-lg font-semibold text-gray-900">
        Your saved venues
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {saved.map((v) => (
          <div
            key={v.id}
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4"
          >
            <div>
              <Link
                to={`/venue/${v.id}`}
                className="font-semibold text-gray-900 hover:underline"
              >
                {v.name}
              </Link>
              {v.city && <p className="mt-0.5 text-xs text-gray-500">{v.city}</p>}
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
          className="flex min-h-[7rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-4 text-center text-sm font-medium text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/40"
        >
          + Find more venues
        </Link>
      </div>
    </section>
  );
}
