import { useEffect } from "react";
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
import ScoreBadge from "./ScoreBadge";

const DEFAULT_CENTER = [47.6062, -122.3321]; // Seattle

const TIER_COLOR = {
  high: "#16a34a",
  medium: "#d97706",
  low: "#dc2626",
};

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
  const mapCenter = center
    ? [center.lat, center.lng]
    : venues[0]
      ? [venues[0].latitude, venues[0].longitude]
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

      {venues.map((venue) => {
        const active = venue.id === activeId;
        const color = TIER_COLOR[scoreTier(venue.accessibilityScore)];
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
                <p className="text-xs text-gray-500">
                  {venue.address}, {venue.city}
                </p>
                <Link
                  to={`/venue/${venue.id}`}
                  className="text-indigo-600 hover:underline text-xs"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
