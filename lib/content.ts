import turin from "@/content/turin.json";
import milan from "@/content/milan.json";
import munich from "@/content/munich.json";
import luxembourg from "@/content/luxembourg.json";
import newYork from "@/content/new-york.json";
import personasJson from "@/content/personas.json";
import type { Destination, Nationality, Persona, Purpose, Task, TaskStatus } from "./types";

export const APP_NAME = "Arrival";
export const TAGLINE = "You move. We handle the paperwork.";

export const destinations = [turin, milan, munich, luxembourg, newYork] as unknown as Destination[];
export const personas = personasJson as unknown as Persona[];

export function getDestination(id: string): Destination {
  return destinations.find((d) => d.id === id) ?? destinations[0];
}

/** Personalised checklist: filters by nationality and purpose, sorted so every task comes after the tasks it depends on. */
export function buildChecklist(destinationId: string, nationality: Nationality, purpose: Purpose): Task[] {
  const dest = getDestination(destinationId);
  const applicable = dest.tasks.filter(
    (t) => (t.appliesTo.nationality === "any" || t.appliesTo.nationality === nationality) && t.appliesTo.purpose.includes(purpose),
  );
  const ids = new Set(applicable.map((t) => t.id));
  // Drop dependencies that don't apply to this profile (e.g. "visa" for EU citizens).
  const cleaned = applicable.map((t) => ({ ...t, dependsOn: t.dependsOn.filter((d) => ids.has(d)) }));
  const phaseRank = { before: 0, arrival: 1, settle: 2, return: 3 } as const;
  const sorted = [...cleaned].sort((a, b) => phaseRank[a.phase] - phaseRank[b.phase] || a.order - b.order);
  // Topological pass (stable): a task is placed only after its dependencies.
  const out: Task[] = [];
  const placed = new Set<string>();
  let guard = 0;
  while (out.length < sorted.length && guard++ < 100) {
    for (const t of sorted) {
      if (!placed.has(t.id) && t.dependsOn.every((d) => placed.has(d))) {
        out.push(t);
        placed.add(t.id);
      }
    }
  }
  return out;
}

export function unlocksOf(task: Task, checklist: Task[]): Task[] {
  return checklist.filter((t) => t.dependsOn.includes(task.id));
}

export function isBlocked(task: Task, statuses: Record<string, TaskStatus>): boolean {
  return task.dependsOn.some((d) => statuses[d] !== "completed");
}

export function progressOf(checklist: Task[], statuses: Record<string, TaskStatus>) {
  const counted = checklist.filter((t) => t.phase !== "return");
  const done = counted.filter((t) => statuses[t.id] === "completed").length;
  return { done, total: counted.length, pct: counted.length ? Math.round((done / counted.length) * 100) : 0 };
}

export const purposeLabel: Record<Purpose, string> = {
  study: "Study exchange",
  internship: "Internship",
  work: "Work / posted worker",
};

export const phaseLabel = {
  before: "Before you leave",
  arrival: "First days",
  settle: "Settling in",
  return: "When you go back",
} as const;

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Compact, verified-only knowledge base for the assistant (one destination). */
export function knowledgeBase(destinationId: string, nationality: Nationality, purpose: Purpose) {
  const dest = getDestination(destinationId);
  const list = buildChecklist(destinationId, nationality, purpose);
  return {
    destination: `${dest.city}, ${dest.country}`,
    housingScamAlert: dest.housingAlert,
    tasks: list.map((t) => ({
      id: t.id,
      title: t.title,
      localName: t.localName,
      phase: t.phase,
      description: t.description,
      dependsOn: t.dependsOn,
      documentsNeeded: t.documentsNeeded,
      steps: t.steps,
      deadline: t.deadline,
      cost: t.cost,
      estimatedTime: t.estimatedTime,
      verificationStatus: t.verificationStatus,
      officialSource: t.officialSourceUrl ? { name: t.officialSourceName, url: t.officialSourceUrl, lastVerified: t.lastVerified } : null,
      openQuestions: t.todo,
    })),
  };
}
