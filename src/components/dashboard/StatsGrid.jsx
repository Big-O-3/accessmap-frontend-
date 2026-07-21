// Dashboard stat tiles. Only shows metrics we can honestly compute from this
// browser's activity (no auth/server yet). Each tile pairs a number with a text
// label — no icon/color-only meaning (accessibility requirement).
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
        className="text-xs font-semibold uppercase tracking-wide text-gray-500"
      >
        Your activity
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:gap-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-gray-200 bg-white p-4 text-center"
          >
            <p className="text-2xl font-bold text-indigo-600 sm:text-3xl">
              {t.value}
            </p>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">{t.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Tracked on this device. Sign-in (coming soon) will sync your stats and
        unlock community metrics like people helped.
      </p>
    </section>
  );
}
