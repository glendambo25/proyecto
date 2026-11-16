"use client";

import Link from "next/link";
import { formatDate, getDestination, isBlocked, progressOf } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { ProgressBar, StatusBadge, StatusDot } from "@/components/ui";

export default function Home() {
  const { profile, checklist, statuses, highlighted } = useApp();
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const prog = progressOf(checklist, statuses);
  const main = checklist.filter((t) => t.phase !== "return");
  const next = main.find((t) => statusOf(statuses, t.id) !== "completed" && !isBlocked(t, statuses));
  const firstName = profile.name.split(" ")[0];

  return (
    <main className="space-y-5 px-4 pt-6">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">Hi, {firstName}! 👋</h1>
        <p className="text-sm text-gray-500">Your adventure in {dest.city} starts here</p>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#262a8f] to-brand p-5 text-white shadow-lg">
        <div className="absolute -right-6 -top-6 text-[120px] leading-none opacity-15" aria-hidden>
          {dest.flag}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
          Arrival · {formatDate(profile.arrivalDate)}
        </p>
        <h2 className="mt-1 text-xl font-extrabold">Your arrival in {dest.city}</h2>
        <p className="text-sm opacity-90">{dest.tagline}</p>
        <div className="mt-4 rounded-2xl bg-white/95 p-3 text-navy">
          <ProgressBar {...prog} />
        </div>
      </section>

      {next && (
        <Link href={`/tasks/${next.id}`} className="card flex items-center gap-3 border-l-4 border-brand p-4">
          <span className="text-2xl" aria-hidden>
            👉
          </span>
          <span className="flex-1">
            <span className="block text-xs font-semibold uppercase text-brand">Next step</span>
            <span className="block font-bold text-navy">{next.title}</span>
            {next.deadline && <span className="block text-xs text-red-600">⏱ {next.deadline}</span>}
          </span>
          <span aria-hidden>›</span>
        </Link>
      )}

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-bold text-navy">Your steps</h2>
          <Link href="/tasks" className="text-sm font-semibold text-brand">
            See order & dependencies
          </Link>
        </div>
        <ul className="space-y-2">
          {main.map((t) => {
            const st = statusOf(statuses, t.id);
            const blocked = st === "pending" && isBlocked(t, statuses);
            const hl = highlighted.includes(t.id);
            return (
              <li key={t.id}>
                <Link href={`/tasks/${t.id}`} className={`card flex items-center gap-3 p-3 ${hl ? "ring-2 ring-amber-400" : ""}`}>
                  <StatusDot status={st} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-navy">{t.title}</span>
                    <span className="block truncate text-xs text-gray-500">
                      {t.localName ?? t.category}
                      {blocked && ` · needs ${t.dependsOn.map((d) => checklist.find((c) => c.id === d)?.title).join(", ")}`}
                    </span>
                    {hl && <span className="mt-1 block text-xs font-semibold text-amber-700">Flagged by your assistant: still missing</span>}
                  </span>
                  <StatusBadge status={st} blocked={blocked} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <Link href="/chat/assistant" className="card flex items-center gap-3 bg-brand-soft p-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white" aria-hidden>
          ✦
        </span>
        <span className="flex-1">
          <span className="block font-bold text-navy">Ask your 24/7 assistant</span>
          <span className="block text-xs text-gray-600">Answers only from verified official sources, with the date.</span>
        </span>
        <span aria-hidden>›</span>
      </Link>
    </main>
  );
}
