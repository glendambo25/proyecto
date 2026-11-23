"use client";

import { Plane } from "lucide-react";
import { cityCode, getDestination, originCode, progressOf, purposeLabel, shortDate } from "@/lib/content";
import { statusOf } from "@/lib/store";
import type { Task, TaskStatus, UserProfile } from "@/lib/types";
import { Segments } from "./ui";

export default function BoardingPass({ profile, checklist, statuses }: { profile: UserProfile; checklist: Task[]; statuses: Record<string, TaskStatus> }) {
  const dest = getDestination(profile.destinationId);
  const prog = progressOf(checklist, statuses);
  const inProg = checklist.filter((t) => t.phase !== "return" && statusOf(statuses, t.id) === "in_progress").length;
  const status = prog.pct >= 70 ? "Everything under control" : prog.pct >= 30 ? "On track" : "Getting started";

  return (
    <section className="rise overflow-hidden rounded-[26px] bg-ink text-paper shadow-[0_30px_60px_-30px_rgba(11,15,92,0.7)]" aria-label="Your arrival">
      <div className="relative p-5 pb-6">
        {/* faint route pattern */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="lines" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="14" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lines)" />
        </svg>
        <div className="relative flex items-center justify-between">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/60">Arrival pass</span>
          <span className="rounded-full border border-paper/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/80">{status}</span>
        </div>
        <div className="relative mt-5 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/50">From</p>
            <p className="font-serif text-[52px] leading-none">{originCode(profile.nationalityLabel)}</p>
            <p className="mt-1 text-xs text-paper/60">{profile.nationalityLabel === "Spanish" ? "Spain" : profile.nationalityLabel}</p>
          </div>
          <div className="mb-6 flex flex-1 items-center gap-2 px-3 text-paper/50">
            <span className="h-px flex-1 border-t border-dashed border-paper/40" />
            <Plane size={16} className="rotate-45 text-paper" />
            <span className="h-px flex-1 border-t border-dashed border-paper/40" />
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/50">To</p>
            <p className="font-serif text-[52px] leading-none">{cityCode[dest.id] ?? dest.city.slice(0, 3).toUpperCase()}</p>
            <p className="mt-1 text-xs text-paper/60">{dest.city}, {dest.country}</p>
          </div>
        </div>
        <dl className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            ["Passenger", profile.name.split(" ")[0]],
            ["Arrival", shortDate(profile.arrivalDate)],
            ["Purpose", profile.purpose === "study" ? (profile.nationality === "eu" ? "Erasmus" : "Studies") : purposeLabel[profile.purpose].split(" ")[0]],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-paper/45">{k}</dt>
              <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="perf mx-0" style={{ borderColor: "rgba(243,239,230,0.18)" }} />
      <div className="flex items-center gap-4 p-5 pt-4">
        <p className="font-serif text-[44px] leading-none">
          {prog.pct}
          <span className="text-2xl text-paper/60">%</span>
        </p>
        <div className="flex-1">
          <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-paper/60">
            <span>Overall progress</span>
            <span>
              {prog.done}/{prog.total} steps
            </span>
          </div>
          <Segments total={prog.total} done={prog.done} inProgress={inProg} dark />
        </div>
      </div>
    </section>
  );
}
