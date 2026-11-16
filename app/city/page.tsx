"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { getDestination } from "@/lib/content";
import { useApp } from "@/lib/store";
import { FilterChips, Header } from "@/components/ui";
import type { Place } from "@/lib/types";

const CityMap = dynamic(() => import("@/components/CityMap"), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-2xl bg-white" />,
});

type F = "All" | "Housing" | "Transport" | "Leisure" | "Food";
const ICON: Record<Place["type"], string> = { University: "🎓", Housing: "🏠", Transport: "🚋", Leisure: "🌳", Food: "🍝" };

export default function City() {
  const { profile, log } = useApp();
  const [f, setF] = useState<F>("All");
  const [q, setQ] = useState("");
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const places = dest.places.filter((p) => (f === "All" || p.type === f || p.type === "University") && (p.name + p.note).toLowerCase().includes(q.toLowerCase()));
  const recommended = dest.places.filter((p) => p.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <main>
      <Header title={`Explore ${dest.city}`} subtitle={`${dest.flag} Useful places near ${profile.neighbourhood !== "—" ? profile.neighbourhood : "you"}`} />
      <div className="space-y-4 px-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search places"
          aria-label="Search places"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
        />
        <FilterChips<F> options={["All", "Housing", "Transport", "Leisure", "Food"]} value={f} onChange={setF} />

        {(f === "All" || f === "Housing") && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" aria-label="Housing scam alert">
            <h2 className="mb-1 font-bold">⚠ Housing scam alert</h2>
            <ul className="list-disc space-y-1 pl-4">
              {dest.housingAlert.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <button className="mt-2 text-xs font-semibold underline" onClick={() => log("scam_report_click", { city: dest.id })}>
              Report a suspicious offer to the community
            </button>
          </section>
        )}

        <CityMap center={dest.center} places={places} />

        <ul className="space-y-2">
          {places.map((p) => (
            <li key={p.id} className="card flex items-center gap-3 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-lg" aria-hidden>
                {ICON[p.type]}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-navy">{p.name}</span>
                <span className="block text-xs text-gray-500">{p.note}</span>
                {p.transit && <span className="block text-xs font-semibold text-prog">🚋 {p.transit}</span>}
              </span>
            </li>
          ))}
        </ul>

        <section>
          <h2 className="mb-2 font-bold text-navy">Recommended for you</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recommended.map((p) => (
              <div key={p.id} className="card w-40 shrink-0 p-3">
                <div className="mb-2 grid h-16 place-items-center rounded-xl bg-gradient-to-br from-brand-soft to-white text-3xl" aria-hidden>
                  {ICON[p.type]}
                </div>
                <p className="text-sm font-bold text-navy">{p.name}</p>
                <p className="text-xs text-amber-600">★ {p.rating?.toFixed(1)} · community</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">Ratings are sample community data for the demo. Travel times are approximate.</p>
        </section>
      </div>
    </main>
  );
}
