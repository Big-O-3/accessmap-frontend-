import { scoreTier } from "../lib/score";

const TIER_STYLES = {
  high: "bg-brand-100 text-link ring-brand-600/20",
  medium: "bg-accent-400/20 text-accent-600 ring-accent-500/25",
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
        className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset bg-sand-100 text-ink-soft ring-sand-200 ${sizes[size]}`}
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
