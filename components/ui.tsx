"use client";

import Link from "next/link";
import { formatDate } from "@/lib/content";
import type { Task, TaskStatus } from "@/lib/types";

export function StatusBadge({ status, blocked }: { status: TaskStatus; blocked?: boolean }) {
  if (status === "completed") return <span className="chip bg-ok-soft text-ok">✓ Completed</span>;
  if (status === "in_progress") return <span className="chip bg-prog-soft text-prog">● In progress</span>;
  if (blocked) return <span className="chip bg-pend-soft text-pend">🔒 Blocked</span>;
  return <span className="chip bg-pend-soft text-pend">○ Pending</span>;
}

export function StatusDot({ status }: { status: TaskStatus }) {
  const cls = status === "completed" ? "bg-ok text-white" : status === "in_progress" ? "bg-prog text-white" : "bg-pend-soft text-pend";
  return (
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${cls}`} aria-hidden>
      {status === "completed" ? "✓" : status === "in_progress" ? "…" : "○"}
    </span>
  );
}

export function ProgressBar({ done, total, pct }: { done: number; total: number; pct: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-navy">Overall progress</span>
        <span className="font-semibold text-brand">
          {done}/{total} · {pct}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-brand-soft" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-navy transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Official source + last verified date. Shown on every task and every assistant answer. */
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
  const verified = status === "verified" && url;
  return (
    <div className={`rounded-xl border ${verified ? "border-ok/30 bg-ok-soft/60" : "border-amber-300 bg-amber-50"} ${compact ? "px-2.5 py-1.5" : "p-3"} text-xs`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-bold">{verified ? "✔ Official source" : "⚠ Source pending verification"}</span>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline underline-offset-2">
            {name}
          </a>
        ) : (
          <span className="text-gray-600">{name}</span>
        )}
      </div>
      <div className="mt-0.5 text-gray-600">Last verified: {verified && lastVerified ? formatDate(lastVerified) : "not yet (TODO: verify)"}</div>
    </div>
  );
}

export function TaskSources({ task }: { task: Task }) {
  return (
    <div className="space-y-2">
      <SourceBadge name={task.officialSourceName} url={task.officialSourceUrl} lastVerified={task.lastVerified} status={task.verificationStatus} />
      {task.extraSources?.map((s) => (
        <SourceBadge key={s.url} name={s.name} url={s.url} lastVerified={s.lastVerified} status="verified" />
      ))}
      {task.todo && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{task.todo}</p>}
    </div>
  );
}

export function Header({ title, subtitle, back }: { title: string; subtitle?: string; back?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-bg/95 px-4 pb-3 pt-5 backdrop-blur">
      <div className="flex items-center gap-3">
        {back && (
          <Link href={back} className="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow" aria-label="Back">
            ←
          </Link>
        )}
        <div>
          <h1 className="text-xl font-extrabold text-navy">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

export function FilterChips<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
      {options.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={o === value}
          onClick={() => onChange(o)}
          className={`chip whitespace-nowrap ${o === value ? "bg-navy text-white" : "bg-white text-navy"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
