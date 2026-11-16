"use client";

import Link from "next/link";
import { use, useState } from "react";
import { formatDate, getDestination, isBlocked, unlocksOf } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { FilterChips, Header, StatusBadge, TaskSources } from "@/components/ui";

type Tab = "Summary" | "Documents" | "Help";

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile, checklist, statuses, completedOn, setStatus, log } = useApp();
  const [tab, setTab] = useState<Tab>("Summary");
  const [requested, setRequested] = useState(false);
  if (!profile) return null;
  const task = checklist.find((t) => t.id === id);
  if (!task)
    return (
      <main className="p-6">
        <Header title="Not in your checklist" back="/tasks" />
        <p className="px-4 text-sm text-gray-600">This step does not apply to your profile.</p>
      </main>
    );
  const dest = getDestination(profile.destinationId);
  const st = statusOf(statuses, task.id);
  const blocked = isBlocked(task, statuses);
  const needs = task.dependsOn.map((d) => checklist.find((t) => t.id === d)!).filter(Boolean);
  const unlocks = unlocksOf(task, checklist);

  return (
    <main>
      <Header title={task.title} subtitle={st === "completed" && completedOn[task.id] ? `Completed on ${formatDate(completedOn[task.id])}` : task.localName} back="/tasks" />
      <div className="space-y-4 px-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={st} blocked={blocked && st === "pending"} />
          {task.critical && <span className="chip bg-red-50 text-red-700">Critical</span>}
          <span className="chip bg-white text-navy">{task.category}</span>
        </div>

        {st === "completed" && (
          <div className="card flex items-center gap-3 border-l-4 border-ok p-4">
            <span className="text-2xl" aria-hidden>
              🎉
            </span>
            <p className="font-bold text-ok">Done! {task.title} is completed.</p>
          </div>
        )}

        {/* Order & dependencies: always visible */}
        <section className="card grid grid-cols-2 gap-3 p-4 text-sm">
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500">Needs first</h3>
            {needs.length ? (
              needs.map((n) => (
                <Link key={n.id} href={`/tasks/${n.id}`} className="mt-1 block font-semibold text-brand">
                  {statusOf(statuses, n.id) === "completed" ? "✓" : "🔒"} {n.title}
                </Link>
              ))
            ) : (
              <p className="mt-1 text-gray-600">Nothing — you can start now</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500">Unlocks</h3>
            {unlocks.length ? (
              unlocks.map((n) => (
                <Link key={n.id} href={`/tasks/${n.id}`} className="mt-1 block font-semibold text-brand">
                  → {n.title}
                </Link>
              ))
            ) : (
              <p className="mt-1 text-gray-600">—</p>
            )}
          </div>
        </section>

        <TaskSources task={task} />

        {task.warning && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">⚠ {task.warning}</div>}

        <FilterChips<Tab> options={["Summary", "Documents", "Help"]} value={tab} onChange={setTab} />

        {tab === "Summary" && (
          <section className="card space-y-3 p-4 text-sm">
            <p className="leading-relaxed">{task.description}</p>
            <dl className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-bg p-2">
                <dt className="text-xs text-gray-500">Estimated time</dt>
                <dd className="font-semibold">{task.estimatedTime}</dd>
              </div>
              <div className="rounded-xl bg-bg p-2">
                <dt className="text-xs text-gray-500">Cost</dt>
                <dd className="font-semibold">{task.cost}</dd>
              </div>
              {task.deadline && (
                <div className="col-span-2 rounded-xl bg-amber-50 p-2">
                  <dt className="text-xs text-amber-700">Deadline</dt>
                  <dd className="font-semibold text-amber-900">{task.deadline}</dd>
                </div>
              )}
            </dl>
            <h3 className="pt-1 font-bold text-navy">Next steps</h3>
            <ol className="space-y-2">
              {task.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {tab === "Documents" && (
          <section className="card p-4 text-sm">
            <h3 className="mb-2 font-bold text-navy">Documents you need</h3>
            <ul className="space-y-2">
              {task.documentsNeeded.map((d) => (
                <li key={d} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded border border-gray-300 text-[10px]" aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === "Help" && (
          <section className="card space-y-3 p-4 text-sm">
            <Link href={`/chat/assistant?q=${encodeURIComponent(`What do I need for: ${task.title}?`)}`} className="btn-ghost w-full">
              ✦ Ask the assistant about this step
            </Link>
            <Link href="/chat" className="btn-ghost w-full">
              💬 Talk to a mentor or the international office
            </Link>
            {task.category === "Accommodation" && (
              <div className="rounded-xl bg-red-50 p-3 text-red-900">
                <p className="mb-1 font-bold">Housing scam red flags in {dest.city}</p>
                <ul className="list-disc space-y-1 pl-4">
                  {dest.housingAlert.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <div className="flex gap-2">
          {st !== "completed" ? (
            <>
              {st === "pending" && (
                <button className="btn-ghost flex-1" onClick={() => setStatus(task.id, "in_progress")} disabled={blocked}>
                  Start
                </button>
              )}
              <button className="btn-primary flex-1" onClick={() => setStatus(task.id, "completed")}>
                Mark as done
              </button>
            </>
          ) : (
            <button className="btn-ghost flex-1" onClick={() => setStatus(task.id, "pending")}>
              Undo
            </button>
          )}
        </div>
        {blocked && st === "pending" && <p className="text-center text-xs text-gray-500">Finish the steps under “Needs first” before starting this one.</p>}

        {task.doneForYouAvailable && st !== "completed" && (
          <section className="card border-2 border-brand/30 p-4">
            <h3 className="font-bold text-navy">No time? Do it for me</h3>
            <p className="mb-3 text-sm text-gray-600">A partner advisor handles this step end to end. Demo only: no payment is taken.</p>
            {requested ? (
              <p className="rounded-xl bg-ok-soft p-3 text-sm font-semibold text-ok">Request registered. A partner would contact you (simulated).</p>
            ) : (
              <button
                className="btn-primary w-full"
                onClick={() => {
                  setRequested(true);
                  log("done_for_you_request", { taskId: task.id, destination: dest.id });
                }}
              >
                Do it for me
              </button>
            )}
            <Link href="/plans" className="mt-2 block text-center text-xs font-semibold text-brand underline">
              See plans
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
