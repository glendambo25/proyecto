"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BadgeCheck, CircleAlert, Lock } from "lucide-react";
import { formatDate } from "@/lib/content";
import type { Task, TaskStatus } from "@/lib/types";

export function StatusBadge({ status, blocked }: { status: TaskStatus; blocked?: boolean }) {
  if (status === "completed")
    return (
      <span className="chip border-ok/25 bg-ok-soft text-ok">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" />
        Done
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="chip border-accent/25 bg-accent-soft text-accent">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        In progress
      </span>
    );
  if (blocked)
    return (
      <span className="chip border-line bg-paper text-ink-3">
        <Lock size={10} strokeWidth={2.5} />
        Blocked
      </span>
    );
  return <span className="chip border-line bg-transparent text-ink-3">To do</span>;
}

/** Itinerary marker: numbered stop on the route. */
export function StepMarker({ status, n }: { status: TaskStatus; n: number }) {
  if (status === "completed")
    return (
      <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-paper" aria-hidden>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-accent bg-card font-mono text-[11px] font-medium text-accent" aria-hidden>
        {String(n).padStart(2, "0")}
      </span>
    );
  return (
    <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-card font-mono text-[11px] text-ink-3" aria-hidden>
      {String(n).padStart(2, "0")}
    </span>
  );
}

/** Segmented progress: one segment per step, like stamps on a card. */
export function Segments({ total, done, inProgress = 0, dark }: { total: number; done: number; inProgress?: number; dark?: boolean }) {
  return (
    <div className="flex gap-1" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label={`${done} of ${total} steps done`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < done ? (dark ? "bg-paper" : "bg-ink") : i < done + inProgress ? "bg-accent" : dark ? "bg-paper/20" : "bg-paper-2"
          }`}
        />
      ))}
    </div>
  );
}

/** Official source shown as a verification stamp. On every task and every assistant answer. */
export function SourceBadge({
  name,
  url,
  lastVerified,
  status,
  compact,
}: {
  name: string;
  url: string | null;
  lastVerified: string | null;
  status: "verified" | "todo" | string;
  compact?: boolean;
}) {
  const verified = status === "verified" && !!url;
  const Inner = (
    <>
      <span className={`grid shrink-0 place-items-center rounded-full ${compact ? "h-7 w-7" : "h-9 w-9"} ${verified ? "bg-ok-soft text-ok" : "bg-stamp-soft text-stamp"}`}>
        {verified ? <BadgeCheck size={compact ? 15 : 18} /> : <CircleAlert size={compact ? 15 : 18} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`eyebrow block ${verified ? "!text-ok" : "!text-stamp"}`}>
          {verified ? `Official source · verified ${lastVerified ? formatDate(lastVerified) : ""}` : "Source pending · TODO verify"}
        </span>
        <span className="block truncate text-[13px] font-semibold text-ink">{name}</span>
      </span>
      {url && <ArrowUpRight size={16} className="shrink-0 text-ink-3" />}
    </>
  );
  const cls = `flex items-center gap-3 rounded-2xl border ${verified ? "border-ok/20" : "border-stamp/25 border-dashed"} bg-card ${compact ? "p-2" : "p-3"}`;
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className={`${cls} transition hover:border-ink`}>
      {Inner}
    </a>
  ) : (
    <div className={cls}>{Inner}</div>
  );
}

export function TaskSources({ task }: { task: Task }) {
  return (
    <div className="space-y-2">
      <SourceBadge name={task.officialSourceName} url={task.officialSourceUrl} lastVerified={task.lastVerified} status={task.verificationStatus} />
      {task.extraSources?.map((s) => (
        <SourceBadge key={s.url} name={s.name} url={s.url} lastVerified={s.lastVerified} status="verified" />
      ))}
      {task.todo && <p className="px-1 font-mono text-[11px] leading-relaxed text-stamp">{task.todo}</p>}
    </div>
  );
}

export function Header({ eyebrow, title, subtitle, back, right }: { eyebrow?: string; title: React.ReactNode; subtitle?: string; back?: string; right?: React.ReactNode }) {
  return (
    <header className="px-5 pb-4 pt-6 lg:pb-8 lg:pt-10">
      <div className="mb-5 flex h-9 items-center justify-between">
        {back ? (
          <Link href={back} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-ink transition hover:border-ink" aria-label="Back">
            <ArrowLeft size={16} />
          </Link>
        ) : (
          <span className="eyebrow">{eyebrow}</span>
        )}
        {right}
      </div>
      {back && eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="display text-[40px] lg:text-[60px]">{title}</h1>
      {subtitle && <p className="mt-2 max-w-[60ch] text-sm text-ink-2 lg:text-[15px]">{subtitle}</p>}
    </header>
  );
}

export function Tabs<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full border border-line bg-card p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={o === value}
          onClick={() => onChange(o)}
          className={`flex-1 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${o === value ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** Kept for compatibility with older imports. */
export const FilterChips = Tabs;

export function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="eyebrow">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
