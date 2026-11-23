/**
 * UX helpers: turn the checklist into plain answers to "what now, and why?".
 * Everything here is derived from content/*.json (no new procedure content is written).
 */
import { isBlocked, unlocksOf } from "@/lib/content";
import { daysFromArrival, dueDay, nextOpen } from "@/lib/chart";
import type { Task, TaskStatus } from "@/lib/types";

export type RowState = "done" | "doing" | "ready" | "locked";

export function rowState(task: Task, statuses: Record<string, TaskStatus>): RowState {
  const st = statuses[task.id] ?? "pending";
  if (st === "completed") return "done";
  if (st === "in_progress") return "doing";
  return isBlocked(task, statuses) ? "locked" : "ready";
}

/** Prerequisites that are not finished yet. */
export function blockersOf(task: Task, checklist: Task[], statuses: Record<string, TaskStatus>): Task[] {
  return task.dependsOn.filter((d) => statuses[d] !== "completed").map((d) => checklist.find((t) => t.id === d)).filter((t): t is Task => !!t);
}

/** Short reasons why a step matters now, taken from its data (deadline, what it unlocks, critical flag). */
export function reasonsFor(task: Task, checklist: Task[]): string[] {
  const out: string[] = [];
  if (task.deadline) out.push(`Deadline: ${task.deadline}`);
  const unlocks = unlocksOf(task, checklist);
  if (unlocks.length) out.push(`Unlocks ${unlocks.map((t) => t.title).join(", ")}`);
  if (task.critical && !task.deadline) out.push("Required for your visa or residence");
  return out;
}

export interface Countdown {
  value: string;
  label: string;
  /** Accessible full sentence. */
  sentence: string;
}

export function countdown(arrivalIso: string, city: string): Countdown {
  const d = daysFromArrival(arrivalIso);
  if (d < 0) {
    const n = -d;
    return { value: String(n), label: n === 1 ? `day until you land in ${city}` : `days until you land in ${city}`, sentence: `${n} ${n === 1 ? "day" : "days"} until you land in ${city}` };
  }
  if (d === 0) return { value: "0", label: `Landing day in ${city}`, sentence: `Today you land in ${city}` };
  return { value: String(d), label: d === 1 ? `day in ${city}` : `days in ${city}`, sentence: `Day ${d} in ${city}` };
}

export function overdue(task: Task, arrivalIso: string, statuses: Record<string, TaskStatus>): boolean {
  const due = dueDay(task, arrivalIso);
  return due != null && statuses[task.id] !== "completed" && daysFromArrival(arrivalIso) > due;
}

export interface Summary {
  next?: Task;
  doing: Task[];
  ready: Task[];
  locked: Task[];
  done: Task[];
  /** Steps that count for progress (going-home steps excluded). */
  total: number;
}

export function summarise(checklist: Task[], statuses: Record<string, TaskStatus>): Summary {
  const main = checklist.filter((t) => t.phase !== "return");
  const by = (s: RowState) => main.filter((t) => rowState(t, statuses) === s);
  return { next: nextOpen(checklist, statuses), doing: by("doing"), ready: by("ready"), locked: by("locked"), done: by("done"), total: main.length };
}

/** First sentence of a description, for one-line context. */
export function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : text).trim();
}
