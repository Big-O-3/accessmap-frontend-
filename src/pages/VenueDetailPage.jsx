import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getVenue, createReview } from "../lib/api";
import { ACCESSIBILITY_FEATURES, FEATURE_BY_KEY } from "../lib/features";
import { useAuth } from "../context/useAuth";
import ScoreBadge from "../components/ScoreBadge";
import SaveButton from "../components/SaveButton";
import DetectionImage from "../components/DetectionImage";

export default function VenueDetailPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVenue(id)
      .then((data) => {
        if (cancelled) return;
        setVenue(data);
        setReviews(data.reviews ?? []);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-ink-faint animate-pulse">
        Loading venue…
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-red-600">{error || "Venue not found."}</p>
        <Link to="/search" className="text-link hover:underline text-sm">
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
        className="text-link hover:underline text-sm mb-4 inline-block font-medium"
      >
        ← Back to search
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap rounded-2xl border border-sand-200 bg-surface p-6 shadow-sm">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink leading-tight">
            {venue.name}
          </h1>
          <p className="mt-1 text-ink-soft">
            {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <ScoreBadge score={venue.accessibilityScore} size="lg" />
          <div className="flex items-center gap-2">
            <SaveButton venue={{ ...venue, id: venue.id ?? id }} />
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Get directions
            </a>
          </div>
        </div>
      </div>

      <FeatureBreakdown features={venue.features} />

      {venue.photos?.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold text-ink mb-4">
            AI-analyzed photos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {venue.photos.map((photo) => (
              <DetectionImage key={photo.id} photo={photo} />
            ))}
          </div>
        </section>
      )}

      <ReviewsSection
        venueId={venue.id ?? id}
        reviews={reviews}
        onAdd={(review) => setReviews((prev) => [review, ...prev])}
      />
    </div>
  );
}

function ReviewsSection({ venueId, reviews, onAdd }) {
  const { user } = useAuth();

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold text-ink mb-4">
        Community reviews {reviews.length > 0 && `(${reviews.length})`}
      </h2>

      {user ? (
        <ReviewForm venueId={venueId} onAdd={onAdd} />
      ) : (
        <p className="mb-4 rounded-xl border border-sand-200 bg-sand-100 px-4 py-3 text-sm text-ink-soft">
          <Link to="/login" className="text-link font-medium hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      <ReviewList reviews={reviews} />
    </section>
  );
}

function ReviewForm({ venueId, onAdd }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const review = await createReview({ venueId, rating, comment, visitDate });
      onAdd(review);
      setRating(0);
      setComment("");
      setVisitDate("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-sand-200 bg-surface p-5 shadow-sm space-y-4"
    >
      <div>
        <span className="block text-sm font-medium text-ink mb-1.5">
          Your rating
        </span>
        <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              aria-checked={rating === star}
              role="radio"
              className="text-2xl leading-none text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
            >
              {(hovered || rating) >= star ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-ink mb-1.5"
        >
          Your review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share how accessible this place was for you…"
          className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="review-date"
          className="block text-sm font-medium text-ink mb-1.5"
        >
          Visit date <span className="text-ink-faint">(optional)</span>
        </label>
        <input
          id="review-date"
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className="rounded-xl border border-sand-200 px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

function FeatureBreakdown({ features }) {
  const byKey = Object.fromEntries(features.map((f) => [f.type, f]));

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold text-ink mb-4">
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
              className={`flex items-center justify-between rounded-xl border p-4 ${
                present
                  ? meta.barrier
                    ? "border-red-200 bg-red-50"
                    : "border-brand-200 bg-brand-50"
                  : "border-sand-200 bg-sand-50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{meta.label}</p>
                  {feature?.mlDetected && (
                    <p className="text-xs text-ink-soft">
                      AI-detected · {Math.round((feature.confidence ?? 0) * 100)}%
                      confidence
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {present ? (
                  verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-xs text-ink-soft">
                      {feature.verifiedCount ?? 0} verifications
                    </span>
                  )
                ) : (
                  <span className="text-xs text-ink-faint">Not reported</span>
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
  if (reviews.length === 0) {
    return <p className="text-sm text-ink-soft">No reviews yet.</p>;
  }
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-2xl border border-sand-200 bg-surface p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">{review.userName}</span>
            <span
              className="text-accent-500"
              aria-label={`${review.rating} out of 5 stars`}
            >
              {"★".repeat(review.rating)}
              <span className="text-sand-200">{"★".repeat(5 - review.rating)}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            {review.comment}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-ink-faint">
            {review.visitDate && (
              <span>Visited {new Date(review.visitDate).toLocaleDateString()}</span>
            )}
            <span>{review.helpfulCount ?? 0} found helpful</span>
          </div>
        </article>
      ))}
    </div>
  );
}
