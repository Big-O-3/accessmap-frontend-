import { scoreTier } from "../lib/score";

const TIER_STYLES = {
  high: "bg-green-100 text-green-800 ring-green-600/20",
  medium: "bg-amber-100 text-amber-800 ring-amber-600/20",
  low: "bg-red-100 text-red-800 ring-red-600/20",
};

export default function ScoreBadge({ score, size = "md" }) {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-lg px-4 py-2 font-bold",
  };

  // No score until a photo has been uploaded and analyzed. Show a neutral
  // "Not yet scored" chip instead of a misleading number.
  if (score == null) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset bg-gray-100 text-gray-600 ring-gray-500/20 ${sizes[size]}`}
        title="No accessibility score yet — upload a photo to generate one"
      >
        Not yet scored
      </span>
    );
  }

  const tier = scoreTier(score);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset ${TIER_STYLES[tier]} ${sizes[size]}`}
      title={`Accessibility score: ${score} / 100`}
    >
      {score}
      <span className="opacity-70">/100</span>
    </span>
  );
}
