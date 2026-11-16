"use client";

import Link from "next/link";
import { isBlocked } from "@/lib/content";
import { statusOf } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/types";

/** Layered view: each column ("level") only contains tasks whose dependencies are in earlier columns. */
export default function DependencyMap({ tasks, statuses }: { tasks: Task[]; statuses: Record<string, TaskStatus> }) {
  const level: Record<string, number> = {};
  for (const t of tasks) level[t.id] = t.dependsOn.length ? Math.max(...t.dependsOn.map((d) => (level[d] ?? 0) + 1)) : 0;
  const maxL = Math.max(0, ...Object.values(level));
  const cols = Array.from({ length: maxL + 1 }, (_, i) => tasks.filter((t) => level[t.id] === i));
  const color = (t: Task) => {
    const s = statusOf(statuses, t.id);
    if (s === "completed") return "border-ok bg-ok-soft text-ok";
    if (s === "in_progress") return "border-prog bg-prog-soft text-prog";
    return isBlocked(t, statuses) ? "border-dashed border-gray-300 bg-white text-gray-400" : "border-gray-300 bg-white text-navy";
  };

  return (
    <div className="card overflow-x-auto p-3">
      <p className="mb-2 text-xs text-gray-500">What unlocks what — read left to right. Dashed = blocked until the step on its left is done.</p>
      <div className="flex min-w-max gap-2">
        {cols.map((col, i) => (
          <div key={i} className="flex w-32 flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{i === 0 ? "Start here" : `Then (${i + 1})`}</span>
            {col.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className={`rounded-xl border-2 p-2 text-[11px] font-semibold leading-tight ${color(t)}`}>
                {t.title}
                {t.dependsOn.length > 0 && (
                  <span className="mt-1 block text-[10px] font-normal opacity-80">
                    ← needs {t.dependsOn.map((d) => tasks.find((x) => x.id === d)?.title.split(" ")[0]).join(", ")}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
