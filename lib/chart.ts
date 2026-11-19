import { estimateDue, isBlocked } from "./content";
import type { Task, TaskStatus } from "./types";

/** Whole days from the arrival date to today (negative = before landing). */
export function daysFromArrival(arrivalIso: string, now = new Date()): number {
  const a = new Date(arrivalIso + "T12:00:00").getTime();
  const t = new Date(now.toISOString().slice(0, 10) + "T12:00:00").getTime();
  return Math.round((t - a) / 86400000);
}

export function readout(days: number): { value: string; label: string } {
  if (days === 0) return { value: "0", label: "days · landing day" };
  if (days < 0) return { value: `−${Math.abs(days)}`, label: "days to landing" };
  return { value: `+${days}`, label: "days since landing" };
}

/** Days after arrival for a step whose deadline has a verified rule; null otherwise (we never invent timing). */
export function dueDay(task: Task, arrivalIso: string): number | null {
  const due = estimateDue(arrivalIso, task.deadlineRule);
  return due ? daysFromArrival(arrivalIso, new Date(due + "T12:00:00")) : null;
}

/** Short handwritten note for a row: what it waits for, or its deadline. Derived only from content. */
export function noteFor(task: Task, checklist: Task[], statuses: Record<string, TaskStatus>, isNext: boolean): string | null {
  const st = statuses[task.id] ?? "pending";
  if (st === "completed") return null;
  const missing = task.dependsOn.filter((d) => statuses[d] !== "completed").map((d) => checklist.find((t) => t.id === d)?.title.split(" (")[0]);
  if (missing.length) return `needs ${missing.join(" + ").toLowerCase()} first`;
  if (task.deadlineRule) return `${task.deadlineRule.days} ${task.deadlineRule.workingDays ? "working " : ""}days after arrival!`;
  if (isNext) return "start here";
  return null;
}

export function nextOpen(checklist: Task[], statuses: Record<string, TaskStatus>): Task | undefined {
  return checklist.find((t) => t.phase !== "return" && (statuses[t.id] ?? "pending") !== "completed" && !isBlocked(t, statuses));
}
