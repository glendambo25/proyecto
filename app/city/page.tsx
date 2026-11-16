"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Bus, Building2, GraduationCap, Search, ShieldAlert, Star, TreePine, UtensilsCrossed } from "lucide-react";
import { getDestination } from "@/lib/content";
import { useApp } from "@/lib/store";
import { Header, Tabs } from "@/components/ui";
import type { Place } from "@/lib/types";

const CityMap = dynamic(() => import("@/components/CityMap"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-[22px] bg-paper-2" />,
});

type F = "All" | "Housing" | "Transport" | "Leisure" | "Food";
const ICON: Record<Place["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  University: GraduationCap,
  Housing: Building2,
  Transport: Bus,
  Leisure: TreePine,
  Food: UtensilsCrossed,
};

export default function City() {
  const { profile, log } = useApp();
  const [f, setF] = useState<F>("All");
  const [q, setQ] = useState("");
  const [reported, setReported] = useState(false);
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const places = dest.places.filter((p) => (f === "All" || p.type === f || p.type === "University") && (p.name + p.note).toLowerCase().includes(q.toLowerCase()));
  const recommended = dest.places.filter((p) => p.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <main>
      <Header
        eyebrow={`${dest.country} · ${profile.neighbourhood !== "—" ? profile.neighbourhood : "City guide"}`}
        title={
          <>
            Explore <em>{dest.city}</em>
          </>
        }
      />
      <div className="space-y-6 px-5 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:space-y-0">
        <div className="space-y-6 lg:sticky lg:top-6">
        <label className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-3 focus-within:border-ink">
          <Search size={16} className="text-ink-3" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search places" aria-label="Search places" className="flex-1 bg-transparent text-[14px] outline-none" />
        </label>
        <Tabs<F> options={["All", "Housing", "Transport", "Leisure", "Food"]} value={f} onChange={setF} />

        <div className="overflow-hidden rounded-[22px] border border-line">
          <CityMap center={dest.center} places={places} className="h-64 w-full lg:h-[560px]" />
        </div>
        </div>

        <div className="space-y-6">

        {(f === "All" || f === "Housing") && (
          <section className="rounded-[26px] bg-stamp p-5 text-white" aria-label="Housing scam alert">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} />
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em]">Housing scam alert</p>
            </div>
            <p className="mt-3 font-serif text-[26px] leading-[1.05]">Never pay before you’ve seen it and signed.</p>
            <ul className="mt-4 space-y-2 text-[13px] text-white/90">
              {dest.housingAlert.slice(1).map((a) => (
                <li key={a} className="flex gap-2">
                  <span>—</span>
                  {a}
                </li>
              ))}
            </ul>
            <button
              className="mt-4 rounded-full bg-white/15 px-4 py-2 text-[12.5px] font-semibold transition hover:bg-white/25"
              onClick={() => {
                setReported(true);
                log("scam_report_click", { city: dest.id });
              }}
            >
              {reported ? "Thanks — the community will review it (demo)" : "Report a suspicious offer"}
            </button>
          </section>
        )}

        <section>
          <p className="eyebrow mb-2">Key places · approx. travel time</p>
          <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card">
            {places.map((p) => {
              const I = ICON[p.type];
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper">
                    <I size={17} className="text-ink" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold">{p.name}</span>
                    <span className="block truncate text-[12.5px] text-ink-3">{p.note}</span>
                  </span>
                  {p.transit && <span className="max-w-[110px] text-right font-mono text-[10.5px] leading-tight text-accent">{p.transit}</span>}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-[26px]">Recommended for you</h2>
          </div>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {recommended.map((p, i) => {
              const I = ICON[p.type];
              return (
                <article key={p.id} className={`w-44 shrink-0 rounded-[22px] p-4 ${i % 2 ? "bg-accent text-white" : "bg-ink text-paper"}`}>
                  <I size={20} />
                  <p className="mt-10 font-serif text-[22px] leading-[1.05]">{p.name}</p>
                  <p className="mt-2 flex items-center gap-1 font-mono text-[11px] opacity-75">
                    <Star size={11} fill="currentColor" /> {p.rating?.toFixed(1)} · community
                  </p>
                </article>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-[10.5px] text-ink-3">Ratings are sample community data for the demo.</p>
        </section>
        </div>
      </div>
    </main>
  );
}
