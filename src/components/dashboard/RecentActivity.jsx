import { Link } from "react-router-dom";
import { timeAgo } from "../../lib/timeAgo";

// Reverse-chronological feed of the actions taken in this browser (saving a
// venue, creating a venue, submitting a contribution). Each row links to its
// venue when there is one.
//
// The list fills the card's full height (it's stretched to match the
// recommendations column beside it) and scrolls INSIDE the card. That fills the
// space with as many rows as fit instead of leaving it half-empty, while still
// keeping repeated saves from growing the whole dashboard down the page.
export default function RecentActivity({ activity }) {
  return (
    <section aria-labelledby="activity-heading" className="flex h-full flex-col">
      <h2 id="activity-heading" className="font-display text-xl font-extrabold text-ink">
        Recent activity
      </h2>
      {/* Subtitle mirrors the one on Recommendations so both column headers are
          the same height and their cards line up side by side. */}
      <p className="text-sm text-ink-soft">Your latest saves and contributions</p>

      {activity.length === 0 ? (
        // flex-1 so the card fills its column: the two dashboard columns are
        // stretched to equal height, and without this the shorter one's card
        // would float at the top with empty space, looking smaller.
        <p className="mt-3 flex flex-1 items-center justify-center rounded-2xl border border-sand-200 bg-surface p-6 text-center text-base text-ink-soft shadow-sm">
          No activity yet. Save a venue or add one to get started.
        </p>
      ) : (
        // The scrolling list is absolutely positioned inside this flex-1
        // wrapper so its rows DON'T contribute to the column's height. That way
        // the recommendations column beside it always drives the row height and
        // this list fills exactly that, scrolling internally - however many
        // entries there are, the dashboard never grows down the page. On mobile
        // there's no sibling column, so min-h gives the wrapper a real height to
        // fill; lg:min-h-0 hands height back to the equal-height grid row.
        <div className="relative mt-3 min-h-[20rem] flex-1 lg:min-h-0">
          <ul className="absolute inset-0 divide-y divide-sand-200 overflow-y-auto rounded-2xl border border-sand-200 bg-surface shadow-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-base text-ink">
                    {a.venueId ? (
                      <ActivityText detail={a.detail} venueId={a.venueId} venueName={a.venueName} />
                    ) : (
                      a.detail
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-faint">{timeAgo(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// Render the activity detail, linking the venue name to its page when present.
// Split on the FIRST occurrence only - a venue name can repeat in the detail
// (e.g. a venue literally named "favorites"), and splitting on all occurrences
// would drop trailing text.
function ActivityText({ detail, venueId, venueName }) {
  const idx = venueName ? detail.indexOf(venueName) : -1;
  if (idx === -1) return detail;

  const before = detail.slice(0, idx);
  const after = detail.slice(idx + venueName.length);
  return (
    <>
      {before}
      <Link to={`/venue/${venueId}`} className="font-medium text-link hover:underline">
        {venueName}
      </Link>
      {after}
    </>
  );
}
