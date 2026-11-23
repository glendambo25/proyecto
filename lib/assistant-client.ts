import { STATIC_EXPORT } from "./runtime";
import type { AssistantRequest, AssistantResponse } from "./offline";

/** Ask the assistant: the server route when there is one, otherwise the offline answerer in the browser. */
export async function requestAnswer(body: AssistantRequest): Promise<AssistantResponse> {
  if (STATIC_EXPORT) {
    const { offlineAnswer } = await import("./offline");
    return offlineAnswer(body);
  }
  const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "error");
  return j;
}
