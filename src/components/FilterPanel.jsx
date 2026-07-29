import { FILTERABLE_FEATURES } from "../lib/features";
import { VENUE_TYPES } from "../lib/venueTypes";

export default function FilterPanel({
  city,
  onCityChange,
  selectedFeatures = [],
  onToggleFeature,
  selectedTypes = [],
  onToggleType,
  onUseMyLocation,
  hasLocation,
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-base font-medium text-ink mb-1.5">
          City
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="e.g. San Francisco"
          className="w-full rounded-xl border border-sand-200 bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onUseMyLocation}
        className={`w-full rounded-xl border px-3 py-2 text-base font-semibold transition-colors ${
          hasLocation
            ? "border-brand-500 bg-brand-50 text-link"
            : "border-sand-200 bg-surface text-ink-soft hover:bg-sand-100"
        }`}
      >
        {hasLocation ? "✓ Using your location" : "Near me"}
      </button>

      <fieldset>
        <legend className="text-base font-medium text-ink mb-2.5">
          Accessibility features
        </legend>
        <div className="space-y-1">
          {FILTERABLE_FEATURES.map((feature) => {
            const checked = selectedFeatures.includes(feature.key);
            return (
              <label
                key={feature.key}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-base cursor-pointer select-none transition-colors ${
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

      <fieldset>
        <legend className="text-base font-medium text-ink mb-2.5">
          Category
        </legend>
        <div className="space-y-1">
          {VENUE_TYPES.map((type) => {
            const checked = selectedTypes.includes(type.key);
            return (
              <label
                key={type.key}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-base cursor-pointer select-none transition-colors ${
                  checked ? "bg-brand-50 text-link" : "hover:bg-sand-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleType(type.key)}
                  className="rounded border-sand-200 text-brand-600 focus:ring-brand-500"
                />
                <span>{type.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
