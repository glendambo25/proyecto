import { buildChecklist, getDestination } from "./content";
import type { Nationality, Purpose, Task } from "./types";

/** Shared assistant types + the offline answerer (no API key, no server): keyword match over verified content. Safe to run in the browser. */
export const NO_SOURCE = "I don't have a verified official source for this yet.";

export interface AssistantRequest {
  question: string;
  destinationId: string;
  nationality: Nationality;
  purpose: Purpose;
  statuses?: Record<string, string>;
  history?: { role: "user" | "assistant"; text: string }[];
}

export interface AssistantSource {
  taskId: string;
  name: string;
  url: string | null;
  lastVerified: string | null;
  verificationStatus: string;
}

export interface AssistantResponse {
  answer: string;
  covered: boolean;
  sources: AssistantSource[];
  missingTaskIds: string[];
  suggestAdvisor: boolean;
  offline: boolean;
  /** Demo rehearsal answer served when the live model fails. */
  cached?: boolean;
}


export function sourcesFor(ids: string[], tasks: Task[]): AssistantSource[] {
  return ids
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => !!t)
    .map((t) => ({ taskId: t.id, name: t.officialSourceName, url: t.officialSourceUrl, lastVerified: t.lastVerified, verificationStatus: t.verificationStatus }));
}

/** Offline mode (no API key): keyword match over the verified content. Still cites source + date. */
export function offlineAnswer(req: AssistantRequest): AssistantResponse {
  const tasks = buildChecklist(req.destinationId, req.nationality, req.purpose);
  const dest = getDestination(req.destinationId);
  const q = req.question.toLowerCase();
  const done = (id: string) => req.statuses?.[id] === "completed";
  // Intent: order / next step — answered from the dependency graph itself.
  if (/(next step|what now|what should i do|in what order|which order|order should)/.test(q)) {
    const open = tasks.filter((t) => t.phase !== "return" && !done(t.id));
    const ready = open.filter((t) => t.dependsOn.every(done));
    if (!open.length)
      return { answer: "You've completed every arrival step in your checklist. When you go back, check the return reminders in Tasks.", covered: true, sources: [], missingTaskIds: [], suggestAdvisor: false, offline: true };
    const lines = open.slice(0, 6).map((t, i) => {
      const needs = t.dependsOn.filter((d) => !done(d)).map((d) => tasks.find((x) => x.id === d)?.title);
      return `${i + 1}. ${t.title}${needs.length ? ` (after: ${needs.join(", ")})` : ""}${t.deadline ? ` — ${t.deadline}` : ""}`;
    });
    return {
      answer: `Here is your order for ${dest.city}. You can start now with: ${ready.map((t) => t.title).join(", ")}.\n\n${lines.join("\n")}\n\nI've marked what's missing in your checklist.`,
      covered: true,
      sources: sourcesFor(ready.map((t) => t.id), tasks),
      missingTaskIds: open.map((t) => t.id),
      suggestAdvisor: false,
      offline: true,
    };
  }
  // Short acronyms used in task titles (e.g. "TIE") count as keywords too.
  const acronyms = new Set(tasks.flatMap((t) => t.title.match(/[A-Z]{2,4}/g) ?? []).map((a) => a.toLowerCase()));
  const words = q.split(/[^a-zà-ÿ0-9]+/).filter((w) => w.length > 3 || acronyms.has(w));
  const scored = tasks
    .map((t) => {
      const hay = `${t.title} ${t.localName ?? ""} ${t.category} ${t.description}`.toLowerCase();
      let s = 0;
      for (const w of words) if (acronyms.has(w) && t.title.toLowerCase().includes(`(${w})`)) s += 6;
      else if (hay.includes(w)) s += hay.indexOf(w) < t.title.length + (t.localName?.length ?? 0) + 20 ? 3 : 1;
      if (/(scam|fraud|deposit|estafa)/.test(q) && t.category === "Accommodation") s += 5;
      if (/(insurance|health)/.test(q) && t.category === "Insurance") s += 4;
      if (/(register|registration|address|anagrafe|anmeldung)/.test(q) && t.category === "Registration" && t.phase !== "return") s += 4;
      if (/(leave|leaving|go back|return)/.test(q) && t.phase === "return") s += 4;
      return { t, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const top = scored[0]?.t;
  if (!top)
    return { answer: `${NO_SOURCE} I can connect you with an advisor or the international office.`, covered: false, sources: [], missingTaskIds: [], suggestAdvisor: true, offline: true };
  const needs = top.dependsOn.filter((d) => !done(d)).map((d) => tasks.find((t) => t.id === d)?.title).filter(Boolean);
  const missing = [top.id, ...top.dependsOn].filter((id) => req.statuses?.[id] !== "completed");
  let answer = `${top.title}${top.localName ? ` (${top.localName})` : ""}. ${top.description}`;
  if (needs.length) answer += `\n\nDo this first: ${needs.join(", ")}.`;
  if (top.deadline) answer += `\nDeadline: ${top.deadline}.`;
  answer += `\n\nYou'll need: ${top.documentsNeeded.join(" · ")}.`;
  if (top.category === "Accommodation") answer += `\n\nScam check for ${dest.city}: ${dest.housingAlert[0]}`;
  if (top.verificationStatus === "todo") answer = `${NO_SOURCE} What the app has so far:\n\n${answer}`;
  if (missing.length) answer += "\n\nI've marked what's missing in your checklist.";
  return {
    answer,
    covered: top.verificationStatus === "verified",
    sources: sourcesFor([top.id], tasks),
    missingTaskIds: missing,
    suggestAdvisor: top.verificationStatus === "todo",
    offline: true,
  };
}

