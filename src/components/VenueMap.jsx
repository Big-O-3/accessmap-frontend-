import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { scoreTier } from "../lib/score";
import { TIER_COLOR_VAR } from "../lib/tierStyles";
import ScoreBadge from "./ScoreBadge";

const DEFAULT_CENTER = [47.6062, -122.3321]; // Seattle

// Read the pin colors straight from the theme's tier tokens (the same
// --color-success/warning/danger the badges and pills use) so the map never
// drifts from the rest of the UI and adapts to light/dark automatically.
// Leaflet needs a concrete color string, so we resolve the CSS variables with
// getComputedStyle rather than a class.
function readTierColors() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name) => styles.getPropertyValue(name).trim();
  return {
    high: read(TIER_COLOR_VAR.high),
    medium: read(TIER_COLOR_VAR.medium),
    low: read(TIER_COLOR_VAR.low),
    // No score yet (no photo uploaded) — a muted neutral, not a tier color.
    unscored: read("--color-ink-faint"),
  };
}

// Keep the resolved colors in sync with the theme: the toggle flips the `.dark`
// class on <html>, which re-points the tokens, so we re-read on that change.
function useTierColors() {
  const [colors, setColors] = useState(readTierColors);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readTierColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}

// Recenters the map imperatively when the `center` prop changes (e.g. after
// "near me" or when the first search result comes in).
function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function VenueMap({ venues, center, activeId, onSelect }) {
  const tierColors = useTierColors();

  // Only venues with coordinates can be placed on the map. Venues added without
  // a location are still listed elsewhere; they just don't get a pin here.
  const mappable = venues.filter(
    (v) => v.latitude != null && v.longitude != null,
  );

  const mapCenter = center
    ? [center.lat, center.lng]
    : mappable[0]
      ? [mappable[0].latitude, mappable[0].longitude]
      : DEFAULT_CENTER;

  return (
    <MapContainer
      center={mapCenter}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center ? [center.lat, center.lng] : null} />

      {mappable.map((venue) => {
        const active = venue.id === activeId;
        const color =
          venue.accessibilityScore == null
            ? tierColors.unscored
            : tierColors[scoreTier(venue.accessibilityScore)];
        return (
          <CircleMarker
            key={venue.id}
            center={[venue.latitude, venue.longitude]}
            radius={active ? 12 : 8}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => onSelect?.(venue.id),
              mouseover: () => onSelect?.(venue.id),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{venue.name}</span>
                  <ScoreBadge score={venue.accessibilityScore} size="sm" />
                </div>
                <p className="text-xs text-ink-soft">
                  {venue.city ? `${venue.address}, ${venue.city}` : venue.address}
                </p>
                {venue.analyzed ? (
                  <p className="text-xs text-link">
                    Analyzed photo — not a saved venue yet
                  </p>
                ) : (
                  <Link
                    to={`/venue/${venue.id}`}
                    className="text-link hover:underline text-xs font-medium"
                  >
                    View details →
                  </Link>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
