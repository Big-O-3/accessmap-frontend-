import { Link } from "react-router-dom";
import ScoreBadge from "./ScoreBadge";
import SaveButton from "./SaveButton";
import Pill from "./Pill";
import { featureLabel } from "../lib/features";

export default function VenueCard({ venue, active, onHover, fill = false }) {
  // Analyzed spots (dropped from the Analyze page) aren't saved venues, so they
  // have no detail page - render a plain div instead of a navigating Link.
  const Wrapper = venue.analyzed ? "div" : Link;
  const wrapperProps = venue.analyzed ? {} : { to: `/venue/${venue.id}` };

  // `fill` stretches the card to its container's height and pins the meta row
  // to the bottom - only wanted in a multi-column grid of equal-height cards
  // (the home-page featured row). Off by default so single-column lists (search
  // results, the mobile home stack) size to content and don't blow up when they
  // sit beside a tall grid sibling like the map.
  return (
    <Wrapper
      {...wrapperProps}
      onMouseEnter={() => onHover?.(venue.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`flex flex-col rounded-2xl border bg-surface p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        fill ? "h-full" : ""
      } ${
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
          <p className="text-base text-ink-soft">
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
          <Pill key={key} dot title={featureLabel(key)}>
            {featureLabel(key)}
          </Pill>
        ))}
      </div>

      <div className="mt-auto pt-3 flex items-center gap-3 text-sm text-ink-faint">
        {venue.distance != null && (
          <span className="font-medium text-link">
            <span className="font-mono tabular-nums">
              {venue.distance.toFixed(1)}
            </span>{" "}
            mi
          </span>
        )}
        <span>
          <span className="font-mono tabular-nums">{venue.totalReviews}</span>{" "}
          reviews
        </span>
        <span>
          <span className="font-mono tabular-nums">{venue.totalPhotos}</span>{" "}
          photos
        </span>
      </div>
    </Wrapper>
  );
}
