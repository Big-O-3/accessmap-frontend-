import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getVenue,
  createReview,
  deleteReview,
  markReviewHelpful,
  unmarkReviewHelpful,
} from "../lib/api";
import { ACCESSIBILITY_FEATURES } from "../lib/features";
import { cleanText } from "../lib/profanity";
import { hasMarkedHelpful, setMarkedHelpful } from "../lib/userData";
import { useAuth } from "../context/useAuth";
import ScoreBadge from "../components/ScoreBadge";
import SaveButton from "../components/SaveButton";
import DetectionImage from "../components/DetectionImage";
import VenuePhotoContribution from "../components/VenuePhotoContribution";
import Button from "../components/Button";
import Card from "../components/Card";

export default function VenueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <p role="status" className="sr-only">
          Loading venue…
        </p>
        <div className="animate-pulse rounded-2xl border border-sand-200 bg-surface p-6 shadow-sm">
          <div className="h-8 w-2/3 rounded bg-sand-100" />
          <div className="mt-3 h-4 w-1/2 rounded bg-sand-100" />
          <div className="mt-6 h-10 w-40 rounded-xl bg-sand-100" />
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-8 text-center">
          <p role="alert" className="text-ink">
            {error || "Venue not found."}
          </p>
          <div className="mt-4 flex justify-center">
            <Button as={Link} to="/search" variant="outline">
              ← Back to search
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${venue.address}, ${venue.city}, ${venue.state}`,
  )}`;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      <Link
        to="/search"
        className="mb-4 inline-block text-base font-medium text-link hover:underline"
      >
        ← Back to search
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-sand-200 bg-surface p-5 shadow-sm sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:p-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            {venue.name}
          </h1>
          <p className="mt-1 text-base text-ink-soft sm:text-lg">
            {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
          </p>
        </div>
        {/* Stacks left-aligned on phones; the desktop layout (right-aligned
            column beside the title) is restored at sm+. Save sits on its own in
            the top corner so it no longer crowds the primary Get-directions
            action; the accessibility read-out sits between them. */}
        <div className="flex flex-col items-start gap-4 sm:items-end">
          <SaveButton venue={{ ...venue, id: venue.id ?? id }} />
          <AccessibilityStatus
            score={venue.accessibilityScore}
            verdict={venue.communityVerdict}
            votes={venue.accessVotes}
          />
          <Button
            as="a"
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full text-center sm:w-auto"
          >
            Get directions
          </Button>
        </div>
      </div>

      <FeatureBreakdown features={venue.features} />

      {venue.photos?.length > 0 && (
        <PhotoGallery
          photos={venue.photos}
          currentUserId={user?.id}
          onDelete={(photoId) =>
            setVenue((prev) => ({
              ...prev,
              photos: prev.photos.filter((p) => p.id !== photoId),
            }))
          }
        />
      )}

      {/* Add a photo, let the AI detect features, confirm them, and the venue's
          score + photo grid update in place from the re-fetched venue. */}
      <VenuePhotoContribution
        venue={{ ...venue, id: venue.id ?? id }}
        onUpdated={(updated) => {
          setVenue(updated);
          setReviews(updated.reviews ?? []);
        }}
      />

      <ReviewsSection
        venueId={venue.id ?? id}
        reviews={reviews}
        onAdd={(review) => setReviews((prev) => [review, ...prev])}
        onDelete={(reviewId) =>
          setReviews((prev) => prev.filter((r) => r.id !== reviewId))
        }
      />
    </div>
  );
}

// The venue's accessibility read-out: one block, not two competing pills.
// The ScoreBadge (feature/photo evidence, 0-100) is the headline verdict — it's
// what drives sort order and map-pin color everywhere — and the community's
// vote-based verdict folds in beneath it as a single caption line rather than a
// second, near-identical floating pill. The caption only appears once at least
// one vote exists, so we never show a misleading community answer.
const COMMUNITY_VERDICT = {
  yes: { label: "Accessible", cls: "text-green-700" },
  partial: { label: "Partially accessible", cls: "text-amber-700" },
  no: { label: "Not accessible", cls: "text-red-700" },
};

function AccessibilityStatus({ score, verdict, votes }) {
  const ui = COMMUNITY_VERDICT[verdict];
  const total = (votes?.yes ?? 0) + (votes?.partial ?? 0) + (votes?.no ?? 0);
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <ScoreBadge score={score} size="md" />
      {ui && (
        <p
          className="text-sm text-ink-soft"
          title={`Based on ${total} community vote${total !== 1 ? "s" : ""} (${votes?.yes ?? 0} yes · ${votes?.partial ?? 0} partial · ${votes?.no ?? 0} no)`}
        >
          Community:{" "}
          <span className={`font-semibold ${ui.cls}`}>{ui.label}</span>
        </p>
      )}
    </div>
  );
}

// The AI-analyzed photo grid with a feature filter. Every photo can carry
// several ML detections (ramp, restroom, parking…); the chip bar lets a visitor
// narrow the grid to photos that contain a chosen feature so they aren't forced
// to scan every photo. Chips are built from the features actually detected in
// THESE photos, so a chip never matches zero photos, and the whole bar is
// hidden when there's only one feature (or none) to filter by.
function PhotoGallery({ photos, currentUserId, onDelete }) {
  // "" means "All"; otherwise a feature key from the detections below.
  const [active, setActive] = useState("");

  // Distinct feature keys present across these photos, in the canonical order
  // from the shared vocabulary so the chips read consistently everywhere.
  const presentKeys = new Set(
    photos.flatMap((p) =>
      (p.detections ?? []).map((d) => d.accessibilityFeature),
    ),
  );
  const chips = ACCESSIBILITY_FEATURES.filter((f) => presentKeys.has(f.key));

  // If the active feature no longer appears in any photo (e.g. the uploader
  // deleted the last photo that had it), fall back to "All" so the grid can't
  // get stuck on a filter whose chip has disappeared.
  const effectiveActive = presentKeys.has(active) ? active : "";

  const filtered =
    effectiveActive === ""
      ? photos
      : photos.filter((p) =>
          (p.detections ?? []).some(
            (d) => d.accessibilityFeature === effectiveActive,
          ),
        );

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-display text-2xl font-extrabold text-ink">
        AI-analyzed photos
      </h2>

      {chips.length > 1 && (
        <div
          className="mb-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter photos by detected feature"
        >
          <FilterChip
            active={effectiveActive === ""}
            onClick={() => setActive("")}
          >
            All
            <span className="ml-1 font-mono tabular-nums opacity-70">
              {photos.length}
            </span>
          </FilterChip>
          {chips.map((f) => {
            const count = photos.filter((p) =>
              (p.detections ?? []).some(
                (d) => d.accessibilityFeature === f.key,
              ),
            ).length;
            return (
              <FilterChip
                key={f.key}
                active={effectiveActive === f.key}
                onClick={() => setActive(f.key)}
              >
                {f.label}
                <span className="ml-1 font-mono tabular-nums opacity-70">
                  {count}
                </span>
              </FilterChip>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {filtered.map((photo) => (
          <DetectionImage
            key={photo.id}
            photo={photo}
            // Only the uploader sees a delete control; the backend re-checks
            // ownership regardless.
            canDelete={!!currentUserId && photo.userId === currentUserId}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 text-link"
          : "border-sand-200 bg-surface text-ink-soft hover:bg-sand-100"
      }`}
    >
      {children}
    </button>
  );
}

function ReviewsSection({ venueId, reviews, onAdd, onDelete }) {
  const { user } = useAuth();

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-display text-2xl font-extrabold text-ink">
        Community reviews{" "}
        {reviews.length > 0 && (
          <span className="font-mono tabular-nums text-ink-soft">
            ({reviews.length})
          </span>
        )}
      </h2>

      {user ? (
        <ReviewForm venueId={venueId} onAdd={onAdd} />
      ) : (
        <p className="mb-4 rounded-xl border border-sand-200 bg-sand-100 px-4 py-3 text-base text-ink-soft">
          <Link to="/login" className="font-medium text-link hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      <ReviewList reviews={reviews} currentUserId={user?.id} onDelete={onDelete} />
    </section>
  );
}

const ACCESS_VOTES = [
  { value: "yes", label: "Yes", emoji: "✓" },
  { value: "partial", label: "Partially", emoji: "~" },
  { value: "no", label: "No", emoji: "✕" },
];

function ReviewForm({ venueId, onAdd }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [accessVote, setAccessVote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const review = await createReview({
        venueId,
        rating,
        comment,
        accessibilityVote: accessVote,
      });
      onAdd(review);
      setRating(0);
      setComment("");
      setAccessVote("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-2xl border border-sand-200 bg-surface p-5 shadow-sm"
    >
      <div>
        <span className="mb-1.5 block text-base font-medium text-ink">
          Was this venue accessible for you?
        </span>
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-label="Accessibility verdict"
        >
          {ACCESS_VOTES.map((v) => {
            const selected = accessVote === v.value;
            return (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  setAccessVote((cur) => (cur === v.value ? "" : v.value))
                }
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-brand-500 bg-brand-50 text-link"
                    : "border-sand-200 bg-surface text-ink-soft hover:bg-sand-100"
                }`}
              >
                <span aria-hidden="true" className="mr-1">
                  {v.emoji}
                </span>
                {v.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          This drives the venue's community accessibility verdict — separate from
          your star rating below.
        </p>
      </div>

      <div>
        <span className="mb-1.5 block text-base font-medium text-ink">
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
              className="rounded text-2xl leading-none text-star focus:outline-none focus:ring-2 focus:ring-star"
            >
              {(hovered || rating) >= star ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="mb-1.5 block text-base font-medium text-ink"
        >
          Your review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share how accessible this place was for you…"
          className="w-full rounded-xl border border-sand-200 px-3 py-2 text-base text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && (
        <p role="alert" className="text-base text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Posting…" : "Post review"}
      </Button>
    </form>
  );
}

function FeatureBreakdown({ features }) {
  const byKey = Object.fromEntries(features.map((f) => [f.type, f]));

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-display text-2xl font-extrabold text-ink">
        Accessibility features
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACCESSIBILITY_FEATURES.map((meta) => {
          const feature = byKey[meta.key];
          const present = !!feature;
          const verified = (feature?.verifiedCount ?? 0) >= 3;
          // Present positive features read green, barriers red, and anything
          // not reported stays neutral and dimmed — color is never the only
          // signal (the status text on the right says the same thing).
          const boxClass = !present
            ? "border-sand-200 bg-sand-50 opacity-70"
            : meta.barrier
              ? "border-danger-ring bg-danger-soft"
              : "border-success-ring bg-success-soft";
          return (
            <div
              key={meta.key}
              className={`flex items-center justify-between rounded-xl border p-4 ${boxClass}`}
            >
              <div>
                <p className="text-base font-semibold text-ink">{meta.label}</p>
                {feature?.mlDetected && (
                  <p className="text-sm text-ink-soft">
                    AI-detected ·{" "}
                    <span className="font-mono tabular-nums">
                      {Math.round((feature.confidence ?? 0) * 100)}%
                    </span>{" "}
                    confidence
                  </p>
                )}
              </div>
              <div className="text-right">
                {present ? (
                  verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-sm font-semibold text-success ring-1 ring-inset ring-success-ring">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-sm text-ink-soft">
                      <span className="font-mono tabular-nums">
                        {feature.verifiedCount ?? 0}
                      </span>{" "}
                      verifications
                    </span>
                  )
                ) : (
                  <span className="text-sm text-ink-faint">Not reported</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReviewList({ reviews = [], currentUserId, onDelete }) {
  if (reviews.length === 0) {
    return <p className="text-base text-ink-soft">No reviews yet.</p>;
  }
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          // Only the author sees a delete control; the backend re-checks
          // ownership regardless, so this is purely to hide the affordance.
          canDelete={!!currentUserId && review.userId === currentUserId}
          // Marking a review helpful is a write, so it needs a signed-in user;
          // signed-out visitors just see the count.
          canMarkHelpful={!!currentUserId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ReviewItem({ review, canDelete, canMarkHelpful, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount ?? 0);
  const [marked, setMarked] = useState(() => hasMarkedHelpful(review.id));
  const [savingHelpful, setSavingHelpful] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this review? This can't be undone.")) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteReview(review.id);
      onDelete?.(review.id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  async function handleHelpful() {
    if (savingHelpful) return;
    const nextMarked = !marked;
    setError(null);
    setSavingHelpful(true);
    // Optimistically update so the button feels instant; revert on failure.
    setMarked(nextMarked);
    setHelpfulCount((c) => Math.max(0, c + (nextMarked ? 1 : -1)));
    try {
      const updated = nextMarked
        ? await markReviewHelpful(review.id)
        : await unmarkReviewHelpful(review.id);
      // Trust the server's count and remember this browser's choice.
      setHelpfulCount(updated.helpfulCount ?? 0);
      setMarkedHelpful(review.id, nextMarked);
    } catch (err) {
      setMarked(!nextMarked);
      setHelpfulCount((c) => Math.max(0, c + (nextMarked ? -1 : 1)));
      setError(err.message);
    } finally {
      setSavingHelpful(false);
    }
  }

  return (
    <article className="rounded-2xl border border-sand-200 bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink">{review.userName}</span>
        <span
          className="text-star"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {"★".repeat(review.rating)}
          <span className="text-sand-200">{"★".repeat(5 - review.rating)}</span>
        </span>
      </div>
      <p className="mt-2 text-base leading-relaxed text-ink-soft">
        {cleanText(review.comment)}
      </p>
      <div className="mt-3 flex items-center gap-3 text-sm text-ink-faint">
        {review.createdAt && (
          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
        )}
        {canMarkHelpful ? (
          <button
            type="button"
            onClick={handleHelpful}
            disabled={savingHelpful}
            aria-pressed={marked}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-colors disabled:opacity-50 ${
              marked
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-sand-200 text-ink-soft hover:bg-sand-100"
            }`}
          >
            Helpful ·{" "}
            <span className="font-mono tabular-nums">{helpfulCount}</span>
          </button>
        ) : (
          <span>
            <span className="font-mono tabular-nums">{helpfulCount}</span> found
            helpful
          </span>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto font-medium text-danger hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </article>
  );
}
