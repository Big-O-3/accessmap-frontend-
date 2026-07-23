import { FILTERABLE_FEATURES } from "../lib/features";

export default function FilterPanel({
  city,
  onCityChange,
  selectedFeatures,
  onToggleFeature,
  onUseMyLocation,
  hasLocation,
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          City
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="e.g. San Francisco"
          className="w-full rounded-xl border border-sand-200 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onUseMyLocation}
        className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
          hasLocation
            ? "border-brand-500 bg-brand-50 text-link"
            : "border-sand-200 bg-surface text-ink-soft hover:bg-sand-100"
        }`}
      >
        {hasLocation ? "✓ Using your location" : "Near me"}
      </button>

      <fieldset>
        <legend className="text-sm font-medium text-ink mb-2.5">
          Accessibility features
        </legend>
        <div className="space-y-1">
          {FILTERABLE_FEATURES.map((feature) => {
            const checked = selectedFeatures.includes(feature.key);
            return (
              <label
                key={feature.key}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm cursor-pointer select-none transition-colors ${
                  checked ? "bg-brand-50 text-link" : "hover:bg-sand-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleFeature(feature.key)}
                  className="rounded border-sand-200 text-brand-600 focus:ring-brand-500"
                />
                <span>{feature.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
