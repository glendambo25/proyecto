"use client";

import Link from "next/link";
import { isBlocked } from "@/lib/content";
import { statusOf } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/types";

/**
 * Route map: columns are "stations" in order. A step only appears after
 * the steps it needs. Read left to right, like a transit line.
 */
export default function DependencyMap({ tasks, statuses }: { tasks: Task[]; statuses: Record<string, TaskStatus> }) {
  const level: Record<string, number> = {};
  for (const t of tasks) level[t.id] = t.dependsOn.length ? Math.max(...t.dependsOn.map((d) => (level[d] ?? 0) + 1)) : 0;
  const maxL = Math.max(0, ...Object.values(level));
  const cols = Array.from({ length: maxL + 1 }, (_, i) => tasks.filter((t) => level[t.id] === i));

  const style = (t: Task) => {
    const s = statusOf(statuses, t.id);
    if (s === "completed") return "border-ink bg-ink text-paper";
    if (s === "in_progress") return "border-accent bg-accent text-white";
    return isBlocked(t, statuses) ? "border-dashed border-ink-3/40 bg-transparent text-ink-3" : "border-line bg-card text-ink";
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="eyebrow">Route map · what unlocks what</span>
        <span className="flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-wider text-ink-3">
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-ink" /> done
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full border border-dashed border-ink-3" /> locked
          </span>
        </span>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="flex min-w-max items-stretch">
          {cols.map((col, i) => (
            <div key={i} className="flex items-stretch">
              <div className="flex w-[136px] flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{i === 0 ? "Start" : `Stage ${i + 1}`}</span>
                {col.map((t) => (
                  <Link key={t.id} href={`/tasks/${t.id}`} className={`rounded-2xl border p-2.5 text-[12px] font-semibold leading-snug transition hover:-translate-y-0.5 ${style(t)}`}>
                    {t.title}
                  </Link>
                ))}
              </div>
              {i < cols.length - 1 && (
                <div className="flex w-8 items-center justify-center" aria-hidden>
                  <svg width="24" height="12" viewBox="0 0 24 12" className="text-ink-3">
                    <path d="M0 6h20M16 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
