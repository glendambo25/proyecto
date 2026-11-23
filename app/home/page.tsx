"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, CalendarClock, PartyPopper, ShieldAlert, Sparkles } from "lucide-react";
import { getDestination } from "@/lib/content";
import { daysFromArrival, dueDay } from "@/lib/chart";
import { statusOf, useApp } from "@/lib/store";
import { Segments } from "@/components/ui";
import { StepRow } from "@/components/ux/StepBits";
import { blockersOf, countdown, firstSentence, overdue, reasonsFor, summarise, URGENT_DAYS, type Reason } from "@/lib/ux/guide";

export default function Home() {
  const { profile, checklist, statuses, highlighted } = useApp();
  const t = useTranslations("home");
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const sum = summarise(checklist, statuses, profile.arrivalDate);
  const next = sum.next;
  const cd = countdown(profile.arrivalDate);
  const cdLabel = t(`countdown.${cd.kind}`, { count: cd.count, city: dest.city });
  const firstName = profile.name.split(" ")[0];
  const initials = (profile.name || dest.city)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // What comes after the next step: the remaining open steps in order, a short preview only.
  const upcoming = checklist.filter((x) => x.phase !== "return" && x.id !== next?.id && statusOf(statuses, x.id) !== "completed").slice(0, 3);
  const allDone = sum.total > 0 && sum.done.length === sum.total;
  const waitingOnly = !next && !allDone;
  const nextState = next ? statusOf(statuses, next.id) : null;
  const nextDue = next ? dueDay(next, profile.arrivalDate) : null;
  const urgent = nextDue != null && nextDue - daysFromArrival(profile.arrivalDate) <= URGENT_DAYS;
  const reasonText = (r: Reason) => (r.kind === "deadline" ? t("next.deadline", { deadline: r.deadline }) : r.kind === "unlocks" ? t("next.unlocks", { steps: r.steps }) : t("next.critical"));
  const openDeadlines = checklist.filter((x) => x.deadline && statusOf(statuses, x.id) !== "completed").length;

  return (
    <main className="px-5 pt-5 lg:px-4 lg:pt-10">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-ink-2">{firstName ? t("hi", { name: firstName }) : t("yourMoveTo", { city: dest.city })}</p>
        <Link href="/profile" className="grid h-11 w-11 place-items-center rounded-full bg-ink text-[13px] font-bold text-white" aria-label={t("profile")}>
          {initials}
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          {/* Countdown: one number, one line. */}
          <p className="mt-5 flex items-baseline gap-3">
            {cd.kind !== "landing" && (
              <span className="tabular text-[64px] font-extrabold leading-[0.85] tracking-[-0.04em] text-accent [font-stretch:75%]">{cd.count}</span>
            )}
            <span className="text-[17px] font-semibold leading-tight text-ink">{cdLabel}</span>
          </p>

          {/* The one main action. */}
          {next && (
            <section aria-labelledby="next-title" className="rise mt-6 rounded-3xl border border-accent/25 bg-accent-soft p-5">
              <p className="text-[14px] font-semibold text-accent">{urgent ? t("next.urgent") : nextState === "in_progress" ? t("next.keepGoing") : t("next.label")}</p>
              <h1 id="next-title" className="mt-1 text-[26px] font-extrabold leading-[1.08] tracking-[-0.02em] [font-stretch:108%]">
                {next.title}
              </h1>
              {next.localName && <p className="mt-0.5 text-[14px] text-ink-2">{next.localName}</p>}
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{firstSentence(next.description)}</p>
              {reasonsFor(next, checklist).length > 0 && (
                <ul className="mt-3 space-y-1 text-[14px] text-ink-2" aria-label={t("next.why")}>
                  {reasonsFor(next, checklist).map((r) => (
                    <li key={r.kind} className={`flex gap-2 ${r.kind === "deadline" && overdue(next, profile.arrivalDate, statuses) ? "font-semibold text-stamp" : ""}`}>
                      <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-current" />
                      {reasonText(r)}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/tasks/${next.id}`}
                className="mt-5 flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-[16px] font-semibold text-white transition-colors duration-150 hover:bg-accent"
              >
                {nextState === "in_progress" ? t("next.continue") : t("next.start")} <ArrowRight size={18} className="flip-rtl" aria-hidden />
              </Link>
            </section>
          )}

          {waitingOnly && (
            <section className="mt-6 rounded-3xl border border-dashed border-ink-3 p-5">
              <h1 className="text-[22px] font-extrabold leading-tight">{t("waiting.title")}</h1>
              <p className="mt-2 text-[15px] text-ink-2">
                {t("waiting.body", { steps: Array.from(new Set(sum.locked.flatMap((x) => blockersOf(x, checklist, statuses).map((b) => b.title)))).join(", ") })}
              </p>
              <Link href="/tasks" className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-accent">
                {t("waiting.cta")}
              </Link>
            </section>
          )}

          {allDone && (
            <section className="pop mt-6 rounded-3xl border border-ok/30 bg-ok-soft p-5">
              <PartyPopper size={28} className="text-ok" aria-hidden />
              <h1 className="mt-2 text-[24px] font-extrabold leading-tight">{t("allDone.title")}</h1>
              <p className="mt-1 text-[15px] text-ink-2">{t("allDone.body")}</p>
              <Link href="/tasks#return" className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-accent">
                {t("allDone.cta")}
              </Link>
            </section>
          )}

          {/* Progress */}
          <section aria-label={t("progress.label")} className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-semibold">{t("progress.done", { done: sum.done.length, total: sum.total })}</p>
              <p className="text-[13.5px] text-ink-3">{t("progress.split", { open: sum.ready.length + sum.doing.length, locked: sum.locked.length })}</p>
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
                  {t("after.title")}
                </h2>
                <Link href="/tasks" className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-accent">
                  {t("after.all")}
                </Link>
              </div>
              <ul className="divide-y divide-line border-y border-line">
                {upcoming.map((x) => (
                  <li key={x.id}>
                    <StepRow task={x} checklist={checklist} statuses={statuses} arrival={profile.arrivalDate} flagged={highlighted.includes(x.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav aria-label={t("help.label")} className="mt-8 grid grid-cols-2 gap-3">
            <Link href="/chat/assistant" className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-line bg-card p-4 transition-colors hover:border-ink">
              <Sparkles size={20} className="text-accent" aria-hidden />
              <span>
                <span className="block text-[15px] font-semibold">{t("help.ask")}</span>
                <span className="block text-[13px] text-ink-3">{t("help.askHint")}</span>
              </span>
            </Link>
            <Link href="/deadlines" className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-line bg-card p-4 transition-colors hover:border-ink">
              <CalendarClock size={20} className="text-accent" aria-hidden />
              <span>
                <span className="block text-[15px] font-semibold">{t("help.deadlines")}</span>
                <span className="block text-[13px] text-ink-3">{t("help.deadlinesHint", { count: openDeadlines })}</span>
              </span>
            </Link>
          </nav>

          {dest.housingAlert.length > 0 && checklist.some((x) => x.id === "accommodation" && statusOf(statuses, x.id) !== "completed") && (
            <Link href="/city" className="mt-3 flex min-h-[56px] items-start gap-3 rounded-2xl bg-stamp-soft p-4 text-[14px] text-stamp">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                <span className="block font-semibold">{t("housing")}</span>
                <span className="block text-ink-2">{dest.housingAlert[0]}</span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
