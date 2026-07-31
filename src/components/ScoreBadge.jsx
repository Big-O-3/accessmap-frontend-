import { scoreVerdict } from "../lib/score";
import { tierPlate } from "../lib/tierStyles";

// Users see a plain verdict - "Accessible" / "Partially accessible" / "Not
// accessible" - rather than a bare number, which is hard to read at a glance.
// The underlying 0-100 score still drives everything (tier/color here, sort and
// map-pin color elsewhere, storage in the backend); we keep it in the tooltip
// for anyone who wants the detail, and show it in the large (detail-page)
// variant as a monospace figure next to the verdict.
//
// The tinted "plate" colors come from the shared tier tokens (tierPlate), so
// this badge, the feature chips, and the map pins all speak the same palette.
export default function ScoreBadge({ score, size = "md" }) {
  const sizes = {
    sm: "text-sm px-2.5 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-lg px-4 py-2",
  };

  const verdict = scoreVerdict(score);

  // No score until a photo has been uploaded and analyzed. Show a neutral
  // "Not yet rated" chip instead of a misleading verdict.
  if (!verdict) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset bg-sand-100 text-ink-soft ring-sand-200 ${sizes[size]}`}
        title="No accessibility rating yet - upload a photo to generate one"
      >
        Not yet rated
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${tierPlate(verdict.tier)} ${sizes[size]}`}
      title={`Accessibility score: ${score} / 100`}
    >
      {size === "lg" && (
        <span className="font-mono font-bold tabular-nums">{score}</span>
      )}
      {verdict.label}
    </span>
  );
}
