"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleAlert, MessageCircle, ShieldAlert, Sparkles, Undo2 } from "lucide-react";
import { formatDate, getDestination, unlocksOf } from "@/lib/content";
import { daysFromArrival, dueDay } from "@/lib/chart";
import type { DesignVariant } from "@/lib/design";
import { statusOf, useApp } from "@/lib/store";
import type { Task } from "@/lib/types";
import { blockersOf, rowState } from "@/lib/ux/guide";
import { StateIcon, useStateLabel } from "./ux/StepBits";

/** Isolate an LTR value (date, code) inside translated text so it never reorders in RTL languages. */
const bidi = (v: string) => `⁨${v}⁩`;

/** Step detail. Order on screen follows the question a student has: can I do it, what do I do, what do I bring, who says so. */
export default function StepView({ id, variant }: { id: string; variant: DesignVariant }) {
  const { profile, checklist, statuses, completedOn, setStatus, log, docs, toggleDoc } = useApp();
  const t = useTranslations("step");
  const tc = useTranslations("common");
  const ta = useTranslations("a11y");
  const stateLabel = useStateLabel();
  const [requested, setRequested] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    setJustDone(false);
    setAnnounce("");
  }, [id]);
  if (!profile) return null;
  const task = checklist.find((t) => t.id === id);
  const chart = variant === "chart";

  if (!task)
    return (
      <main className="px-5 pt-6">
        <Link href="/tasks" className="inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-semibold text-accent">
          <ArrowLeft size={16} className="flip-rtl" aria-hidden /> {t("back")}
        </Link>
        <h1 className="mt-6 text-[28px] font-extrabold">{t("notFound.title")}</h1>
        <p className="mt-2 text-[15px] text-ink-2">{t("notFound.body")}</p>
      </main>
    );

  const dest = getDestination(profile.destinationId);
  const st = statusOf(statuses, task.id);
  const state = rowState(task, statuses);
  const locked = state === "locked";
  const blockers = blockersOf(task, checklist, statuses);
  const needs = task.dependsOn.map((d) => checklist.find((t) => t.id === d)).filter((t): t is Task => !!t);
  const unlocks = unlocksOf(task, checklist);
  const n = checklist.indexOf(task) + 1;
  const due = dueDay(task, profile.arrivalDate);
  const today = daysFromArrival(profile.arrivalDate);
  const overdue = due != null && st !== "completed" && today > due;
  const verified = task.verificationStatus === "verified" && !!task.officialSourceUrl;
  const sources = [
    { name: task.officialSourceName, url: task.officialSourceUrl, date: task.lastVerified, ok: verified },
    ...(task.extraSources ?? []).map((s) => ({ name: s.name, url: s.url as string | null, date: s.lastVerified as string | null, ok: true })),
  ];
  const opened = unlocks.filter((u) => rowState(u, statuses) !== "locked");
  const docsReady = task.documentsNeeded.filter((d) => docs.includes(d)).length;

  function change(next: "pending" | "in_progress" | "completed") {
    setStatus(task!.id, next);
    if (next === "completed") {
      setJustDone(true);
      const opened = unlocks.filter((u) => u.dependsOn.every((d) => d === task!.id || statuses[d] === "completed"));
      setAnnounce(t("announce.done", { title: task!.title }) + (opened.length ? t("announce.opened", { steps: opened.map((u) => u.title).join(", ") }) : ""));
    } else {
      setJustDone(false);
      setAnnounce(next === "in_progress" ? t("announce.started", { title: task!.title }) : t("announce.reopened", { title: task!.title }));
    }
  }

  const pill =
    state === "done" ? "bg-ok-soft text-ok" : state === "doing" ? "bg-accent-soft text-accent" : state === "locked" ? "border border-dashed border-ink-3 text-ink-2" : "bg-paper-2 text-ink";

  return (
    <main className={chart ? "relative" : "font-ui"}>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <header className="px-5 pb-2 pt-4 lg:px-8 lg:pt-8">
        <Link href="/tasks" className="-ms-1 inline-flex min-h-[44px] items-center gap-1.5 px-1 text-[15px] font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft size={18} className="flip-rtl" aria-hidden /> {t("back")}
        </Link>
        <p className="mt-3 text-[14px] text-ink-3">
          {t("position", { n, total: checklist.length })}
          {task.localName ? ` · ${task.localName}` : ""}
        </p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-[1.08] tracking-[-0.02em] [font-stretch:108%] lg:text-[40px]">{task.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold ${pill}`}>
            <StateIcon state={state} size={14} />
            {state === "done" && completedOn[task.id] ? t("doneOn", { date: bidi(formatDate(completedOn[task.id])) }) : stateLabel(state)}
          </span>
          {/* Source and date: always visible, deliberately quiet. Full cards below. */}
          <a href="#sources" className={`inline-flex min-h-[28px] items-center gap-1 text-[13px] ${verified ? "text-ink-3 hover:text-ink" : "text-stamp"}`}>
            {verified ? <Check size={13} aria-hidden /> : <CircleAlert size={13} aria-hidden />}
            {verified ? tc("verifiedSource", { date: bidi(formatDate(task.lastVerified)) }) : t("notVerified")}
          </a>
        </div>
      </header>

      <div className="px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12 lg:px-8">
        <div className="space-y-7 pt-4">
          {locked && (
            <section aria-labelledby="locked-title" className="rounded-2xl border border-dashed border-ink-3 p-4">
              <h2 id="locked-title" className="text-[16px] font-bold">
                {t("locked.title", { count: blockers.length })}
              </h2>
              <p className="mt-1 text-[14px] text-ink-2">{t("locked.body", { count: blockers.length })}</p>
              <ul className="mt-2">
                {blockers.map((b) => (
                  <li key={b.id}>
                    <Link href={`/tasks/${b.id}`} className="flex min-h-[48px] items-center gap-3 font-semibold hover:text-accent">
                      <StateIcon state={rowState(b, statuses)} size={20} />
                      <span className="flex-1">{b.title}</span>
                      <ArrowRight size={16} className="flip-rtl text-ink-3" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {task.warning && (
            <p className="flex gap-2.5 rounded-2xl bg-stamp-soft px-4 py-3 text-[14.5px] font-medium text-stamp">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden /> {task.warning}
            </p>
          )}

          <p className={`max-w-[65ch] leading-relaxed text-ink ${chart ? "text-[17px]" : "text-[16px]"}`}>{task.description}</p>

          <section aria-labelledby="todo-title">
            <h2 id="todo-title" className="text-[18px] font-bold">
              {t("whatToDo")}
            </h2>
            <ol className="mt-3 space-y-3">
              {task.steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-[15.5px] leading-snug">
                  <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-bold text-accent" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </section>

          {task.documentsNeeded.length > 0 && (
            <section aria-labelledby="docs-title">
              <div className="flex items-baseline justify-between">
                <h2 id="docs-title" className="text-[18px] font-bold">
                  {t("whatYouNeed")}
                </h2>
                <span className="tabular text-[13.5px] text-ink-3">{t("docsReady", { ready: docsReady, total: task.documentsNeeded.length })}</span>
              </div>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {task.documentsNeeded.map((d) => {
                  const on = docs.includes(d);
                  return (
                    <li key={d}>
                      <label className="flex min-h-[48px] cursor-pointer items-center gap-3 py-2 text-[15px]">
                        <input type="checkbox" checked={on} onChange={() => toggleDoc(d)} className="peer sr-only" />
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${on ? "border-ok bg-ok text-white" : "border-ink-3"}`}
                          aria-hidden
                        >
                          {on && <Check size={14} strokeWidth={3} className="pop" />}
                        </span>
                        <span className={on ? "text-ink-3 line-through" : ""}>{d}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {(needs.length > 0 || unlocks.length > 0) && (
            <section aria-labelledby="order-title" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <h2 id="order-title" className="sr-only">
                {t("order")}
              </h2>
              <div>
                <h3 className="text-[14px] font-semibold text-ink-3">{t("needsFirst")}</h3>
                {needs.length ? (
                  <ul className="mt-1">
                    {needs.map((x) => (
                      <li key={x.id}>
                        <Link href={`/tasks/${x.id}`} className="flex min-h-[44px] items-center gap-2.5 text-[15px] font-medium hover:text-accent">
                          <StateIcon state={rowState(x, statuses)} size={18} /> {x.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[15px] text-ink-2">{t("nothingFirst")}</p>
                )}
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-ink-3">{t("unlocks")}</h3>
                {unlocks.length ? (
                  <ul className="mt-1">
                    {unlocks.map((x) => (
                      <li key={x.id}>
                        <Link href={`/tasks/${x.id}`} className="flex min-h-[44px] items-center gap-2.5 text-[15px] font-medium hover:text-accent">
                          <ArrowRight size={16} className="flip-rtl shrink-0 text-accent" aria-hidden /> {x.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[15px] text-ink-3">{t("unlocksNothing")}</p>
                )}
              </div>
            </section>
          )}

          <section aria-label={t("help")} className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/chat/assistant?q=${encodeURIComponent(t("askQuestion", { title: task.title }))}`}
              className="flex min-h-[48px] flex-1 items-center gap-2.5 rounded-2xl border border-line bg-card px-4 text-[15px] font-semibold hover:border-ink"
            >
              <Sparkles size={18} className="text-accent" aria-hidden /> {t("ask")}
            </Link>
            <Link href="/chat" className="flex min-h-[48px] flex-1 items-center gap-2.5 rounded-2xl border border-line bg-card px-4 text-[15px] font-semibold hover:border-ink">
              <MessageCircle size={18} className="text-accent" aria-hidden /> {t("talk")}
            </Link>
          </section>

          {task.category === "Accommodation" && (
            <ul className="space-y-2 rounded-2xl bg-stamp-soft p-4 text-[14px] text-ink" aria-label={t("housing")}>
              {dest.housingAlert.map((a) => (
                <li key={a} className="flex gap-2.5">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-stamp" aria-hidden /> {a}
                </li>
              ))}
            </ul>
          )}

          {/* Action bar: stays in reach above the tab bar while reading. */}
          <div className="sticky bottom-[72px] z-30 -mx-5 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
            {justDone && st === "completed" ? (
              <div className="pop flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ok text-white" aria-hidden>
                  <Check size={20} strokeWidth={3} />
                </span>
                <p className="min-w-0 flex-1 text-[14.5px]">
                  <span className="block font-semibold">{t("done.title")}</span>
                  {opened.length > 0 ? (
                    <span className="text-ink-2">{t("done.nowOpen", { steps: opened.map((u) => u.title).join(", ") })}</span>
                  ) : unlocks.length > 0 ? (
                    <span className="text-ink-2">{t("done.stillNeeds", { step: unlocks[0].title, count: blockersOf(unlocks[0], checklist, statuses).length })}</span>
                  ) : (
                    <span className="text-ink-2">{t("done.oneLess")}</span>
                  )}
                </p>
                <Link href="/home" className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-full bg-ink px-4 text-[14.5px] font-semibold text-white hover:bg-accent">
                  {t("actions.next")} <ArrowRight size={16} className="flip-rtl" aria-hidden />
                </Link>
              </div>
            ) : st === "completed" ? (
              <button onClick={() => change("pending")} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line bg-card px-5 text-[15px] font-semibold hover:border-ink lg:max-w-xs">
                <Undo2 size={16} aria-hidden /> {t("actions.undoDone")}
              </button>
            ) : locked ? (
              <p className="text-[14.5px] text-ink-2">{t("actions.lockedUntil", { steps: blockers.map((b) => b.title).join(" + ") })}</p>
            ) : (
              <div className="flex gap-2 lg:max-w-md">
                {st === "pending" && (
                  <button onClick={() => change("in_progress")} className="min-h-[52px] flex-1 rounded-full border border-line bg-card px-5 text-[15.5px] font-semibold transition-colors duration-150 hover:border-ink">
                    {t("actions.started")}
                  </button>
                )}
                <button
                  onClick={() => change("completed")}
                  className="flex min-h-[52px] flex-[1.3] items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15.5px] font-semibold text-white transition-colors duration-150 hover:bg-accent"
                >
                  <Check size={18} aria-hidden /> {t("actions.markDone")}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5 pb-6 pt-8 lg:sticky lg:top-6 lg:pt-4">
          <dl className="grid grid-cols-3 gap-3 border-y border-line py-4">
            {(
              [
                ["time", task.estimatedTime],
                ["cost", task.cost],
                ["deadline", task.deadline ?? t("facts.none")],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[13px] text-ink-3">{t(`facts.${k}`)}</dt>
                <dd className={`mt-0.5 break-words text-[14px] font-semibold leading-snug ${k === "deadline" && task.deadline && overdue ? "text-stamp" : ""}`}>{v}</dd>
              </div>
            ))}
          </dl>

          {chart && due != null && <DeadlineScale due={due} today={today} done={st === "completed"} />}

          <section id="sources" aria-labelledby="sources-title" className="scroll-mt-6 space-y-2">
            <h2 id="sources-title" className="text-[14px] font-semibold text-ink-3">
              {t("sources.title")}
            </h2>
            {sources.map((s) =>
              s.url ? (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className={`group flex items-start gap-3 rounded-2xl border p-3.5 transition-colors duration-150 hover:border-ink ${s.ok ? "border-line bg-card" : "border-dashed border-stamp/50 bg-card"}`}>
                  <SourceMark ok={s.ok} />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[14px] font-semibold leading-snug">{s.name}</span>
                    <span className={`block text-[13px] ${s.ok ? "text-accent" : "text-stamp"}`}>{s.ok ? tc("verifiedSource", { date: bidi(formatDate(s.date)) }) : t("sources.notVerified")}</span>
                  </span>
                  <ArrowUpRight size={16} className="flip-rtl mt-0.5 shrink-0 text-ink-3 group-hover:text-ink" aria-hidden />
                  <span className="sr-only">{ta("newTab")}</span>
                </a>
              ) : (
                <div key={s.name} className="flex items-start gap-3 rounded-2xl border border-dashed border-stamp/50 bg-card p-3.5">
                  <SourceMark ok={false} />
                  <span>
                    <span className="block text-[14px] font-semibold">{t("sources.none")}</span>
                    <span className="block text-[13px] text-stamp">{tc("todoVerify")}</span>
                  </span>
                </div>
              ),
            )}
            {task.todo && <p className="text-[13px] leading-relaxed text-ink-3">{task.todo}</p>}
          </section>

          {task.doneForYouAvailable && st !== "completed" && (
            <section className="rounded-3xl border border-line bg-card p-5">
              <h2 className="text-[17px] font-bold">{t("dfy.title")}</h2>
              <p className="mt-1 text-[14px] text-ink-2">{t("dfy.body")}</p>
              {requested ? (
                <p className="mt-4 text-[14px] font-semibold text-ok" role="status">
                  {t("dfy.requested")}
                </p>
              ) : (
                <button
                  onClick={() => {
                    setRequested(true);
                    log("done_for_you_request", { taskId: task.id, destination: dest.id });
                  }}
                  className="mt-4 min-h-[48px] w-full rounded-full border border-ink px-5 text-[15px] font-semibold transition-colors duration-150 hover:bg-ink hover:text-white"
                >
                  {t("dfy.cta")}
                </button>
              )}
              <Link href="/plans" className="mt-2 flex min-h-[44px] items-center justify-center text-[13.5px] text-ink-3 underline underline-offset-4">
                {t("dfy.plans")}
              </Link>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

function SourceMark({ ok }: { ok: boolean }) {
  return (
    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${ok ? "bg-accent-soft text-accent" : "bg-stamp-soft text-stamp"}`} aria-hidden>
      {ok ? <Check size={14} strokeWidth={3} /> : <CircleAlert size={14} />}
    </span>
  );
}

/** Day scale for steps with an official deadline rule: landing (0), today, and the due day. */
function DeadlineScale({ due, today, done }: { due: number; today: number; done: boolean }) {
  const t = useTranslations("step.scale");
  const max = Math.max(due, today, 1) + 4;
  const min = Math.min(0, today) - 2;
  const pos = (d: number) => `${((d - min) / (max - min)) * 100}%`;
  const overdue = !done && today > due;
  const marks = [
    { d: 0, label: t("arrival"), cls: "bg-ink" },
    { d: due, label: t("day", { n: due }), cls: done ? "bg-ok" : overdue ? "bg-stamp" : "bg-accent" },
    { d: today, label: t("today"), cls: "bg-ink-2" },
  ].sort((a, b) => a.d - b.d);
  const before = today < 0;
  return (
    <figure className="rounded-2xl border border-line bg-card p-4" dir="ltr">
      <figcaption className="text-[14px] font-semibold">
        {done ? t("doneInTime") : overdue ? t("overdue") : before ? t("dueAfter", { days: due }) : t("daysLeft", { days: due - today })}
      </figcaption>
      <div className="relative mt-3 h-16" aria-hidden>
        <div className="absolute inset-x-0 top-8 h-px bg-ink/20" />
        <div className={`absolute top-7 h-2 rounded-full ${overdue ? "bg-stamp/20" : "bg-accent/15"}`} style={{ left: pos(0), width: `calc(${pos(due)} - ${pos(0)})` }} />
        {marks.map((m, i) => {
          const above = i % 2 === 1;
          return (
            <div key={m.label} className="absolute top-0 h-16 -translate-x-1/2" style={{ left: pos(m.d) }}>
              <span className={`absolute left-1/2 top-5 block h-6 w-[3px] -translate-x-1/2 rounded-full ${m.cls}`} />
              <span className={`tabular absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-semibold text-ink-2 ${above ? "top-0" : "top-12"}`}>{m.label}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
