"use client";

import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Task, TaskStatus } from "@/lib/types";
import { blockersOf, overdue, rowState, type RowState } from "@/lib/ux/guide";

/** Translated state names (messages: state.*). */
export function useStateLabel() {
  const t = useTranslations("state");
  return (s: RowState) => t(s);
}

/** Accessible row label: "Step 8: Foreigner identity card. Locked, first finish Student visa. Deadline: …". */
export function useRowLabel() {
  const t = useTranslations("a11y");
  const stateLabel = useStateLabel();
  return (o: { n?: number; title: string; state: RowState; waits?: string; isNext?: boolean; deadline?: string }) =>
    (o.n ? t("row", { n: o.n, title: o.title, state: stateLabel(o.state) }) : t("rowNoNumber", { title: o.title, state: stateLabel(o.state) })) +
    (o.waits ? t("firstFinish", { steps: o.waits }) : "") +
    (o.isNext ? t("isNext") : "") +
    (o.deadline && o.state !== "done" ? t("deadline", { deadline: o.deadline }) : "");
}

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
  const t = useTranslations("hint");
  const ts = useTranslations("state");
  const state = rowState(task, statuses);
  if (state === "done") return null;
  if (state === "locked") {
    const b = blockersOf(task, checklist, statuses);
    return (
      <span className="mt-0.5 flex items-start gap-1 text-[13.5px] leading-snug text-ink-2">
        <Lock size={13} className="mt-[3px] shrink-0" aria-hidden />
        <span>
          {t("first")}{" "}
          {b.map((x, i) => (
            <span key={x.id}>
              {i > 0 && t("and")}
              <span className="font-semibold">{x.title}</span>
            </span>
          ))}
        </span>
      </span>
    );
  }
  if (task.deadline) return <span className={`mt-0.5 block text-[13.5px] leading-snug ${overdue(task, arrival, statuses) ? "font-semibold text-stamp" : "text-ink-2"}`}>{t("deadline", { deadline: task.deadline })}</span>;
  if (state === "doing" && showDoing) return <span className="mt-0.5 block text-[13.5px] text-accent">{ts("doing")}</span>;
  return null;
}

/** Compact list row (home "coming up", minimal checklist). */
export function StepRow({ task, checklist, statuses, arrival, n, flagged }: { task: Task; checklist: Task[]; statuses: Record<string, TaskStatus>; arrival: string; n?: number; flagged?: boolean }) {
  const rowLabel = useRowLabel();
  const th = useTranslations("home");
  const state = rowState(task, statuses);
  const waits = state === "locked" ? blockersOf(task, checklist, statuses).map((b) => b.title).join(" + ") : "";
  const label = rowLabel({ n, title: task.title, state, waits, deadline: task.deadline });
  return (
    <Link href={`/tasks/${task.id}`} aria-label={label} className="group flex min-h-[56px] items-start gap-3 py-3">
      <StateIcon state={state} size={22} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className={`block text-[15.5px] font-semibold leading-snug group-hover:text-accent ${state === "done" ? "text-ink-3" : ""}`}>{task.title}</span>
        <StepHint task={task} checklist={checklist} statuses={statuses} arrival={arrival} />
        {flagged && <span className="mt-1 block text-[13px] font-semibold text-accent">{th("flagged")}</span>}
      </span>
      <ChevronRight size={18} className="flip-rtl mt-0.5 shrink-0 text-ink-3" aria-hidden />
    </Link>
  );
}
