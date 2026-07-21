import { Link } from "react-router-dom";
import { timeAgo } from "../../lib/timeAgo";

// Reverse-chronological feed of the actions taken in this browser (saving a
// venue, creating a venue, submitting a contribution). Each row links to its
// venue when there is one.
export default function RecentActivity({ activity }) {
  return (
    <section aria-labelledby="activity-heading" className="h-full">
      <h2 id="activity-heading" className="text-lg font-semibold text-gray-900">
        Recent activity
      </h2>

      {activity.length === 0 ? (
        <p className="mt-3 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No activity yet. Save a venue or add one to get started.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {activity.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-800">
                  {a.venueId ? (
                    <ActivityText detail={a.detail} venueId={a.venueId} venueName={a.venueName} />
                  ) : (
                    a.detail
                  )}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{timeAgo(a.createdAt)}</p>
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
      <Link to={`/venue/${venueId}`} className="font-medium text-indigo-600 hover:underline">
        {venueName}
      </Link>
      {after}
    </>
  );
}
