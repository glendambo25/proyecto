"use client";

import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import { getDestination, isBlocked, phaseLabel, progressOf } from "@/lib/content";
import { daysFromArrival, dueDay, nextOpen } from "@/lib/chart";
import { statusOf, useApp } from "@/lib/store";
import type { Task } from "@/lib/types";

/** Minimal direction: hairline list, system face, one indigo accent. */
export default function TasksMinimal() {
  const { profile, checklist, statuses } = useApp();
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const prog = progressOf(checklist, statuses);
  const next = nextOpen(checklist, statuses);
  const phases = (["before", "arrival", "settle", "return"] as const).filter((p) => checklist.some((t) => t.phase === p));
  const days = daysFromArrival(profile.arrivalDate);
  const overdueOf = (t: Task) => {
    const due = dueDay(t, profile.arrivalDate);
    return due != null && statusOf(statuses, t.id) !== "completed" && days > due;
  };

  return (
    <main className="font-ui">
      <header className="px-5 pb-6 pt-6 lg:px-8 lg:pt-10">
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.015em] lg:text-[34px]">Checklist</h1>
        <p className="mt-1 text-[15px] text-ink-2">
          <span className="tabular">
            {dest.city} · {days === 0 ? "landing day" : days < 0 ? `${-days} days to landing` : `${days} days since landing`}
          </span>
        </p>
        <p className="mt-0.5 text-[15px] text-ink-2">
          {prog.done} of {prog.total} arrival steps done ({checklist.length} with going home)
          {next && (
            <>
              {" · next: "}
              <Link href={`/tasks/${next.id}`} className="font-medium text-accent hover:underline">
                {next.title}
              </Link>
            </>
          )}
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
          <div className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out" style={{ width: `${prog.pct}%` }} />
        </div>
      </header>

      <div className="space-y-8 px-5 pb-6 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:space-y-0 lg:px-8">
        {phases.map((ph) => (
          <section key={ph} id={ph} className="scroll-mt-4 lg:mb-8">
            <h2 className="mb-1 text-[13px] font-medium text-ink-3">{phaseLabel[ph]}</h2>
            <ul className="divide-y divide-line border-y border-line">
              {checklist
                .filter((t) => t.phase === ph)
                .map((t) => {
                  const st = statusOf(statuses, t.id);
                  const blocked = st === "pending" && isBlocked(t, statuses);
                  const waits = t.dependsOn.filter((d) => statuses[d] !== "completed").map((d) => checklist.find((x) => x.id === d)?.title);
                  return (
                    <li key={t.id}>
                      <Link href={`/tasks/${t.id}`} className="group flex min-h-[56px] items-center gap-3 py-3.5 transition-colors duration-150">
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                            st === "completed" ? "bg-ok text-white" : st === "in_progress" ? "border-2 border-accent" : blocked ? "border border-dashed border-ink-3 text-ink-3" : "border border-ink-3"
                          }`}
                          aria-hidden
                        >
                          {st === "completed" ? <Check size={11} strokeWidth={3} /> : blocked ? <Lock size={9} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block break-words text-[15px] leading-snug ${st === "completed" ? "text-ink-3" : "text-ink"} group-hover:text-accent`}>{t.title}</span>
                          {(blocked || t.deadline) && st !== "completed" && (
                            <span className="block break-words text-[13px] leading-snug">
                              {blocked && <span className="text-ink-2">Locked · first: {waits.join(" + ")}</span>}
                              {blocked && t.deadline && <span className="text-ink-3"> · </span>}
                              {t.deadline && <span className={overdueOf(t) ? "text-stamp" : "text-ink-2"}>{t.deadline}</span>}
                            </span>
                          )}
                        </span>
                        {st === "in_progress" && <span className="text-[13px] text-accent">In progress</span>}
                        {t.verificationStatus !== "verified" && st !== "completed" && <span className="text-[12px] text-ink-3">Source pending</span>}
                        <ChevronRight size={16} className="flip-rtl shrink-0 text-ink-3" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
