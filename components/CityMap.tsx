"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { Place } from "@/lib/types";

const COLORS: Record<Place["type"], string> = {
  University: "#0b0f5c",
  Housing: "#d4572a",
  Transport: "#5b5fe8",
  Leisure: "#1d7a55",
  Food: "#b7791f",
};

export default function CityMap({ center, places, className = "h-64 w-full" }: { center: [number, number]; places: Place[]; className?: string }) {
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={false} className={className} attributionControl zoomControl={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {places.map((p) => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={8} pathOptions={{ color: "#fffdf8", weight: 3, fillColor: COLORS[p.type], fillOpacity: 1 }}>
          <Popup>
            <b>{p.name}</b>
            <br />
            {p.note}
            {p.transit && (
              <>
                <br />
                {p.transit}
              </>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
