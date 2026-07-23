// Dashboard stat tiles. Shows metrics computed from this browser's local
// activity — server-side sync isn't wired up yet, so switching devices resets
// them. Each tile pairs a number with a text label (no icon/color-only meaning,
// per the accessibility requirement).
export default function StatsGrid({ stats }) {
  const tiles = [
    { label: "Venues Saved", value: stats.savedCount },
    { label: "Contributions", value: stats.contributionCount },
    { label: "Activity Events", value: stats.activityCount },
  ];

  return (
    <section aria-labelledby="stats-heading">
      <h2
        id="stats-heading"
        className="text-xs font-semibold uppercase tracking-wide text-ink-faint"
      >
        Your activity
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:gap-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-sand-200 bg-surface p-5 text-center shadow-sm"
          >
            <p className="font-display text-3xl font-semibold text-link sm:text-4xl">
              {t.value}
            </p>
            <p className="mt-1 text-xs text-ink-soft sm:text-sm">{t.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Tracked on this device. Server-side sync isn&apos;t wired up yet, so
        stats reset when you switch browsers or clear site data.
      </p>
    </section>
  );
}
