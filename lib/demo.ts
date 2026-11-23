/**
 * DEMO MODE (investor / university demo). See docs/demo-script.md.
 *
 * Turn on:  any page with ?demo=priya  (alias: ?demo=1)
 * Reset:    the "Reset" button in the demo dock, or ?demo=priya&reset=1
 * Turn off: ?demo=off
 *
 * What is REAL in demo mode: the checklist, dependencies, deadlines and official sources (content/madrid.json),
 * the assistant (Claude, or the offline answer built from the same verified content), the voice agent (OpenAI Realtime).
 * What is SIMULATED is marked `SIMULATED` below: Priya's dates/progress, the university cohort, the local-kit
 * partner offers and the voice fallback (browser speech instead of Realtime when the network or key fails).
 */
import { buildChecklist, estimateDue } from "./content";
import type { Persona, TaskStatus } from "./types";

export const DEMO_KEY = "arrival-demo-mode";
export const DEMO_COOKIE = "arrival-demo";
export const DEMO_PERSONA = "priya";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem(DEMO_KEY);
  } catch {
    return false;
  }
}

export function setDemoMode(on: boolean) {
  try {
    if (on) localStorage.setItem(DEMO_KEY, DEMO_PERSONA);
    else localStorage.removeItem(DEMO_KEY);
  } catch {}
  // The API routes read this cookie to enable timeouts + cached fallbacks (never on in normal use).
  document.cookie = on ? `${DEMO_COOKIE}=1; path=/; max-age=86400; samesite=lax` : `${DEMO_COOKIE}=; path=/; max-age=0`;
  window.dispatchEvent(new Event("arrival-demo-change"));
}

export function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso + "T12:00:00").getTime() - new Date(fromIso + "T12:00:00").getTime()) / 86400000);
}

/** SIMULATED: Priya's story, relative to the demo day so the TIE deadline is always 9 days away. */
export const PRIYA_ARRIVED_DAYS_AGO = 21;

interface DemoOverride {
  arrivalDate: string;
  accommodation: string;
  initialStatus: Record<string, TaskStatus>;
  completedOn: Record<string, string>;
  docs: string[];
}

function priyaOverride(): DemoOverride {
  const d = (n: number) => isoDaysFromToday(n);
  return {
    arrivalDate: d(-PRIYA_ARRIVED_DAYS_AGO),
    accommodation: "Temporary room until the end of the month (no rental contract yet)",
    initialStatus: {
      admission: "completed",
      insurance: "completed",
      funds: "completed",
      "criminal-record": "completed",
      "medical-certificate": "completed",
      visa: "completed",
      accommodation: "in_progress",
      tie: "pending",
      padron: "pending",
      bank: "pending",
      transport: "pending",
    },
    completedOn: {
      admission: d(-110),
      insurance: d(-80),
      "criminal-record": d(-75),
      "medical-certificate": d(-72),
      funds: d(-70),
      visa: d(-35),
    },
    docs: ["Passport with student visa", "Admission and fees proof", "Health insurance"],
  };
}

export function demoOverride(personaId: string): DemoOverride | null {
  return personaId === DEMO_PERSONA ? priyaOverride() : null;
}

/** Persona as shown in demo mode (same person, demo dates). */
export function withDemo(p: Persona): Persona {
  if (!isDemoMode()) return p;
  const o = demoOverride(p.id);
  return o ? { ...p, arrivalDate: o.arrivalDate, accommodation: o.accommodation, initialStatus: o.initialStatus, completedOn: o.completedOn } : p;
}

/* ------------------------------------------------------------------------------------------------
 * SIMULATED: university cohort for the office view (Universidad Pontificia Comillas, incoming non-EU).
 * Pseudonymous, deterministic. Risk rules use the REAL deadline rules from content/madrid.json.
 * ---------------------------------------------------------------------------------------------- */

export interface CohortStudent {
  id: string;
  name: string;
  country: string;
  arrivalDate: string;
  statuses: Record<string, TaskStatus>;
  live?: boolean;
}

export interface Risk {
  student: CohortStudent;
  level: "high" | "medium";
  taskId: string;
  reason: string;
  daysLeft?: number;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const NAMES = ["Wei L.", "Ana S.", "Omar K.", "Mei C.", "Lucas P.", "Aisha B.", "Rahul D.", "Sofía G.", "Daniel O.", "Yuki T.", "Fatima Z.", "Mateo R.", "Chen H.", "Ngozi A.", "Valentina M.", "Arjun S.", "Kim J.", "Camila F.", "Tariq N.", "Hana W.", "Diego C.", "Leila H.", "Minh N."];
const COUNTRIES = ["China", "Brazil", "Morocco", "China", "Argentina", "Nigeria", "India", "Mexico", "USA", "Japan", "Morocco", "Colombia", "China", "Nigeria", "Chile", "India", "South Korea", "Peru", "Egypt", "Japan", "Ecuador", "Iran", "Vietnam"];

export function simulatedCohort(): CohortStudent[] {
  const r = rng(6);
  const order = buildChecklist("madrid", "non-eu", "study").filter((t) => t.phase !== "return").map((t) => t.id);
  return NAMES.map((name, i) => {
    const offset = Math.round(-45 + r() * 95); // arrival between 45 days ago and 50 days ahead
    const arrivalDate = isoDaysFromToday(offset);
    const arrived = offset <= 0;
    // Most students are on track: after arrival ~70% have the TIE; arriving soon ~80% have the visa.
    const doneCount = arrived
      ? r() < 0.7
        ? 8 + Math.floor(r() * (order.length - 7))
        : 6 + Math.floor(r() * 2)
      : offset < 45 && r() < 0.8
        ? 6 + Math.floor(r() * 2)
        : Math.floor(r() * 6);
    const statuses: Record<string, TaskStatus> = {};
    order.forEach((id, k) => (statuses[id] = k < doneCount ? "completed" : k === doneCount ? "in_progress" : "pending"));
    return { id: `s${i + 1}`, name, country: COUNTRIES[i], arrivalDate, statuses };
  });
}

/** Risk rules (SIMULATED students, REAL rules): TIE within 30 days of entry; visa at least 2 months before start; padrón needs a contract. */
export function risksOf(s: CohortStudent, todayIso = isoDaysFromToday(0)): Risk[] {
  const out: Risk[] = [];
  const done = (id: string) => s.statuses[id] === "completed";
  const sinceArrival = daysBetween(s.arrivalDate, todayIso);
  if (sinceArrival >= 0 && !done("tie")) {
    const due = estimateDue(s.arrivalDate, { days: 30, workingDays: false })!;
    const left = daysBetween(todayIso, due);
    if (left <= 12) out.push({ student: s, level: left <= 5 ? "high" : "medium", taskId: "tie", daysLeft: left, reason: left < 0 ? `TIE deadline passed ${-left} days ago` : `TIE due in ${left} days, not done yet` });
  }
  if (sinceArrival < 0 && !done("visa") && -sinceArrival < 45) out.push({ student: s, level: "high", taskId: "visa", reason: `Visa not granted, arrives in ${-sinceArrival} days (apply ≥ 2 months before)` });
  if (sinceArrival >= 14 && !done("accommodation")) out.push({ student: s, level: "medium", taskId: "padron", reason: "No rental contract yet: padrón blocked" });
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Questions used in the script. The answers are NOT hard-coded: they come from /api/assistant
 * (live Claude → cached rehearsal answer → offline answer from verified content).
 * ---------------------------------------------------------------------------------------------- */
export const DEMO_QUESTIONS = {
  assistant: "What do I need to bring to my TIE appointment?",
  voice: "Can I register on the padrón before I have a rental contract?",
};

/** Ordered scenes for the demo dock (jump anywhere if something goes wrong). */
export const DEMO_SCENES = [
  { n: 1, label: "Onboarding", href: "/onboarding" },
  { n: 2, label: "Next step", href: "/home" },
  { n: 3, label: "Dependencies", href: "/tasks/padron" },
  { n: 4, label: "Assistant", href: "/chat/assistant" },
  { n: 5, label: "Voice agent", href: "/home#voice" },
  { n: 6, label: "Deadline", href: "/deadlines" },
  { n: 7, label: "Local kit", href: "/kit" },
  { n: 8, label: "University", href: "/office" },
];
