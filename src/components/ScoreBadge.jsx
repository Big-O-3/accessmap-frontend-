import { scoreVerdict } from "../lib/score";

const TIER_STYLES = {
  high: "bg-green-100 text-green-800 ring-green-600/20",
  medium: "bg-amber-100 text-amber-800 ring-amber-600/25",
  low: "bg-red-100 text-red-800 ring-red-600/20",
};

// Users see a plain verdict — "Accessible" / "Partially accessible" / "Not
// accessible" — rather than a bare number, which is hard to read at a glance.
// The underlying 0-100 score still drives everything (tier/color here, sort and
// map-pin color elsewhere, storage in the backend); we keep it in the tooltip
// for anyone who wants the detail.
export default function ScoreBadge({ score, size = "md" }) {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-sm px-4 py-2 font-bold",
  };

  const verdict = scoreVerdict(score);

  // No score until a photo has been uploaded and analyzed. Show a neutral
  // "Not yet scored" chip instead of a misleading verdict.
  if (!verdict) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset bg-sand-100 text-ink-soft ring-sand-200 ${sizes[size]}`}
        title="No accessibility rating yet — upload a photo to generate one"
      >
        Not yet rated
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${TIER_STYLES[verdict.tier]} ${sizes[size]}`}
      title={`Accessibility score: ${score} / 100`}
    >
      {verdict.label}
    </span>
  );
}
