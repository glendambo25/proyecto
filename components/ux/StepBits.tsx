"use client";

import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { blockersOf, overdue, rowState, type RowState } from "@/lib/ux/guide";

export const STATE_LABEL: Record<RowState, string> = {
  done: "Done",
  doing: "In progress",
  ready: "Ready to start",
  locked: "Locked",
};

/** Status node shared by every list: same shapes as the chart (green done, indigo ring, dashed lock). */
export function StateIcon({ state, size = 24, className = "" }: { state: RowState; size?: number; className?: string }) {
  const s = { width: size, height: size };
  if (state === "done")
    return (
      <span style={s} className={`grid shrink-0 place-items-center rounded-full bg-ok text-white ${className}`} aria-hidden>
        <Check size={size * 0.55} strokeWidth={3} />
      </span>
    );
  if (state === "doing") return <span style={s} className={`block shrink-0 rounded-full border-[3px] border-accent bg-white ${className}`} aria-hidden />;
  if (state === "locked")
    return (
      <span style={s} className={`grid shrink-0 place-items-center rounded-full border border-dashed border-ink-3 bg-white text-ink-3 ${className}`} aria-hidden>
        <Lock size={size * 0.45} />
      </span>
    );
  return <span style={s} className={`block shrink-0 rounded-full border-2 border-ink bg-white ${className}`} aria-hidden />;
}

/** One-line explanation under a step title: why it is locked, or its deadline. Plain text, never handwriting. */
export function StepHint({ task, checklist, statuses, arrival, showDoing = true }: { task: Task; checklist: Task[]; statuses: Record<string, TaskStatus>; arrival: string; showDoing?: boolean }) {
  const state = rowState(task, statuses);
  if (state === "done") return null;
  if (state === "locked") {
    const b = blockersOf(task, checklist, statuses);
    return (
      <span className="mt-0.5 flex items-start gap-1 text-[13.5px] leading-snug text-ink-2">
        <Lock size={13} className="mt-[3px] shrink-0" aria-hidden />
        <span>
          First: {b.map((x, i) => (
            <span key={x.id}>
              {i > 0 && " + "}
              <span className="font-semibold">{x.title}</span>
            </span>
          ))}
        </span>
      </span>
    );
  }
  if (task.deadline) return <span className={`mt-0.5 block text-[13.5px] leading-snug ${overdue(task, arrival, statuses) ? "font-semibold text-stamp" : "text-ink-2"}`}>Deadline: {task.deadline}</span>;
  if (state === "doing" && showDoing) return <span className="mt-0.5 block text-[13.5px] text-accent">In progress</span>;
  return null;
}

/** Compact list row (home "coming up", minimal checklist). */
export function StepRow({ task, checklist, statuses, arrival, n, flagged }: { task: Task; checklist: Task[]; statuses: Record<string, TaskStatus>; arrival: string; n?: number; flagged?: boolean }) {
  const state = rowState(task, statuses);
  const blockers = state === "locked" ? blockersOf(task, checklist, statuses).map((b) => b.title).join(" and ") : "";
  const label = `${n ? `Step ${n}: ` : ""}${task.title}. ${STATE_LABEL[state]}${blockers ? `, first finish ${blockers}` : ""}${task.deadline && state !== "done" ? `. Deadline: ${task.deadline}` : ""}`;
  return (
    <Link href={`/tasks/${task.id}`} aria-label={label} className="group flex min-h-[56px] items-start gap-3 py-3">
      <StateIcon state={state} size={22} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className={`block text-[15.5px] font-semibold leading-snug group-hover:text-accent ${state === "done" ? "text-ink-3" : ""}`}>{task.title}</span>
        <StepHint task={task} checklist={checklist} statuses={statuses} arrival={arrival} />
        {flagged && <span className="mt-1 block text-[13px] font-semibold text-accent">Flagged by your assistant</span>}
      </span>
      <ChevronRight size={18} className="flip-rtl mt-0.5 shrink-0 text-ink-3" aria-hidden />
    </Link>
  );
}
