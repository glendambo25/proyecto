// Mints a short-lived OpenAI Realtime key for the browser (from voice-agent-kit/server/session.js).
// The real OPENAI_API_KEY never leaves the server. Optional: REALTIME_MODEL, REALTIME_VOICE.
// Before a public launch: put the logged-in-user check / rate limit here so strangers cannot spend credit.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  try {
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: process.env.REALTIME_MODEL || "gpt-realtime",
          audio: { output: { voice: process.env.REALTIME_VOICE || "marin" } },
        },
      }),
    });
    const j = await r.json();
    if (!r.ok) return NextResponse.json({ error: j.error?.message || "openai error" }, { status: r.status });
    return NextResponse.json({ value: j.value }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
