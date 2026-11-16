import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { askAssistant, offlineAnswer, type AssistantRequest } from "@/lib/assistant";
import { destinations } from "@/lib/content";

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

  try {
    return NextResponse.json(await askAssistant(body));
  } catch (error) {
    // Fall back to the offline, source-cited answer so the demo never breaks.
    if (error instanceof Anthropic.AuthenticationError) console.error("[assistant] invalid ANTHROPIC_API_KEY");
    else if (error instanceof Anthropic.RateLimitError) console.error("[assistant] rate limited");
    else if (error instanceof Anthropic.APIError) console.error(`[assistant] API error ${error.status}: ${error.message}`);
    else console.error("[assistant]", error);
    return NextResponse.json(offlineAnswer(body));
  }
}
