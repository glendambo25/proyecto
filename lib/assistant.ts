import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { buildChecklist, knowledgeBase } from "./content";

import { NO_SOURCE, offlineAnswer, sourcesFor, type AssistantRequest, type AssistantResponse } from "./offline";
export { NO_SOURCE, offlineAnswer, type AssistantRequest, type AssistantResponse, type AssistantSource } from "./offline";
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
