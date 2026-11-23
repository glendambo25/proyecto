"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Check, Copy, Mic, RotateCcw, Sparkles, ThumbsDown, ThumbsUp, UserRoundCheck } from "lucide-react";
import { getDestination, isBlocked } from "@/lib/content";
import { statusOf, useApp, type ChatMsg } from "@/lib/store";
import { SourceBadge } from "@/components/ui";
import { requestAnswer } from "@/lib/assistant-client";

/** Reveals the latest answer progressively, like a live reply. */
function Typewriter({ text, active }: { text: string; active: boolean }) {
  const [n, setN] = useState(active ? 0 : text.length);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      i += Math.max(2, Math.round(text.length / 90));
      setN(Math.min(i, text.length));
      if (i >= text.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [text, active]);
  return <>{text.slice(0, n)}</>;
}

function Assistant() {
  const app = useApp();
  const { profile, statuses, assistant, addAssistant, setHighlighted, log, checklist, setStatus, setFeedback, clearAssistant } = app;
  const params = useSearchParams();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(-1);
  const [copied, setCopied] = useState(-1);
  const [failed, setFailed] = useState<string | null>(null);
  const asked = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  const dest = profile ? getDestination(profile.destinationId) : null;
  const suggestions = useMemo(() => {
    if (!dest) return [];
    const next = checklist.find((t) => t.phase !== "return" && statusOf(statuses, t.id) !== "completed" && !isBlocked(t, statuses));
    const withDeadline = checklist.find((t) => t.deadline && statusOf(statuses, t.id) !== "completed");
    const list = [
      { k: "Plan", q: "What's my next step, and in what order should I do the rest?" },
      next && { k: "Step", q: `What do I need for ${next.localName ?? next.title}?` },
      withDeadline && { k: "Deadline", q: `What is the deadline for ${withDeadline.localName ?? withDeadline.title}?` },
      { k: "Housing", q: `How do I avoid housing scams in ${dest.city}?` },
    ];
    return list.filter(Boolean) as { k: string; q: string }[];
  }, [checklist, statuses, dest]);

  async function ask(question: string) {
    if (!profile || !question.trim() || busy) return;
    setBusy(true);
    setFailed(null);
    addAssistant({ role: "user", text: question, ts: new Date().toISOString() });
    log("assistant_question", { channel: "text" });
    try {
      const history = assistant.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const j = await requestAnswer({ question, destinationId: profile.destinationId, nationality: profile.nationality, purpose: profile.purpose, statuses, history });
      setFresh(assistant.length + 1);
      addAssistant({ role: "assistant", text: j.answer, sources: j.sources, covered: j.covered, offline: j.offline, missingTaskIds: j.missingTaskIds, ts: new Date().toISOString() });
      if (j.missingTaskIds?.length) setHighlighted(j.missingTaskIds);
      log("assistant_answer", { covered: j.covered, offline: j.offline });
    } catch {
      setFailed(question);
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
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [assistant.length, busy]);

  if (!profile || !dest) return null;
  const startVoice = () => {
    log("voice_from_chat");
    window.VoiceAgent?.start();
  };

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-3xl flex-col">
      {/* header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-paper/90 px-5 py-3 backdrop-blur">
        <div className="flex-1">
          <p className="text-[18px] font-bold leading-tight">Ask</p>
          <p className="mt-0.5 text-[13px] text-ink-3">Answers only from official sources · {dest.city}</p>
        </div>
        {assistant.length > 0 && (
          <button onClick={clearAssistant} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card hover:border-ink" aria-label="New conversation" title="New conversation">
            <RotateCcw size={15} />
          </button>
        )}
        <button onClick={startVoice} className="grid h-11 w-11 place-items-center rounded-full bg-accent text-white hover:bg-ink" aria-label="Talk by voice" title="Talk by voice">
          <Mic size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-4 px-5 pt-5">
        {assistant.length === 0 && (
          <section className="rise">
            <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.02em] [font-stretch:108%]">What do you want to know?</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">Every answer shows the official page and the date we checked it. If there is no verified source, I will say so.</p>
            <ul className="mt-5 divide-y divide-line border-y border-line" aria-label="Suggested questions">
              {suggestions.map((s) => (
                <li key={s.q}>
                  <button onClick={() => ask(s.q)} className="group flex min-h-[56px] w-full items-center gap-3 py-2 text-start hover:text-accent">
                    <span className="flex-1 text-[15px] font-semibold leading-snug">{s.q}</span>
                    <ArrowRight size={16} className="flip-rtl shrink-0 text-ink-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {assistant.map((m: ChatMsg, i) =>
          m.role === "user" ? (
            <p key={i} className="ms-auto w-fit max-w-[82%] rounded-[20px] rounded-ee-md bg-ink px-4 py-2.5 text-[15px] text-paper">
              {m.text}
            </p>
          ) : (
            <article key={i} className="space-y-3" aria-live={i === fresh ? "polite" : undefined}>
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-white" aria-hidden>
                  <Sparkles size={13} />
                </span>
                <span className="eyebrow">{m.covered === false ? "No verified source for this yet" : "Answer"}</span>
              </div>
              <p className="whitespace-pre-line text-[15.5px] leading-relaxed text-ink">
                <Typewriter text={m.text} active={i === fresh} />
              </p>

              {m.sources && m.sources.length > 0 && (
                <div className="space-y-1.5">
                  {m.sources.map((s) => (
                    <SourceBadge key={s.taskId} compact name={s.name} url={s.url} lastVerified={s.lastVerified} status={s.verificationStatus} />
                  ))}
                </div>
              )}

              {m.missingTaskIds && m.missingTaskIds.length > 0 && (
                <div className="card overflow-hidden">
                  <p className="eyebrow border-b border-line px-4 py-2.5">Marked in your checklist</p>
                  <ul className="divide-y divide-line">
                    {m.missingTaskIds.slice(0, 5).map((id) => {
                      const t = checklist.find((x) => x.id === id);
                      if (!t) return null;
                      const done = statusOf(statuses, id) === "completed";
                      return (
                        <li key={id} className="flex items-center gap-3 px-4 py-2.5">
                          <Link href={`/tasks/${id}`} className={`flex-1 text-[13.5px] font-semibold hover:text-accent ${done ? "text-ink-3 line-through" : ""}`}>
                            {t.title}
                          </Link>
                          {done ? (
                            <span className="font-mono text-[10px] uppercase text-ok">Done</span>
                          ) : (
                            <button onClick={() => setStatus(id, "completed")} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider hover:border-ink">
                              <Check size={11} /> Done
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {m.covered === false && (
                <Link href="/chat/advisor" className="flex items-center gap-3 rounded-[20px] bg-stamp-soft p-3 text-[13.5px] font-semibold text-stamp">
                  <UserRoundCheck size={17} /> <span className="flex-1">Talk to a paperwork advisor</span> <ArrowRight size={15} />
                </Link>
              )}

              <div className="flex items-center gap-1 text-ink-3">
                <button onClick={() => setFeedback(i, "up")} className={`grid h-11 w-11 place-items-center rounded-full hover:bg-paper-2 ${m.feedback === "up" ? "text-ok" : ""}`} aria-label="Helpful">
                  <ThumbsUp size={14} />
                </button>
                <button onClick={() => setFeedback(i, "down")} className={`grid h-11 w-11 place-items-center rounded-full hover:bg-paper-2 ${m.feedback === "down" ? "text-stamp" : ""}`} aria-label="Not helpful">
                  <ThumbsDown size={14} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(m.text).catch(() => {});
                    setCopied(i);
                    setTimeout(() => setCopied(-1), 1500);
                  }}
                  className="grid h-11 w-11 place-items-center rounded-full hover:bg-paper-2"
                  aria-label="Copy answer"
                >
                  {copied === i ? <Check size={14} /> : <Copy size={14} />}
                </button>
                {m.offline && <span className="ms-auto text-[12px]">Offline mode</span>}
              </div>
            </article>
          ),
        )}

        {busy && (
          <div className="flex items-center gap-2" aria-live="polite">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-white" aria-hidden>
              <Sparkles size={13} />
            </span>
            <span className="flex gap-1" aria-hidden>
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: `${d * 120}ms` }} />
              ))}
            </span>
            <span className="text-[13.5px] text-ink-3">Checking official sources…</span>
          </div>
        )}
        {failed && !busy && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-stamp/30 bg-stamp-soft p-4 text-[14.5px]">
            <span className="flex-1 text-ink">Could not reach the assistant. Check your connection.</span>
            <button onClick={() => ask(failed)} className="min-h-[44px] rounded-full bg-ink px-4 font-semibold text-white hover:bg-accent">
              Try again
            </button>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div className="sticky bottom-[64px] lg:bottom-6 mt-4 space-y-2 bg-gradient-to-t from-paper via-paper to-transparent px-5 pt-4">
        {assistant.length > 0 && !busy && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {suggestions.slice(0, 4).map((s) => (
              <button key={s.q} onClick={() => ask(s.q)} className="min-h-[44px] shrink-0 rounded-full border border-line bg-card px-4 text-[13.5px] font-semibold hover:border-ink">
                {s.q}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
            setText("");
          }}
          className="flex items-center gap-2 rounded-full border border-line bg-card p-1.5 pl-4 shadow-[0_10px_30px_-15px_rgba(11,15,92,0.35)] focus-within:border-ink"
        >
          <input value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[16px] outline-none" placeholder="Ask about your paperwork…" aria-label="Your question" />
          <button type="button" onClick={startVoice} className="grid h-11 w-11 place-items-center rounded-full text-ink-2 hover:bg-paper" aria-label="Talk by voice">
            <Mic size={16} />
          </button>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper disabled:bg-paper-2 disabled:text-ink-3" type="submit" disabled={busy || !text.trim()} aria-label="Ask">
            <ArrowUp size={16} />
          </button>
        </form>
      </div>
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
