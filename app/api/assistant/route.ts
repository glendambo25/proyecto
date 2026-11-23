import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { askAssistant, offlineAnswer, type AssistantRequest } from "@/lib/assistant";
import { destinations } from "@/lib/content";
import { DEMO_ASSISTANT_TIMEOUT_MS, getCached, isDemoRequest, saveCached, withTimeout } from "@/lib/demo-cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: AssistantRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body?.question || typeof body.question !== "string" || body.question.length > 2000) {
    return NextResponse.json({ error: "question required (max 2000 chars)" }, { status: 400 });
  }
  if (!destinations.some((d) => d.id === body.destinationId)) body.destinationId = destinations[0].id;
  if (body.nationality !== "eu" && body.nationality !== "non-eu") body.nationality = "eu";
  if (!["study", "internship", "work"].includes(body.purpose)) body.purpose = "study";

  const demo = isDemoRequest(req);
  try {
    if (!demo) return NextResponse.json(await askAssistant(body));
    // DEMO MODE: never hang on stage. Live answer within the time limit, saved for rehearsal replay.
    const live = await withTimeout(askAssistant(body), DEMO_ASSISTANT_TIMEOUT_MS);
    saveCached(body, live);
    return NextResponse.json(live);
  } catch (error) {
    if (demo) {
      const cached = getCached(body);
      console.warn(`[assistant] demo fallback (${cached ? "cached rehearsal answer" : "offline answer"}):`, (error as Error)?.message);
      if (cached) return NextResponse.json({ ...cached, cached: true });
    }
    // Fall back to the offline, source-cited answer so the demo never breaks.
    if (error instanceof Anthropic.AuthenticationError) console.error("[assistant] invalid ANTHROPIC_API_KEY");
    else if (error instanceof Anthropic.RateLimitError) console.error("[assistant] rate limited");
    else if (error instanceof Anthropic.APIError) console.error(`[assistant] API error ${error.status}: ${error.message}`);
    else console.error("[assistant]", error);
    return NextResponse.json(offlineAnswer(body));
  }
}
