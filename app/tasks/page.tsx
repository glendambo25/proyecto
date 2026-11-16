"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { getDestination, isBlocked, phaseLabel, progressOf } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { Header, Segments, StatusBadge, StepMarker } from "@/components/ui";
import DependencyMap from "@/components/DependencyMap";
import type { Phase } from "@/lib/types";

export default function Tasks() {
  const { profile, checklist, statuses } = useApp();
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const phases: Phase[] = ["before", "arrival", "settle", "return"];
  const prog = progressOf(checklist, statuses);

  return (
    <main>
      <Header
        eyebrow={`${dest.city} · ${profile.nationalityLabel} · ${profile.purpose}`}
        title={
          <>
            Your <em>checklist</em>
          </>
        }
        subtitle="Personalised for your passport and reason for moving. Order matters: some steps unlock others."
      />
      <div className="space-y-8 px-5">
        <div className="flex items-center gap-4">
          <p className="font-serif text-[40px] leading-none">
            {prog.done}
            <span className="text-ink-3">/{prog.total}</span>
          </p>
          <div className="flex-1">
            <Segments total={prog.total} done={prog.done} />
            <p className="eyebrow mt-2">{prog.pct}% ready for arrival</p>
          </div>
        </div>

        <DependencyMap tasks={checklist.filter((t) => t.phase !== "return")} statuses={statuses} />

        {phases.map((ph) => {
          const list = checklist.filter((t) => t.phase === ph);
          if (!list.length) return null;
          return (
            <section key={ph} id={ph} className="scroll-mt-6">
              <div className="mb-2 flex items-baseline gap-3">
                <h2 className="font-serif text-[26px]">{phaseLabel[ph]}</h2>
                <span className="h-px flex-1 bg-line" />
                <span className="eyebrow">{list.length} steps</span>
              </div>
              <ol className="relative">
                <span className="absolute bottom-5 left-[13.5px] top-5 w-px bg-line" aria-hidden />
                {list.map((t) => {
                  const st = statusOf(statuses, t.id);
                  const blocked = st === "pending" && isBlocked(t, statuses);
                  return (
                    <li key={t.id}>
                      <Link href={`/tasks/${t.id}`} className="group flex items-start gap-4 py-3">
                        <StepMarker status={st} n={checklist.indexOf(t) + 1} />
                        <span className={`min-w-0 flex-1 ${st === "completed" ? "opacity-60" : ""}`}>
                          <span className="block text-[15px] font-semibold group-hover:text-accent">{t.title}</span>
                          {t.localName && <span className="block font-mono text-[11px] text-ink-3">{t.localName}</span>}
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {t.critical && <span className="chip border-stamp/30 text-stamp">Critical</span>}
                            {t.deadline && (
                              <span className="chip border-stamp/30 bg-stamp-soft text-stamp">
                                <Clock3 size={10} /> Deadline
                              </span>
                            )}
                            {t.verificationStatus === "verified" ? (
                              <span className="chip border-ok/25 text-ok">Verified source</span>
                            ) : (
                              <span className="chip border-dashed border-stamp/40 text-stamp">Source TODO</span>
                            )}
                          </span>
                        </span>
                        <StatusBadge status={st} blocked={blocked} />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </main>
  );
}
