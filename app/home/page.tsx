"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, PartyPopper, ShieldAlert, Sparkles } from "lucide-react";
import { getDestination } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { Segments } from "@/components/ui";
import { StepRow } from "@/components/ux/StepBits";
import { blockersOf, countdown, firstSentence, overdue, reasonsFor, summarise, URGENT_DAYS } from "@/lib/ux/guide";
import { daysFromArrival, dueDay } from "@/lib/chart";

export default function Home() {
  const { profile, checklist, statuses, highlighted } = useApp();
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const sum = summarise(checklist, statuses, profile.arrivalDate);
  const next = sum.next;
  const cd = countdown(profile.arrivalDate, dest.city);
  const firstName = profile.name.split(" ")[0];
  const initials = (profile.name || dest.city)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // What comes after the next step: the remaining open steps in order, a short preview only.
  const upcoming = checklist.filter((t) => t.phase !== "return" && t.id !== next?.id && statusOf(statuses, t.id) !== "completed").slice(0, 3);
  const allDone = sum.total > 0 && sum.done.length === sum.total;
  const waitingOnly = !next && !allDone;
  const nextState = next ? statusOf(statuses, next.id) : null;
  const nextDue = next ? dueDay(next, profile.arrivalDate) : null;

  return (
    <main className="px-5 pt-5 lg:px-4 lg:pt-10">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-ink-2">{firstName ? `Hi ${firstName}` : `Your move to ${dest.city}`}</p>
        <Link href="/profile" className="grid h-11 w-11 place-items-center rounded-full bg-ink text-[13px] font-bold text-white" aria-label="Your profile">
          {initials}
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          {/* Countdown: one number, one line. */}
          <p className="mt-5 flex items-baseline gap-3" aria-label={cd.sentence}>
            <span className="tabular text-[64px] font-extrabold leading-[0.85] tracking-[-0.04em] text-accent [font-stretch:75%]" aria-hidden>
              {cd.value}
            </span>
            <span className="text-[17px] font-semibold leading-tight text-ink" aria-hidden>
              {cd.label}
            </span>
          </p>

          {/* The one main action. */}
          {next && (
            <section aria-labelledby="next-title" className="rise mt-6 rounded-3xl border border-accent/25 bg-accent-soft p-5">
              <p className="text-[14px] font-semibold text-accent">{nextDue != null && nextDue - daysFromArrival(profile.arrivalDate) <= URGENT_DAYS ? "Deadline soon: do this first" : nextState === "in_progress" ? "Keep going: your next step" : "Your next step"}</p>
              <h1 id="next-title" className="mt-1 text-[26px] font-extrabold leading-[1.08] tracking-[-0.02em] [font-stretch:108%]">
                {next.title}
              </h1>
              {next.localName && <p className="mt-0.5 text-[14px] text-ink-2">{next.localName}</p>}
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{firstSentence(next.description)}</p>
              {reasonsFor(next, checklist).length > 0 && (
                <ul className="mt-3 space-y-1 text-[14px] text-ink-2" aria-label="Why now">
                  {reasonsFor(next, checklist).map((r) => (
                    <li key={r} className={`flex gap-2 ${r.startsWith("Deadline") && overdue(next, profile.arrivalDate, statuses) ? "font-semibold text-stamp" : ""}`}>
                      <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-current" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/tasks/${next.id}`}
                className="mt-5 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-[16px] font-semibold text-white transition-colors duration-150 hover:bg-accent"
              >
                {nextState === "in_progress" ? "Continue" : "Start this step"} <ArrowRight size={18} className="flip-rtl" aria-hidden />
              </Link>
            </section>
          )}

          {waitingOnly && (
            <section className="mt-6 rounded-3xl border border-dashed border-ink-3 p-5">
              <h1 className="text-[22px] font-extrabold leading-tight">Nothing to start right now</h1>
              <p className="mt-2 text-[15px] text-ink-2">Your open steps are waiting for: {Array.from(new Set(sum.locked.flatMap((t) => blockersOf(t, checklist, statuses).map((b) => b.title)))).join(", ")}.</p>
              <Link href="/tasks" className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-accent">
                See your checklist
              </Link>
            </section>
          )}

          {allDone && (
            <section className="pop mt-6 rounded-3xl border border-ok/30 bg-ok-soft p-5">
              <PartyPopper size={28} className="text-ok" aria-hidden />
              <h1 className="mt-2 text-[24px] font-extrabold leading-tight">All arrival steps done</h1>
              <p className="mt-1 text-[15px] text-ink-2">Keep an eye on the steps for when you go home.</p>
              <Link href="/tasks#return" className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-accent">
                Going-home steps
              </Link>
            </section>
          )}

          {/* Progress */}
          <section aria-label="Progress" className="mt-6">
            <div className="flex items-baseline justify-between">
              <p className="text-[15px] font-semibold">
                {sum.done.length} of {sum.total} steps done
              </p>
              <p className="text-[13.5px] text-ink-3">
                {sum.ready.length + sum.doing.length} open · {sum.locked.length} locked
              </p>
            </div>
            <div className="mt-2">
              <Segments total={sum.total} done={sum.done.length} inProgress={0} />
            </div>
          </section>
        </div>

        <div className="lg:pt-2">
          {upcoming.length > 0 && (
            <section aria-labelledby="after-title" className="mt-8 lg:mt-0">
              <div className="flex items-baseline justify-between">
                <h2 id="after-title" className="text-[18px] font-bold">
                  After that
                </h2>
                <Link href="/tasks" className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-accent">
                  Full checklist
                </Link>
              </div>
              <ul className="divide-y divide-line border-y border-line">
                {upcoming.map((t) => (
                  <li key={t.id}>
                    <StepRow task={t} checklist={checklist} statuses={statuses} arrival={profile.arrivalDate} flagged={highlighted.includes(t.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav aria-label="Help" className="mt-8 grid grid-cols-2 gap-3">
            <Link href="/chat/assistant" className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-line bg-card p-4 transition-colors hover:border-ink">
              <Sparkles size={20} className="text-accent" aria-hidden />
              <span>
                <span className="block text-[15px] font-semibold">Ask a question</span>
                <span className="block text-[13px] text-ink-3">Answers with official source</span>
              </span>
            </Link>
            <Link href="/deadlines" className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-line bg-card p-4 transition-colors hover:border-ink">
              <CalendarClock size={20} className="text-accent" aria-hidden />
              <span>
                <span className="block text-[15px] font-semibold">Deadlines</span>
                <span className="block text-[13px] text-ink-3">{checklist.filter((t) => t.deadline && statusOf(statuses, t.id) !== "completed").length} open</span>
              </span>
            </Link>
          </nav>

          {dest.housingAlert.length > 0 && checklist.some((t) => t.id === "accommodation" && statusOf(statuses, t.id) !== "completed") && (
            <Link href="/city" className="mt-3 flex min-h-[56px] items-start gap-3 rounded-2xl bg-stamp-soft p-4 text-[14px] text-stamp">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                <span className="block font-semibold">Looking for a room? Avoid scams</span>
                <span className="block text-ink-2">{dest.housingAlert[0]}</span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
