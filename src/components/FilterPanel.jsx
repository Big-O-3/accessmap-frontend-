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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="e.g. Seattle"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onUseMyLocation}
        className={`w-full rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
          hasLocation
            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
            : "border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        {hasLocation ? "Using your location" : "Near me"}
      </button>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">
          Accessibility features
        </legend>
        <div className="space-y-2">
          {FILTERABLE_FEATURES.map((feature) => (
            <label
              key={feature.key}
              className="flex items-center gap-2 text-sm cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selectedFeatures.includes(feature.key)}
                onChange={() => onToggleFeature(feature.key)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{feature.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
