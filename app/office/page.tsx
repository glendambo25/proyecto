"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buildChecklist, destinations, getDestination } from "@/lib/content";
import { useApp } from "@/lib/store";
import type { Task } from "@/lib/types";

/** Deterministic pseudo-random generator so the simulated cohort is the same on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

interface Student {
  id: number;
  dest: string;
  done: number;
  total: number;
  stuck?: Task;
  hours: number;
}

function simulatedCohort(): Student[] {
  const r = rng(42);
  const ids = ["turin", "turin", "milan", "munich", "munich", "luxembourg", "new-york"];
  return Array.from({ length: 36 }, (_, i) => {
    const dest = ids[Math.floor(r() * ids.length)];
    const purpose = dest === "luxembourg" || dest === "new-york" ? "internship" : "study";
    const list = buildChecklist(dest, r() < 0.15 ? "non-eu" : "eu", purpose).filter((t) => t.phase !== "return");
    const done = Math.floor(r() * (list.length + 1));
    const stuck = done < list.length && r() < 0.5 ? list[done] : undefined;
    const hours = list.slice(0, done).reduce((a, t) => a + (t.hoursSavedEstimate ?? 0), 0);
    return { id: i + 1, dest, done, total: list.length, stuck, hours };
  });
}

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-navy">{value}</p>
      {note && <p className="text-[11px] text-gray-400">{note}</p>}
    </div>
  );
}

export default function Office() {
  const { events, satisfaction } = useApp();
  const cohort = useMemo(simulatedCohort, []);
  const avg = Math.round((cohort.reduce((a, s) => a + s.done / s.total, 0) / cohort.length) * 100);
  const hours = cohort.reduce((a, s) => a + s.hours, 0);
  const stuckCount: Record<string, { title: string; city: string; n: number }> = {};
  for (const s of cohort)
    if (s.stuck) {
      const k = `${s.dest}:${s.stuck.id}`;
      stuckCount[k] = stuckCount[k] ?? { title: s.stuck.title, city: getDestination(s.dest).city, n: 0 };
      stuckCount[k].n++;
    }
  const stuck = Object.values(stuckCount).sort((a, b) => b.n - a.n).slice(0, 5);
  const count = (t: string) => events.filter((e) => e.type === t).length;

  return (
    <main className="space-y-6 p-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand">International office · B2B view</p>
          <h1 className="text-2xl font-extrabold text-navy">Outgoing students dashboard</h1>
        </div>
        <Link href="/home" className="btn-ghost">
          ← Back to student app
        </Link>
      </header>

      <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
        <b>Simulated cohort (demo data)</b> to show what the office would see during the pilot. “Hours saved” uses per-step estimates that are hypotheses to validate, not measured results.
      </p>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Outgoing students" value={String(cohort.length)} note="simulated" />
        <Kpi label="Average progress" value={`${avg}%`} note="simulated" />
        <Kpi label="Est. hours saved" value={`${hours} h`} note="hypothesis per step" />
        <Kpi label="Destinations" value={String(new Set(cohort.map((s) => s.dest)).size)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-bold text-navy">Stuck procedures</h2>
          <ul className="space-y-2 text-sm">
            {stuck.map((s) => (
              <li key={s.city + s.title} className="flex items-center justify-between">
                <span>
                  {s.title} <span className="text-gray-400">· {s.city}</span>
                </span>
                <span className="chip bg-red-50 text-red-700">{s.n} students</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="mb-3 font-bold text-navy">Students by destination</h2>
          <ul className="space-y-2 text-sm">
            {destinations.map((d) => {
              const n = cohort.filter((s) => s.dest === d.id).length;
              return (
                <li key={d.id}>
                  <div className="flex justify-between">
                    <span>
                      {d.flag} {d.city}
                    </span>
                    <span className="font-semibold">{n}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-brand-soft">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${(n / cohort.length) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-1 font-bold text-navy">Pilot metrics — live from this device</h2>
        <p className="mb-3 text-xs text-gray-500">Real events recorded in this browser while you use the demo (stored locally, no personal data sent).</p>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <Kpi label="Assistant questions" value={String(count("assistant_question"))} />
          <Kpi label="Premium interest" value={String(count("premium_interest"))} note="free → premium conversion signal" />
          <Kpi label="Done-for-you requests" value={String(count("done_for_you_request") + count("done_for_you_interest"))} note="contacts to partners" />
          <Kpi label="Voice calls" value={String(count("voice_call_start"))} />
          <Kpi label="Steps completed" value={String(events.filter((e) => e.type === "task_status" && e.data?.status === "completed").length)} />
          <Kpi label="Satisfaction" value={satisfaction ? `${satisfaction}/5` : "—"} />
        </div>
      </section>
    </main>
  );
}
