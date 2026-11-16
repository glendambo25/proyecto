"use client";

import Link from "next/link";
import { CalendarPlus, Clock3, PlaneLanding } from "lucide-react";
import { estimateDue, formatDate, getDestination, phaseLabel, shortDate } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { Header, StatusBadge } from "@/components/ui";

function ics(events: { title: string; date: string; note: string }[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const body = events
    .map((e, i) =>
      [
        "BEGIN:VEVENT",
        `UID:arrival-${i}-${e.date}@arrival.demo`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`,
        `SUMMARY:${e.title.replace(/[,;]/g, " ")}`,
        `DESCRIPTION:${e.note.replace(/[,;\n]/g, " ")}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${e.title.replace(/[,;]/g, " ")}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"),
    )
    .join("\r\n");
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Arrival//Demo//EN\r\n${body}\r\nEND:VCALENDAR`;
}

export default function Deadlines() {
  const { profile, checklist, statuses, log } = useApp();
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const withDates = checklist
    .filter((t) => t.deadline)
    .map((t) => ({ t, due: estimateDue(profile.arrivalDate, t.deadlineRule) }))
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
  const calendarEvents = [
    { title: `Arrival in ${dest.city}`, date: profile.arrivalDate, note: "Start of your arrival checklist" },
    ...withDates.filter((x) => x.due).map((x) => ({ title: x.t.title, date: x.due!, note: `${x.t.deadline}. Estimated from your arrival date — check the official source.` })),
  ];

  function download() {
    const blob = new Blob([ics(calendarEvents)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arrival-${dest.id}-deadlines.ics`;
    a.click();
    URL.revokeObjectURL(url);
    log("calendar_export", { events: calendarEvents.length });
  }

  return (
    <main>
      <Header
        back="/home"
        eyebrow="Deadlines"
        title={
          <>
            Don’t miss <em>a date</em>
          </>
        }
        subtitle="Legal deadlines from official sources. Dates are estimated from your arrival date — the rule itself is what counts."
      />
      <div className="space-y-6 px-5 lg:max-w-3xl">
        <ol className="relative">
          <span className="absolute bottom-4 left-[19px] top-4 w-px bg-line" aria-hidden />
          <li className="flex items-center gap-4 py-3">
            <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-ink text-paper">
              <PlaneLanding size={17} />
            </span>
            <div className="flex-1">
              <p className="eyebrow">{shortDate(profile.arrivalDate)}</p>
              <p className="font-serif text-[22px] leading-tight">Arrival in {dest.city}</p>
            </div>
          </li>
          {withDates.map(({ t, due }) => {
            const st = statusOf(statuses, t.id);
            return (
              <li key={t.id}>
                <Link href={`/tasks/${t.id}`} className="group flex items-start gap-4 py-3">
                  <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ${st === "completed" ? "bg-ok text-white" : "bg-stamp text-white"}`}>
                    <Clock3 size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow !text-stamp">{due ? `≈ ${formatDate(due)}` : phaseLabel[t.phase]}</p>
                    <p className="text-[15px] font-semibold group-hover:text-accent">{t.title}</p>
                    <p className="font-mono text-[11px] text-ink-3">{t.deadline}</p>
                  </div>
                  <StatusBadge status={st} />
                </Link>
              </li>
            );
          })}
        </ol>
        {withDates.length === 0 && <p className="card p-5 text-[14px] text-ink-2">No legal deadlines with a verified source for your checklist yet.</p>}

        <button className="btn-primary w-full" onClick={download}>
          <CalendarPlus size={16} /> Add to my calendar (.ics)
        </button>
        <p className="text-center font-mono text-[10.5px] text-ink-3">Includes a reminder 2 days before each date.</p>
      </div>
    </main>
  );
}
