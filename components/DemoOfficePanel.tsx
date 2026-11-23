"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isDemoMode, risksOf, simulatedCohort, type CohortStudent, type Risk } from "@/lib/demo";
import { useApp } from "@/lib/store";

/** SIMULATED: nothing is sent. */
function NudgeButton() {
  const [sent, setSent] = useState(false);
  return (
    <button className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold hover:border-ink disabled:text-ok" disabled={sent} onClick={() => setSent(true)}>
      {sent ? "Nudged (demo)" : "Nudge"}
    </button>
  );
}

/**
 * DEMO MODE ONLY: the university's view of its incoming non-EU cohort in Madrid.
 * Students are SIMULATED (pseudonyms); the risk rules use the REAL deadline rules of content/madrid.json.
 * The first row is live: the demo student on this device, with the progress she has right now.
 */
export default function DemoOfficePanel() {
  const { profile, statuses } = useApp();
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isDemoMode()), []);
  const cohort = useMemo(simulatedCohort, []);

  if (!on) return null;
  const live: CohortStudent | null =
    profile && profile.destinationId === "madrid"
      ? { id: "live", name: profile.name, country: profile.nationalityLabel, arrivalDate: profile.arrivalDate, statuses: statuses as CohortStudent["statuses"], live: true }
      : null;
  const all = live ? [live, ...cohort] : cohort;
  // One row per student: their most urgent risk first, other reasons joined. Live student on top.
  const rank = (r: Risk) => (r.level === "high" ? 0 : 100) + (r.daysLeft ?? 50);
  const rows = all
    .map((s) => ({ s, rs: risksOf(s).sort((a, b) => rank(a) - rank(b)) }))
    .filter((x) => x.rs.length)
    .sort((a, b) => Number(!!b.s.live) - Number(!!a.s.live) || rank(a.rs[0]) - rank(b.rs[0]));
  const atRisk = rows.length;
  const arrived = all.filter((s) => s.arrivalDate <= new Date().toISOString().slice(0, 10)).length;
  const tieDone = all.filter((s) => s.statuses.tie === "completed").length;

  return (
    <section className="space-y-4" aria-label="Incoming cohort, Madrid">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-[30px] leading-none">
          {profile?.institution ?? "Universidad Pontificia Comillas"} · <em className="text-accent">incoming, Madrid</em>
        </h2>
        <span className="chip border-stamp/30 bg-stamp-soft font-mono text-[10.5px] text-stamp">Demo: simulated students, real deadline rules</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Non-EU students", String(all.length)],
          ["Already in Madrid", String(arrived)],
          ["TIE done", `${tieDone}/${arrived}`],
          ["At risk this week", String(atRisk)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="eyebrow">{k}</p>
            <p className={`mt-3 font-serif text-[40px] leading-none ${k.startsWith("At risk") ? "text-stamp" : ""}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
          <h3 className="font-serif text-[24px] leading-none">Students at risk</h3>
          <span className="font-mono text-[10.5px] text-ink-3">Sorted by urgency</span>
        </div>
        <ul className="divide-y divide-line">
          {rows.slice(0, 6).map(({ s: st, rs }) => {
            const r = rs[0];
            return (
            <li key={st.id} className={`flex items-center gap-3 px-4 py-3 ${r.student.live ? "bg-accent/5" : ""}`}>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.level === "high" ? "bg-stamp" : "bg-amber-500"}`} aria-label={r.level === "high" ? "High risk" : "Medium risk"} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold">
                  {r.student.name} <span className="font-normal text-ink-3">· {r.student.country}</span>
                  {r.student.live && <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-accent">● live from this device</span>}
                </span>
                <span className="block text-[12.5px] text-ink-2">{rs.map((x) => x.reason).join(" · ")}</span>
              </span>
              {r.student.live ? (
                <Link href={`/tasks/${r.taskId}`} className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper">
                  Open step
                </Link>
              ) : (
                <NudgeButton />
              )}
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
