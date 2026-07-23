import { Link } from "react-router-dom";
import { timeAgo } from "../../lib/timeAgo";

// Reverse-chronological feed of the actions taken in this browser (saving a
// venue, creating a venue, submitting a contribution). Each row links to its
// venue when there is one.
export default function RecentActivity({ activity }) {
  return (
    <section aria-labelledby="activity-heading" className="h-full">
      <h2 id="activity-heading" className="font-display text-xl font-semibold text-ink">
        Recent activity
      </h2>

      {activity.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-sand-200 bg-surface p-6 text-center text-sm text-ink-soft shadow-sm">
          No activity yet. Save a venue or add one to get started.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-surface shadow-sm">
          {activity.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-ink">
                  {a.venueId ? (
                    <ActivityText detail={a.detail} venueId={a.venueId} venueName={a.venueName} />
                  ) : (
                    a.detail
                  )}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">{timeAgo(a.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Render the activity detail, linking the venue name to its page when present.
// Split on the FIRST occurrence only — a venue name can repeat in the detail
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
