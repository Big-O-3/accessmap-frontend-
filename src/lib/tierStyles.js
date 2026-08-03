// Single source of truth for coloring anything by accessibility tier.
//
// Before this, three different places each hardcoded their own green/amber/red
// (ScoreBadge, the feature breakdown, the map pins), so they drifted apart and
// none of them flipped in dark mode. Everything now reads the semantic tier
// tokens defined in src/index.css (success / warning / danger), so the colors
// stay consistent and adapt to the theme automatically.
//
// Tiers come from scoreTier() in src/lib/score.js: "high" | "medium" | "low".

const TIER_STYLES = {
  high: {
    text: "text-success",
    softBg: "bg-success-soft",
    ring: "ring-success-ring",
    border: "border-success-ring",
    dot: "bg-success",
  },
  medium: {
    text: "text-warning",
    softBg: "bg-warning-soft",
    ring: "ring-warning-ring",
    border: "border-warning-ring",
    dot: "bg-warning",
  },
  low: {
    text: "text-danger",
    softBg: "bg-danger-soft",
    ring: "ring-danger-ring",
    border: "border-danger-ring",
    dot: "bg-danger",
  },
};

// Used when there's no score yet ("Not yet rated").
const NEUTRAL_TIER = {
  text: "text-ink-soft",
  softBg: "bg-sand-100",
  ring: "ring-sand-200",
  border: "border-sand-200",
  dot: "bg-sand-200",
};

export function tierStyles(tier) {
  return TIER_STYLES[tier] ?? NEUTRAL_TIER;
}

// The "plate" look: a soft tinted fill, a matching inset ring, and tier-colored
// text. This is what ScoreBadge and the score plates on cards use.
export function tierPlate(tier) {
  const s = tierStyles(tier);
  return `${s.softBg} ${s.text} ring-1 ring-inset ${s.ring}`;
}

// The CSS custom-property name backing each tier's foreground color, for the
// rare case JS needs the raw value (e.g. Leaflet map pins) via
// getComputedStyle(document.documentElement).getPropertyValue(name).
export const TIER_COLOR_VAR = {
  high: "--color-success",
  medium: "--color-warning",
  low: "--color-danger",
};
