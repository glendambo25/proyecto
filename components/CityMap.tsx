"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { Place } from "@/lib/types";

const COLORS: Record<Place["type"], string> = {
  University: "#0b0f5c",
  Housing: "#dc2626",
  Transport: "#2563eb",
  Leisure: "#16a34a",
  Food: "#f59e0b",
};

export default function CityMap({ center, places }: { center: [number, number]; places: Place[] }) {
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-56 w-full rounded-2xl" attributionControl>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {places.map((p) => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={9} pathOptions={{ color: "#fff", weight: 2, fillColor: COLORS[p.type], fillOpacity: 1 }}>
          <Popup>
            <b>{p.name}</b>
            <br />
            {p.note}
            {p.transit && (
              <>
                <br />🚋 {p.transit}
              </>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
