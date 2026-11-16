"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ArrowRight, Check, Clock3, Lock, MessageCircle, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { formatDate, getDestination, isBlocked, unlocksOf } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { Header, StatusBadge, Tabs, TaskSources } from "@/components/ui";

type Tab = "Summary" | "Documents" | "Help";

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile, checklist, statuses, completedOn, setStatus, log } = useApp();
  const [tab, setTab] = useState<Tab>("Summary");
  const [requested, setRequested] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  if (!profile) return null;
  const task = checklist.find((t) => t.id === id);
  if (!task)
    return (
      <main>
        <Header title="Not in your checklist" back="/tasks" subtitle="This step does not apply to your profile." />
      </main>
    );
  const dest = getDestination(profile.destinationId);
  const st = statusOf(statuses, task.id);
  const blocked = isBlocked(task, statuses);
  const needs = task.dependsOn.map((d) => checklist.find((t) => t.id === d)!).filter(Boolean);
  const unlocks = unlocksOf(task, checklist);
  const n = checklist.indexOf(task) + 1;

  return (
    <main>
      <Header back="/tasks" eyebrow={`Step ${String(n).padStart(2, "0")} · ${task.category}`} title={task.title} right={<StatusBadge status={st} blocked={blocked && st === "pending"} />} />
      {/* Mobile: one column in the order below. Desktop: content left, ticket + sources right (sticky). */}
      <div className="flex flex-col gap-5 px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          {task.localName && <p className="order-1 -mt-3 font-mono text-[12px] text-ink-3 lg:order-none">{task.localName}</p>}

          {st === "completed" && (
            <div className="order-2 flex items-center gap-3 rounded-[22px] bg-ok p-4 text-white lg:order-none">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
                <Check size={18} strokeWidth={3} />
              </span>
              <div>
                <p className="font-serif text-[22px] leading-tight">Done. One less thing.</p>
                {completedOn[task.id] && <p className="font-mono text-[11px] uppercase tracking-wider text-white/75">Completed on {formatDate(completedOn[task.id])}</p>}
              </div>
            </div>
          )}

          {task.warning && (
            <div className="order-5 flex gap-3 rounded-[22px] border border-stamp/30 bg-stamp-soft p-4 text-[13.5px] font-semibold text-stamp lg:order-none">
              <ShieldAlert size={18} className="shrink-0" /> {task.warning}
            </div>
          )}

          <div className="order-6 lg:order-none">
            <Tabs<Tab> options={["Summary", "Documents", "Help"]} value={tab} onChange={setTab} />
          </div>

          <div className="order-7 lg:order-none">
            {tab === "Summary" && (
              <section className="space-y-5">
                <p className="font-serif text-[21px] leading-[1.35] text-ink lg:text-[26px]">{task.description}</p>
                <div>
                  <p className="eyebrow mb-3">Next steps</p>
                  <ol className="space-y-3">
                    {task.steps.map((s, i) => (
                      <li key={s} className="flex gap-3 text-[14.5px] lg:text-[15.5px]">
                        <span className="font-mono text-[12px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}

            {tab === "Documents" && (
              <section className="card divide-y divide-line">
                {task.documentsNeeded.map((d) => {
                  const on = checked.includes(d);
                  return (
                    <button key={d} onClick={() => setChecked(on ? checked.filter((x) => x !== d) : [...checked, d])} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[14px]" aria-pressed={on}>
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${on ? "border-ink bg-ink text-paper" : "border-line"}`}>{on && <Check size={12} strokeWidth={3} />}</span>
                      <span className={on ? "text-ink-3 line-through" : ""}>{d}</span>
                    </button>
                  );
                })}
              </section>
            )}

            {tab === "Help" && (
              <section className="space-y-2">
                <Link href={`/chat/assistant?q=${encodeURIComponent(`What do I need for: ${task.title}?`)}`} className="card flex items-center gap-3 p-4 hover:border-ink">
                  <Sparkles size={18} className="text-accent" />
                  <span className="flex-1 text-[14px] font-semibold">Ask the assistant about this step</span>
                  <ArrowRight size={16} className="text-ink-3" />
                </Link>
                <Link href="/chat" className="card flex items-center gap-3 p-4 hover:border-ink">
                  <MessageCircle size={18} className="text-accent" />
                  <span className="flex-1 text-[14px] font-semibold">Talk to a mentor or the international office</span>
                  <ArrowRight size={16} className="text-ink-3" />
                </Link>
                {task.category === "Accommodation" && (
                  <div className="rounded-[22px] border border-stamp/30 bg-stamp-soft p-4 text-[13.5px] text-ink">
                    <p className="eyebrow mb-2 !text-stamp">Scam red flags · {dest.city}</p>
                    <ul className="space-y-2">
                      {dest.housingAlert.map((a) => (
                        <li key={a} className="flex gap-2">
                          <span className="text-stamp">—</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="order-8 flex gap-2 pt-2 lg:order-none lg:max-w-md">
            {st !== "completed" ? (
              <>
                {st === "pending" && (
                  <button className="btn-ghost flex-1" onClick={() => setStatus(task.id, "in_progress")} disabled={blocked}>
                    Start
                  </button>
                )}
                <button className="btn-primary flex-1" onClick={() => setStatus(task.id, "completed")}>
                  <Check size={16} /> Mark as done
                </button>
              </>
            ) : (
              <button className="btn-ghost flex-1" onClick={() => setStatus(task.id, "pending")}>
                Undo
              </button>
            )}
          </div>
          {blocked && st === "pending" && (
            <p className="order-9 flex items-center justify-center gap-1.5 font-mono text-[11px] text-ink-3 lg:order-none lg:justify-start">
              <Lock size={11} /> Finish “Needs first” before starting
            </p>
          )}
        </div>

        <aside className="contents lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-5">
          {/* Ticket stub: needs / unlocks */}
          <section className="card order-3 overflow-hidden lg:order-none">
            <div className="grid grid-cols-2 divide-x divide-dashed divide-line">
              <div className="p-4">
                <p className="eyebrow mb-2">Needs first</p>
                {needs.length ? (
                  needs.map((x) => (
                    <Link key={x.id} href={`/tasks/${x.id}`} className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold hover:text-accent">
                      {statusOf(statuses, x.id) === "completed" ? <Check size={13} className="text-ok" /> : <Lock size={12} className="text-stamp" />}
                      {x.title}
                    </Link>
                  ))
                ) : (
                  <p className="text-[13px] text-ink-2">Nothing — start now</p>
                )}
              </div>
              <div className="p-4">
                <p className="eyebrow mb-2">Unlocks</p>
                {unlocks.length ? (
                  unlocks.map((x) => (
                    <Link key={x.id} href={`/tasks/${x.id}`} className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold hover:text-accent">
                      <ArrowRight size={13} className="text-accent" />
                      {x.title}
                    </Link>
                  ))
                ) : (
                  <p className="text-[13px] text-ink-3">—</p>
                )}
              </div>
            </div>
            <div className="perf" />
            <dl className="grid grid-cols-3 gap-2 p-4">
              {[
                ["Time", task.estimatedTime],
                ["Cost", task.cost],
                ["Deadline", task.deadline ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="eyebrow">{k}</dt>
                  <dd className={`mt-1 text-[12.5px] font-semibold leading-snug ${k === "Deadline" && task.deadline ? "text-stamp" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="order-4 lg:order-none">
            <TaskSources task={task} />
          </div>

          {task.doneForYouAvailable && st !== "completed" && (
            <section className="order-10 overflow-hidden rounded-[26px] bg-ink p-5 text-paper lg:order-none">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/60">Done for you</p>
              <p className="mt-3 font-serif text-[28px] leading-[1.05]">
                No time? <em>We’ll handle it.</em>
              </p>
              <p className="mt-2 text-[13px] text-paper/70">A partner advisor takes care of this step end to end. Demo: no payment is taken.</p>
              {requested ? (
                <p className="mt-4 rounded-full bg-paper/10 px-4 py-3 text-center text-[13px] font-semibold">Request registered — a partner would contact you (simulated)</p>
              ) : (
                <button
                  className="btn mt-4 w-full bg-paper text-ink hover:bg-accent hover:text-white"
                  onClick={() => {
                    setRequested(true);
                    log("done_for_you_request", { taskId: task.id, destination: dest.id });
                  }}
                >
                  <Wallet size={16} /> Do it for me
                </button>
              )}
              <Link href="/plans" className="mt-3 block text-center font-mono text-[11px] uppercase tracking-wider text-paper/60 underline underline-offset-4">
                See plans
              </Link>
            </section>
          )}
          {task.deadline && st !== "completed" && (
            <p className="order-11 flex items-center justify-center gap-1.5 pb-2 font-mono text-[11px] text-stamp lg:order-none">
              <Clock3 size={11} /> {task.deadline}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
