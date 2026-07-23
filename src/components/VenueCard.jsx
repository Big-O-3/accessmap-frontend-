import { Link } from "react-router-dom";
import ScoreBadge from "./ScoreBadge";
import SaveButton from "./SaveButton";
import { featureLabel } from "../lib/features";

export default function VenueCard({ venue, active, onHover }) {
  // Analyzed spots (dropped from the Analyze page) aren't saved venues, so they
  // have no detail page — render a plain div instead of a navigating Link.
  const Wrapper = venue.analyzed ? "div" : Link;
  const wrapperProps = venue.analyzed ? {} : { to: `/venue/${venue.id}` };

  return (
    <Wrapper
      {...wrapperProps}
      onMouseEnter={() => onHover?.(venue.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`block rounded-2xl border bg-surface p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        active
          ? "border-brand-500 shadow-lg ring-1 ring-brand-500/30"
          : "border-sand-200 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink leading-snug">
            {venue.name}
          </h3>
          <p className="text-sm text-ink-soft">
            {venue.city ? `${venue.address}, ${venue.city}` : venue.address}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <ScoreBadge score={venue.accessibilityScore} size="sm" />
          <SaveButton venue={venue} size="sm" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {venue.featureKeys.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-link"
            title={featureLabel(key)}
          >
            {featureLabel(key)}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-ink-faint">
        {venue.distance != null && (
          <span className="font-medium text-link">
            {venue.distance.toFixed(1)} mi
          </span>
        )}
        <span>{venue.totalReviews} reviews</span>
        <span>{venue.totalPhotos} photos</span>
      </div>
    </Wrapper>
  );
}
