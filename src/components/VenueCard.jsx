import { Link } from "react-router-dom";
import ScoreBadge from "./ScoreBadge";
import { featureIcon, featureLabel } from "../lib/features";

export default function VenueCard({ venue, active, onHover }) {
  return (
    <Link
      to={`/venue/${venue.id}`}
      onMouseEnter={() => onHover?.(venue.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`block rounded-lg border bg-white p-4 transition-shadow hover:shadow-md ${
        active ? "border-indigo-500 shadow-md" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{venue.name}</h3>
          <p className="text-sm text-gray-500">
            {venue.address}, {venue.city}
          </p>
        </div>
        <ScoreBadge score={venue.accessibilityScore} size="sm" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {venue.featureKeys.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
            title={featureLabel(key)}
          >
            <span aria-hidden>{featureIcon(key)}</span>
            {featureLabel(key)}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        {venue.distance != null && <span>{venue.distance.toFixed(1)} mi</span>}
        <span>{venue.totalReviews} reviews</span>
        <span>{venue.totalPhotos} photos</span>
      </div>
    </Link>
  );
}
