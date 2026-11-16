"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarClock, Clock3, FolderCheck, LayoutGrid, MapPinned, Mic } from "lucide-react";
import QuickMenu from "@/components/QuickMenu";
import { getDestination, isBlocked } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { StatusBadge, StepMarker } from "@/components/ui";
import BoardingPass from "@/components/BoardingPass";

export default function Home() {
  const { profile, checklist, statuses, highlighted, docs } = useApp();
  const [menu, setMenu] = useState(false);
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const main = checklist.filter((t) => t.phase !== "return");
  const next = main.find((t) => statusOf(statuses, t.id) !== "completed" && !isBlocked(t, statuses));
  const firstName = profile.name.split(" ")[0];
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  return (
    <main className="px-5 pt-6 lg:px-4 lg:pt-10">
      <div className="mb-7 flex items-center justify-between lg:mb-10">
        <span className="eyebrow">{today}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setMenu(true)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card transition hover:border-ink" aria-label="Open quick menu">
            <LayoutGrid size={16} />
          </button>
          <Link href="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-accent text-[12px] font-bold text-white" aria-label="Profile">
            {initials}
          </Link>
        </div>
      </div>
      <QuickMenu open={menu} onClose={() => setMenu(false)} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
      <div>
      <h1 className="display rise text-[46px] lg:text-[72px]">
        Hi, <em className="text-accent">{firstName}</em>.
      </h1>
      <p className="rise mb-6 mt-2 text-[15px] text-ink-2" style={{ animationDelay: "60ms" }}>
        Your adventure in {dest.city} starts here.
      </p>

      <BoardingPass profile={profile} checklist={checklist} statuses={statuses} />

      {next && (
        <Link href={`/tasks/${next.id}`} className="card rise group mt-4 flex items-center gap-4 p-4 transition hover:border-ink" style={{ animationDelay: "120ms" }}>
          <div className="min-w-0 flex-1">
            <p className="eyebrow !text-stamp">Next stop</p>
            <p className="mt-1 font-serif text-[24px] leading-tight">{next.title}</p>
            {next.deadline && (
              <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-stamp">
                <Clock3 size={12} /> {next.deadline}
              </p>
            )}
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition group-hover:bg-accent">
            <ArrowRight size={18} />
          </span>
        </Link>
      )}

      <nav aria-label="Shortcuts" className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          { href: "/documents", label: "Documents", sub: `${docs.length} ready`, Icon: FolderCheck },
          { href: "/deadlines", label: "Deadlines", sub: `${checklist.filter((t) => t.deadline && statusOf(statuses, t.id) !== "completed").length} open`, Icon: CalendarClock },
          { href: "/city", label: "City guide", sub: dest.city, Icon: MapPinned },
        ].map(({ href, label, sub, Icon }) => (
          <Link key={href} href={href} className="card p-3.5 transition hover:border-ink">
            <Icon size={18} className="text-accent" />
            <span className="mt-5 block text-[13.5px] font-semibold">{label}</span>
            <span className="block font-mono text-[10.5px] text-ink-3">{sub}</span>
          </Link>
        ))}
      </nav>
      </div>

      <div className="lg:pt-3">
      <section className="mt-9 lg:mt-0">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-[28px] leading-none">Your itinerary</h2>
          <Link href="/tasks" className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
            Order & dependencies <ArrowUpRight size={14} />
          </Link>
        </div>
        <ol className="relative">
          <span className="absolute bottom-6 left-[13.5px] top-6 w-px bg-line" aria-hidden />
          {main.map((t, i) => {
            const st = statusOf(statuses, t.id);
            const blocked = st === "pending" && isBlocked(t, statuses);
            const hl = highlighted.includes(t.id);
            return (
              <li key={t.id}>
                <Link href={`/tasks/${t.id}`} className="group flex items-center gap-4 py-3">
                  <StepMarker status={st} n={i + 1} />
                  <span className={`min-w-0 flex-1 ${st === "completed" ? "opacity-60" : ""}`}>
                    <span className="block truncate text-[15px] font-semibold group-hover:text-accent">{t.title}</span>
                    <span className="block truncate font-mono text-[11px] text-ink-3">
                      {blocked ? `Needs ${t.dependsOn.map((d) => checklist.find((c) => c.id === d)?.title).join(" + ")}` : (t.localName ?? t.category)}
                    </span>
                    {hl && <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-wider text-stamp">● Flagged by your assistant</span>}
                  </span>
                  <StatusBadge status={st} blocked={blocked} />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <Link href="/chat/assistant" className="group mt-8 block overflow-hidden rounded-[26px] bg-accent p-5 text-white">
        <div className="flex items-start justify-between">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/70">Assistant · 24/7</p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
            <Mic size={16} />
          </span>
        </div>
        <p className="mt-6 font-serif text-[32px] leading-[1.02]">
          Ask anything.
          <br />
          <em>Get the official source.</em>
        </p>
        <p className="mt-3 text-[13px] text-white/80">Every answer cites the government page and the date it was last checked.</p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-accent transition group-hover:gap-3">
          Open assistant <ArrowRight size={14} />
        </span>
      </Link>
      </div>
      </div>
    </main>
  );
}
