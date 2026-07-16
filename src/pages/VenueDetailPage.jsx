import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getVenue } from "../lib/api";
import { ACCESSIBILITY_FEATURES, FEATURE_BY_KEY } from "../lib/features";
import ScoreBadge from "../components/ScoreBadge";
import DetectionImage from "../components/DetectionImage";

export default function VenueDetailPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVenue(id)
      .then((data) => !cancelled && setVenue(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-gray-400 animate-pulse">
        Loading venue…
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-red-600">{error || "Venue not found."}</p>
        <Link to="/search" className="text-indigo-600 hover:underline text-sm">
          ← Back to search
        </Link>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${venue.address}, ${venue.city}, ${venue.state}`,
  )}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        to="/search"
        className="text-indigo-600 hover:underline text-sm mb-4 inline-block"
      >
        ← Back to search
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{venue.name}</h1>
          <p className="text-gray-500">
            {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ScoreBadge score={venue.accessibilityScore} size="lg" />
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Get directions
          </a>
        </div>
      </div>

      <FeatureBreakdown features={venue.features} />

      {venue.photos?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            AI-analyzed photos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {venue.photos.map((photo) => (
              <DetectionImage key={photo.id} photo={photo} />
            ))}
          </div>
        </section>
      )}

      <ReviewList reviews={venue.reviews} />
    </div>
  );
}

function FeatureBreakdown({ features }) {
  const byKey = Object.fromEntries(features.map((f) => [f.type, f]));

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">
        Accessibility features
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACCESSIBILITY_FEATURES.map((meta) => {
          const feature = byKey[meta.key];
          const present = !!feature;
          const verified = (feature?.verifiedCount ?? 0) >= 3;
          return (
            <div
              key={meta.key}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                present
                  ? meta.barrier
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {meta.label}
                  </p>
                  {feature?.mlDetected && (
                    <p className="text-xs text-gray-500">
                      AI-detected · {Math.round((feature.confidence ?? 0) * 100)}%
                      confidence
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {present ? (
                  verified ? (
                    <span className="text-xs font-medium text-green-700">
                      ✓ Community verified
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {feature.verifiedCount ?? 0} verifications
                    </span>
                  )
                ) : (
                  <span className="text-xs text-gray-400">Not reported</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReviewList({ reviews = [] }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">
        Community reviews {reviews.length > 0 && `(${reviews.length})`}
      </h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {review.userName}
                </span>
                <span className="text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                {review.visitDate && <span>Visited {review.visitDate}</span>}
                <span>{review.helpfulCount} found helpful</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
