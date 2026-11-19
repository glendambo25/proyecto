"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleAlert, Lock, MessageCircle, ShieldAlert, Sparkles } from "lucide-react";
import { formatDate, getDestination, isBlocked, unlocksOf } from "@/lib/content";
import { daysFromArrival, dueDay } from "@/lib/chart";
import { DesignSwitch, type DesignVariant } from "@/lib/design";
import { statusOf, useApp } from "@/lib/store";
import type { Task } from "@/lib/types";
import Contours from "./chart/Contours";

type Tab = "Summary" | "Documents" | "Help";

/** Step detail in either direction: "chart" (creative) or "minimal". Same content and functions. */
export default function StepView({ id, variant }: { id: string; variant: DesignVariant }) {
  const { profile, checklist, statuses, completedOn, setStatus, log } = useApp();
  const [tab, setTab] = useState<Tab>("Summary");
  const [requested, setRequested] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  if (!profile) return null;
  const task = checklist.find((t) => t.id === id);
  const chart = variant === "chart";

  if (!task)
    return (
      <main className="px-5 pt-8">
        <Link href="/tasks" className="text-[14px] font-semibold text-accent">
          ← Checklist
        </Link>
        <h1 className="mt-6 text-[28px] font-bold">Not in your checklist</h1>
        <p className="mt-2 text-ink-2">This step does not apply to your profile.</p>
      </main>
    );

  const dest = getDestination(profile.destinationId);
  const st = statusOf(statuses, task.id);
  const blocked = isBlocked(task, statuses);
  const needs = task.dependsOn.map((d) => checklist.find((t) => t.id === d)).filter(Boolean) as Task[];
  const unlocks = unlocksOf(task, checklist);
  const n = checklist.indexOf(task) + 1;
  const due = dueDay(task, profile.arrivalDate);
  const today = daysFromArrival(profile.arrivalDate);
  const overdue = due != null && st !== "completed" && today > due;
  const lockedPending = st === "pending" && blocked;
  const unfinished = needs.filter((x) => statusOf(statuses, x.id) !== "completed").map((x) => x.title);
  const disabledBtn = "flex-1 cursor-not-allowed rounded-full border border-dashed border-line bg-card px-5 py-3.5 text-[15px] font-semibold text-ink-3";
  const sources = [
    { name: task.officialSourceName, url: task.officialSourceUrl, date: task.lastVerified, ok: task.verificationStatus === "verified" && !!task.officialSourceUrl },
    ...(task.extraSources ?? []).map((s) => ({ name: s.name, url: s.url as string | null, date: s.lastVerified as string | null, ok: true })),
  ];

  const statusText = st === "completed" ? `Done${completedOn[task.id] ? ` · ${formatDate(completedOn[task.id])}` : ""}` : st === "in_progress" ? "In progress" : blocked ? "Waiting for an earlier step" : "Ready to start";

  return (
    <main className={chart ? "relative" : "font-ui"}>
      <header className={`relative overflow-hidden px-5 pb-6 pt-5 lg:px-8 lg:pt-8 ${chart ? "" : "border-b border-line"}`}>
        {chart && <Contours levels={7} cx={0.9} cy={0.1} />}
        <div className="relative flex items-center justify-between">
          <Link href="/tasks" className="inline-flex items-center gap-1.5 rounded-full py-1.5 pr-2 text-[14px] font-semibold text-ink-2 hover:text-ink">
            <ArrowLeft size={16} /> Checklist
          </Link>
          <DesignSwitch />
        </div>
        {chart ? (
          <div className="relative mt-6 flex items-end gap-4">
            <span className="tabular text-[88px] font-extrabold leading-[0.8] tracking-[-0.04em] text-accent [font-stretch:75%]">{String(n).padStart(2, "0")}</span>
            <div className="min-w-0 pb-1">
              <h1 className="text-[28px] font-extrabold leading-[1.05] tracking-[-0.015em] [font-stretch:108%] lg:text-[40px]">{task.title}</h1>
              {task.localName && <p className="mt-1 text-[14px] text-ink-2">{task.localName}</p>}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.01em] lg:text-[32px]">{task.title}</h1>
            <p className="mt-1 text-[15px] text-ink-2">
              {task.localName ? `${task.localName} · ` : ""}Step {n} of {checklist.length}
            </p>
          </div>
        )}
        <p className={`relative mt-4 inline-flex items-center gap-2 text-[14px] font-semibold ${st === "completed" ? "text-ok" : st === "in_progress" ? "text-accent" : blocked ? "text-ink-3" : "text-ink"}`}>
          <span className={`h-2 w-2 rounded-full ${st === "completed" ? "bg-ok" : st === "in_progress" ? "bg-accent" : blocked ? "bg-ink-3" : "bg-ink"}`} />
          {statusText}
        </p>
      </header>

      <div className="px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12 lg:px-8">
        <div className="space-y-6 pt-6">
          {/* Order: what it waits for and what it opens */}
          {chart ? (
            <section aria-label="Order" className="relative">
              <ChainChart needs={needs} task={task} unlocks={unlocks} />
            </section>
          ) : (
            <section aria-label="Order" className="grid grid-cols-2 gap-6 text-[14px]">
              <div>
                <h2 className="mb-2 text-[13px] text-ink-3">Needs first</h2>
                {needs.length ? needs.map((x) => <ChainLink key={x.id} t={x} done={statusOf(statuses, x.id) === "completed"} />) : <p className="text-ink-2">Nothing. Start now.</p>}
              </div>
              <div>
                <h2 className="mb-2 text-[13px] text-ink-3">Unlocks</h2>
                {unlocks.length ? unlocks.map((x) => <ChainLink key={x.id} t={x} />) : <p className="text-ink-3">Nothing else</p>}
              </div>
            </section>
          )}

          {task.warning && (
            <p className="flex gap-2.5 rounded-2xl bg-stamp-soft px-4 py-3 text-[14px] font-medium text-stamp">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" /> {task.warning}
            </p>
          )}

          <div role="tablist" aria-label="Step sections" className="flex gap-6 border-b border-line">
            {(["Summary", "Documents", "Help"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-2.5 text-[14px] font-semibold transition-colors duration-150 ${tab === t ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Summary" && (
            <section className="space-y-5">
              <p className={`max-w-[65ch] leading-relaxed text-ink ${chart ? "text-[17px]" : "text-[16px]"}`}>{task.description}</p>
              <ol className="space-y-3">
                {task.steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-[15px]">
                    <span className={`tabular w-5 shrink-0 font-semibold ${chart ? "text-accent" : "text-ink-3"}`}>{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {tab === "Documents" && (
            <ul className="divide-y divide-line border-y border-line">
              {task.documentsNeeded.map((d) => {
                const on = checked.includes(d);
                return (
                  <li key={d}>
                    <button onClick={() => setChecked(on ? checked.filter((x) => x !== d) : [...checked, d])} aria-pressed={on} className="flex w-full items-center gap-3 py-3 text-left text-[15px]">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-150 ${on ? "border-ok bg-ok text-white" : "border-ink-3"}`}>{on && <Check size={12} strokeWidth={3} />}</span>
                      <span className={on ? "text-ink-3 line-through" : ""}>{d}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {tab === "Help" && (
            <ul className="divide-y divide-line border-y border-line text-[15px]">
              <li>
                <Link href={`/chat/assistant?q=${encodeURIComponent(`What do I need for: ${task.title}?`)}`} className="flex items-center gap-3 py-3.5 font-medium hover:text-accent">
                  <Sparkles size={18} className="text-accent" /> <span className="flex-1">Ask the assistant about this step</span> <ArrowRight size={16} className="text-ink-3" />
                </Link>
              </li>
              <li>
                <Link href="/chat" className="flex items-center gap-3 py-3.5 font-medium hover:text-accent">
                  <MessageCircle size={18} className="text-accent" /> <span className="flex-1">Talk to a mentor or the international office</span> <ArrowRight size={16} className="text-ink-3" />
                </Link>
              </li>
              {task.category === "Accommodation" &&
                dest.housingAlert.map((a) => (
                  <li key={a} className="flex gap-3 py-3 text-[14px] text-ink-2">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0 text-stamp" /> {a}
                  </li>
                ))}
            </ul>
          )}

          <div className="flex gap-2 pb-2 lg:max-w-md">
            {st !== "completed" ? (
              <>
                {st === "pending" && (
                  <button
                    onClick={() => setStatus(task.id, "in_progress")}
                    disabled={lockedPending}
                    className={lockedPending ? disabledBtn : "flex-1 rounded-full border border-line bg-card px-5 py-3.5 text-[15px] font-semibold transition-colors duration-150 hover:border-ink"}
                  >
                    Start
                  </button>
                )}
                <button
                  onClick={() => setStatus(task.id, "completed")}
                  disabled={lockedPending}
                  className={
                    lockedPending
                      ? `${disabledBtn} flex items-center justify-center gap-2`
                      : "flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-accent"
                  }
                >
                  {lockedPending ? <Lock size={15} /> : <Check size={16} />} Mark as done
                </button>
              </>
            ) : (
              <button onClick={() => setStatus(task.id, "pending")} className="flex-1 rounded-full border border-line bg-card px-5 py-3.5 text-[15px] font-semibold hover:border-ink">
                Undo
              </button>
            )}
          </div>
          {lockedPending && (
            <p className="flex items-start gap-1.5 text-[13px] text-ink-2">
              <Lock size={12} className="mt-0.5 shrink-0" /> Finish: {unfinished.join(", ")}
            </p>
          )}
        </div>

        <aside className="space-y-5 pb-6 pt-6 lg:sticky lg:top-6">
          <dl className={`grid grid-cols-3 gap-3 ${chart ? "" : "border-y border-line py-4"}`}>
            {[
              ["Time", task.estimatedTime],
              ["Cost", task.cost],
              ["Deadline", task.deadline ?? "None set"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px] text-ink-3">{k}</dt>
                <dd className={`mt-0.5 text-[13.5px] font-semibold leading-snug ${k === "Deadline" && task.deadline ? (overdue ? "text-stamp" : "text-ink") : ""}`}>{v}</dd>
              </div>
            ))}
          </dl>

          {chart && due != null && <DeadlineScale due={due} today={today} done={st === "completed"} />}

          <section aria-label="Official sources" className="space-y-2">
            {sources.map((s) =>
              s.url ? (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className={`group flex items-start gap-3 rounded-2xl border p-3.5 transition-colors duration-150 hover:border-ink ${s.ok ? "border-line bg-card" : "border-dashed border-stamp/50 bg-card"}`}>
                  <SourceMark ok={s.ok} chart={chart} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold leading-snug">{s.name}</span>
                    <span className={`block text-[12.5px] ${s.ok ? "text-accent" : "text-stamp"}`}>{s.ok ? `Official source · verified ${formatDate(s.date)}` : "Not verified yet"}</span>
                  </span>
                  <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-ink-3 group-hover:text-ink" />
                </a>
              ) : (
                <div key={s.name} className="flex items-start gap-3 rounded-2xl border border-dashed border-stamp/50 bg-card p-3.5">
                  <SourceMark ok={false} chart={chart} />
                  <span>
                    <span className="block text-[14px] font-semibold">No verified official source yet</span>
                    <span className="block text-[12.5px] text-stamp">TODO: verify</span>
                  </span>
                </div>
              ),
            )}
            {task.todo && <p className="text-[12.5px] leading-relaxed text-ink-3">{task.todo}</p>}
          </section>

          {task.doneForYouAvailable && st !== "completed" && (
            <section className={`rounded-3xl p-5 ${chart ? "bg-accent text-white" : "border border-line bg-card"}`}>
              <h2 className="text-[18px] font-bold">No time? We can do it for you.</h2>
              <p className={`mt-1 text-[14px] ${chart ? "text-white/85" : "text-ink-2"}`}>A partner advisor handles this step end to end. Demo: no payment is taken.</p>
              {requested ? (
                <p className={`mt-4 text-[14px] font-semibold ${chart ? "" : "text-ok"}`}>Request registered. A partner would contact you (simulated).</p>
              ) : (
                <button
                  onClick={() => {
                    setRequested(true);
                    log("done_for_you_request", { taskId: task.id, destination: dest.id });
                  }}
                  className={`mt-4 w-full rounded-full px-5 py-3 text-[15px] font-semibold transition-colors duration-150 ${chart ? "bg-white text-accent hover:bg-accent-soft" : "bg-ink text-white hover:bg-accent"}`}
                >
                  Do it for me
                </button>
              )}
              <Link href="/plans" className={`mt-3 block text-center text-[13px] underline underline-offset-4 ${chart ? "text-white/80" : "text-ink-3"}`}>
                See plans
              </Link>
            </section>
          )}
        </aside>
      </div>
    </main>
  );

  function ChainLink({ t, done }: { t: Task; done?: boolean }) {
    return (
      <Link href={`/tasks/${t.id}`} className="mb-1.5 flex items-center gap-1.5 font-medium hover:text-accent">
        {done === undefined ? <ArrowRight size={14} className="text-accent" /> : done ? <Check size={14} className="text-ok" /> : <Lock size={13} className="text-ink-3" />}
        {t.title}
      </Link>
    );
  }

  /** Signature: the step on its little stretch of route, arcs from what it needs to what it opens. */
  function ChainChart({ needs, task, unlocks }: { needs: Task[]; task: Task; unlocks: Task[] }) {
    const rows = Math.max(needs.length, unlocks.length, 1);
    const H = rows * 44 + 16;
    const y = (i: number, total: number) => (total ? 8 + (H - 16) * ((i + 0.5) / total) : H / 2);
    return (
      <div className="grid grid-cols-[1fr_88px_1fr] items-stretch">
        <div className="flex flex-col justify-around pr-3 text-right text-[14px] leading-snug" style={{ minHeight: H }}>
          {needs.length ? (
            needs.map((x) => (
              <Link key={x.id} href={`/tasks/${x.id}`} className={`font-semibold hover:text-accent ${statusOf(statuses, x.id) === "completed" ? "text-ok" : ""}`}>
                {x.title}
              </Link>
            ))
          ) : (
            <span className="font-hand text-[22px] text-accent">nothing before, start now</span>
          )}
        </div>
        <svg viewBox={`0 0 88 ${H}`} className="h-full w-full" style={{ minHeight: H }} aria-hidden>
          {needs.map((x, i) => (
            <path key={x.id} d={`M6 ${y(i, needs.length)} C 30 ${y(i, needs.length)}, 30 ${H / 2}, 35 ${H / 2}`} fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray={statusOf(statuses, x.id) === "completed" ? undefined : "4 4"} />
          ))}
          {unlocks.map((x, i) => (
            <path key={x.id} d={`M53 ${H / 2} C 58 ${H / 2}, 58 ${y(i, unlocks.length)}, 82 ${y(i, unlocks.length)}`} fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray={statusOf(statuses, task.id) === "completed" ? undefined : "4 4"} />
          ))}
          <circle cx="44" cy={H / 2} r="9" fill={statusOf(statuses, task.id) === "completed" ? "#16a34a" : "#fff"} stroke="#111827" strokeWidth="2" />
        </svg>
        <div className="flex flex-col justify-around pl-3 text-[14px] leading-snug" style={{ minHeight: H }}>
          {unlocks.length ? (
            unlocks.map((x) => (
              <Link key={x.id} href={`/tasks/${x.id}`} className="font-semibold hover:text-accent">
                {x.title}
              </Link>
            ))
          ) : (
            <span className="text-ink-3">opens nothing else</span>
          )}
        </div>
      </div>
    );
  }
}

function SourceMark({ ok, chart }: { ok: boolean; chart: boolean }) {
  return (
    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${ok ? (chart ? "bg-accent text-white" : "bg-accent-soft text-accent") : "bg-stamp-soft text-stamp"}`}>
      {ok ? <Check size={14} strokeWidth={3} /> : <CircleAlert size={14} />}
    </span>
  );
}

/** Day scale for steps with an official deadline rule: landing (0), today, and the due day. */
function DeadlineScale({ due, today, done }: { due: number; today: number; done: boolean }) {
  const max = Math.max(due, today, 1) + 4;
  const min = Math.min(0, today) - 2;
  const pos = (d: number) => `${((d - min) / (max - min)) * 100}%`;
  const overdue = !done && today > due;
  // Sort by position and alternate labels above/below the line so neighbours never collide.
  const marks = [
    { d: 0, label: "landing", cls: "bg-ink" },
    { d: due, label: `day +${due}`, cls: done ? "bg-ok" : overdue ? "bg-stamp" : "bg-accent" },
    { d: today, label: "today", cls: "bg-ink-2" },
  ].sort((a, b) => a.d - b.d);
  return (
    <figure className="rounded-2xl border border-line bg-card p-4">
      <figcaption className="text-[13px] font-semibold">Deadline on your day scale</figcaption>
      <div className="relative mt-3 h-16">
        <div className="absolute inset-x-0 top-8 h-px bg-ink/20" />
        <div className={`absolute top-7 h-2 rounded-full ${overdue ? "bg-stamp/20" : "bg-accent/15"}`} style={{ left: pos(0), width: `calc(${pos(due)} - ${pos(0)})` }} />
        {marks.map((m, i) => {
          const above = i % 2 === 1;
          return (
            <div key={m.label} className="absolute top-0 h-16 -translate-x-1/2" style={{ left: pos(m.d) }}>
              <span className={`absolute left-1/2 top-5 block h-6 w-[3px] -translate-x-1/2 rounded-full ${m.cls}`} />
              <span className={`tabular absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-ink-2 ${above ? "top-0" : "top-12"}`}>{m.label}</span>
            </div>
          );
        })}
      </div>
      <p className={`mt-2 font-hand text-[22px] leading-6 ${overdue ? "text-stamp" : done ? "text-ok" : "text-accent"}`}>{done ? "done in time" : overdue ? "past the deadline: ask an advisor" : `${due - today} days left`}</p>
    </figure>
  );
}
