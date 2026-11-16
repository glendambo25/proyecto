"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getDestination } from "@/lib/content";
import { useApp, type ChatMsg } from "@/lib/store";
import { Header, SourceBadge } from "@/components/ui";

const SUGGESTIONS = [
  "What do I need to register my address?",
  "In what order should I do my paperwork?",
  "How do I avoid housing scams?",
  "What do I have to do before I go back home?",
  "Which insurance do other students from my university choose?",
];

function Assistant() {
  const { profile, statuses, assistant, addAssistant, setHighlighted, log, checklist } = useApp();
  const params = useSearchParams();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const asked = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    if (!profile || !question.trim() || busy) return;
    setBusy(true);
    addAssistant({ role: "user", text: question });
    log("assistant_question", { channel: "text" });
    try {
      const history = assistant.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, destinationId: profile.destinationId, nationality: profile.nationality, purpose: profile.purpose, statuses, history }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "error");
      addAssistant({ role: "assistant", text: j.answer, sources: j.sources, covered: j.covered, offline: j.offline });
      if (j.missingTaskIds?.length) setHighlighted(j.missingTaskIds);
      log("assistant_answer", { covered: j.covered, offline: j.offline });
    } catch {
      addAssistant({ role: "assistant", text: "I couldn't reach the assistant right now. Please try again in a moment.", covered: false });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const q = params.get("q");
    if (q && !asked.current) {
      asked.current = true;
      ask(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistant.length, busy]);

  if (!profile) return null;
  const dest = getDestination(profile.destinationId);

  return (
    <main className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <Header title="AI assistant" subtitle={`Verified answers for ${dest.city} · 24/7`} back="/chat" />
      <div className="flex-1 space-y-3 px-4">
        <p className="rounded-xl bg-brand-soft p-3 text-xs text-navy">
          I answer only from official sources checked by the team, and show the date they were last verified. If I don’t have one, I’ll tell you and connect you with an advisor. You can also tap 🎙️ <b>Talk</b> to use your voice.
        </p>
        {assistant.length === 0 && (
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="card block w-full p-3 text-left text-sm font-semibold text-navy hover:ring-2 hover:ring-brand">
                {s}
              </button>
            ))}
          </div>
        )}
        {assistant.map((m: ChatMsg, i) =>
          m.role === "user" ? (
            <p key={i} className="ml-auto max-w-[85%] rounded-2xl bg-brand px-3 py-2 text-sm text-white">
              {m.text}
            </p>
          ) : (
            <div key={i} className="max-w-[92%] space-y-2 rounded-2xl bg-white p-3 text-sm shadow-sm">
              <p className="whitespace-pre-line leading-relaxed text-navy">{m.text}</p>
              {m.sources?.map((s) => (
                <SourceBadge key={s.taskId} compact name={s.name} url={s.url} lastVerified={s.lastVerified} status={s.verificationStatus} />
              ))}
              {m.covered === false && (
                <Link href="/chat/advisor" className="block text-xs font-semibold text-brand underline">
                  Contact a paperwork advisor →
                </Link>
              )}
              {m.sources?.length ? (
                <Link href="/home" className="block text-xs font-semibold text-gray-500 underline">
                  View flagged steps in your checklist
                </Link>
              ) : null}
              {m.offline && <p className="text-[10px] text-gray-400">Offline mode (no API key): answer built directly from the verified content.</p>}
            </div>
          ),
        )}
        {busy && <p className="w-fit animate-pulse rounded-2xl bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">Checking official sources…</p>}
        <div ref={bottom} />
      </div>
      <form
        className="sticky bottom-24 flex gap-2 bg-bg p-4"
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
          placeholder={`Ask about ${checklist[0]?.localName ?? "your paperwork"}…`}
          aria-label="Your question"
        />
        <button className="btn-primary" type="submit" disabled={busy} aria-label="Ask">
          ➤
        </button>
      </form>
    </main>
  );
}

export default function AssistantPage() {
  return (
    <Suspense>
      <Assistant />
    </Suspense>
  );
}
