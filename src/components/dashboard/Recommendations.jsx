import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../../lib/api";
import ScoreBadge from "../ScoreBadge";
import SaveButton from "../SaveButton";
import { featureLabel } from "../../lib/features";

// AI-style venue suggestions. There's no dedicated recommendations endpoint
// yet, so this delegates to venue search (nearest-first if the user shares
// location, else top-scored) and shows a plain-English match reason.
export default function Recommendations() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | done | error

  useEffect(() => {
    let cancelled = false;

    async function load(coords) {
      try {
        const recs = await getRecommendations({ ...coords, limit: 3 });
        if (!cancelled) {
          setItems(recs);
          setStatus("done");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    // Try to tailor by location, but don't block on it.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => load({}),
        { timeout: 5000 },
      );
    } else {
      load({});
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="recs-heading" className="h-full">
      <h2 id="recs-heading" className="text-lg font-semibold text-gray-900">
        Recommended for you
      </h2>
      <p className="text-xs text-gray-500">Based on accessibility scores near you</p>

      {status === "loading" && (
        <p className="mt-3 text-sm text-gray-500" role="status">
          Finding accessible venues…
        </p>
      )}

      {status === "error" && (
        <p className="mt-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500" role="alert">
          Couldn&apos;t load recommendations right now.
        </p>
      )}

      {status === "done" && (
        <div className="mt-3 space-y-3">
          {items.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No venues to recommend yet.
            </p>
          ) : (
            items.map((v) => (
              <article
                key={v.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/venue/${v.id}`}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {v.name}
                  </Link>
                  <ScoreBadge score={v.accessibilityScore} size="sm" />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {v.address}
                  {v.city ? `, ${v.city}` : ""}
                </p>
                {v.featureKeys?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.featureKeys.slice(0, 3).map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {featureLabel(k)}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-400">{v.reason}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/venue/${v.id}`}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    View
                  </Link>
                  <SaveButton venue={v} size="sm" />
                </div>
              </article>
            ))
          )}
          <Link
            to="/search"
            className="inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            See more matches →
          </Link>
        </div>
      )}
    </section>
  );
}
