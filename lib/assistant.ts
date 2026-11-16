import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { buildChecklist, getDestination, knowledgeBase } from "./content";
import type { Nationality, Purpose, Task } from "./types";

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
}

const Answer = z.object({
  answer: z.string().describe("Answer in English, 2-6 short sentences, plain text, no markdown links."),
  covered: z.boolean().describe("true only if the answer is fully supported by the knowledge base"),
  citedTaskIds: z.array(z.string()).describe("ids of the knowledge-base tasks the answer is based on"),
  missingTaskIds: z.array(z.string()).describe("ids of tasks in the user's checklist that are still missing for what they asked"),
  suggestAdvisor: z.boolean(),
});

const SYSTEM = `You are the 24/7 assistant of a mobile app that helps students, interns and workers with the paperwork of moving abroad. The app's promise: "You move. We handle the paperwork."

Rules (non-negotiable):
- Answer ONLY from the KNOWLEDGE BASE in the user turn. It holds the user's personalised checklist for their destination, with the official source of each step. Do not use outside knowledge for requirements, deadlines, fees, offices or legal facts.
- Every factual claim must come from a task you list in citedTaskIds. The app shows each cited task's official source and last-verified date under your answer, so do not write URLs or dates of verification yourself.
- If a task has verificationStatus "todo" or the knowledge base does not cover the question, say clearly: "${NO_SOURCE}" Then say what the app does know (if anything) and set suggestAdvisor true. Set covered false in that case.
- Explain the ORDER: if a step depends on another (dependsOn), say what must be done first.
- When the user asks what they need, list in missingTaskIds the checklist tasks that are not completed yet (see statuses) and relevant to the question; the app will flag them in the checklist. Say "I've marked what's missing in your checklist" when you do.
- Keep official local names in their original language with an English explanation, e.g. "Codice fiscale (Italian tax code)".
- Always answer in English, short and practical. Never invent numbers, prices or statistics.`;

function sourcesFor(ids: string[], tasks: Task[]): AssistantSource[] {
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
  const words = q.split(/[^a-zà-ÿ0-9]+/).filter((w) => w.length > 3);
  const scored = tasks
    .map((t) => {
      const hay = `${t.title} ${t.localName ?? ""} ${t.category} ${t.description}`.toLowerCase();
      let s = 0;
      for (const w of words) if (hay.includes(w)) s += hay.indexOf(w) < t.title.length + (t.localName?.length ?? 0) + 20 ? 3 : 1;
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
  const needs = top.dependsOn.map((d) => tasks.find((t) => t.id === d)?.title).filter(Boolean);
  const missing = [top.id, ...top.dependsOn].filter((id) => req.statuses?.[id] !== "completed");
  let answer = `${top.title}${top.localName ? ` — ${top.localName}` : ""}: ${top.description}`;
  if (needs.length) answer += ` Do this first: ${needs.join(", ")}.`;
  if (top.deadline) answer += ` Deadline: ${top.deadline}.`;
  answer += ` You'll need: ${top.documentsNeeded.join(", ")}.`;
  if (top.category === "Accommodation") answer += ` Scam check for ${dest.city}: ${dest.housingAlert[0]}`;
  if (top.verificationStatus === "todo") answer = `${NO_SOURCE} What the app has so far: ${answer}`;
  if (missing.length) answer += " I've marked what's missing in your checklist.";
  return {
    answer,
    covered: top.verificationStatus === "verified",
    sources: sourcesFor([top.id], tasks),
    missingTaskIds: missing,
    suggestAdvisor: top.verificationStatus === "todo",
    offline: true,
  };
}

export async function askAssistant(req: AssistantRequest): Promise<AssistantResponse> {
  if (!process.env.ANTHROPIC_API_KEY) return offlineAnswer(req);
  const tasks = buildChecklist(req.destinationId, req.nationality, req.purpose);
  const kb = knowledgeBase(req.destinationId, req.nationality, req.purpose);
  const client = new Anthropic();

  const history: Anthropic.Beta.BetaMessageParam[] = (req.history ?? []).slice(-8).map((m) => ({ role: m.role, content: m.text }));
  const response = await client.beta.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort: "low", format: betaZodOutputFormat(Answer) },
    messages: [
      ...history,
      {
        role: "user",
        content: `KNOWLEDGE BASE (verified content, JSON):\n${JSON.stringify(kb)}\n\nTASK STATUSES: ${JSON.stringify(req.statuses ?? {})}\n\nQUESTION: ${req.question}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { answer: `${NO_SOURCE} I can connect you with an advisor.`, covered: false, sources: [], missingTaskIds: [], suggestAdvisor: true, offline: false };
  }
  const out = response.parsed_output;
  const valid = new Set(tasks.map((t) => t.id));
  const cited = out.citedTaskIds.filter((id) => valid.has(id));
  const sources = sourcesFor(cited, tasks);
  // Safety net: an answer without any cited verified source is never presented as covered.
  const covered = out.covered && sources.some((s) => s.verificationStatus === "verified");
  return {
    answer: out.answer,
    covered,
    sources,
    missingTaskIds: out.missingTaskIds.filter((id) => valid.has(id)),
    suggestAdvisor: out.suggestAdvisor || !covered,
    offline: false,
  };
}
