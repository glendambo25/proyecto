"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { Check, Lock } from "lucide-react";
import { StepHint, STATE_LABEL } from "@/components/ux/StepBits";
import { blockersOf, rowState, summarise } from "@/lib/ux/guide";
import { getDestination, isBlocked, phaseLabel } from "@/lib/content";
import { daysFromArrival, dueDay } from "@/lib/chart";
import { statusOf, useApp } from "@/lib/store";
import type { Phase, Task } from "@/lib/types";
import Contours from "./Contours";

/* Gutter geometry (px). Rail on the left, arc lanes between rail and nodes. */
const RAIL_X = 22;
const NODE_X = 92; // node centre
const NODE_R = 12;
const LANE0 = NODE_X - NODE_R - 6; // first lane, just left of the node
const LANE_STEP = 9;
const COL = 108;

type Arc = { d: string; solid: boolean; key: string; overdue: boolean };
type Tick = { y: number; label: string; strong?: boolean };

/** "Arrival chart": steps on a day rail, each prerequisite joined by an arc in its own lane. */
export default function TasksChart() {
  const { profile, checklist, statuses } = useApp();
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const phaseRefs = useRef<Partial<Record<Phase, HTMLElement | null>>>({});
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [todayY, setTodayY] = useState<number | null>(null);
  const [h, setH] = useState(0);

  const days = profile ? daysFromArrival(profile.arrivalDate) : 0;

  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap || !profile) return;
      const box = wrap.getBoundingClientRect();
      const yOf = (el?: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return r.top - box.top + r.height / 2;
      };
      const topOf = (el?: Element | null) => (el ? el.getBoundingClientRect().top - box.top : null);

      // Arcs: one lane per edge, ordered by span so short edges sit closest to the nodes.
      const edges = checklist.flatMap((t) => t.dependsOn.map((d) => ({ from: d, to: t.id })));
      const withY = edges
        .map((e) => ({ ...e, y1: yOf(nodeRefs.current[e.from]), y2: yOf(nodeRefs.current[e.to]) }))
        .filter((e): e is typeof e & { y1: number; y2: number } => e.y1 != null && e.y2 != null)
        .sort((a, b) => Math.abs(a.y2 - a.y1) - Math.abs(b.y2 - b.y1));
      const lanes: { top: number; bottom: number }[][] = [];
      const out: Arc[] = [];
      for (const e of withY) {
        const top = Math.min(e.y1, e.y2);
        const bottom = Math.max(e.y1, e.y2);
        let lane = lanes.findIndex((l) => l.every((s) => bottom < s.top - 4 || top > s.bottom + 4));
        if (lane === -1) lane = lanes.push([]) - 1;
        lanes[lane].push({ top, bottom });
        const x = Math.max(RAIL_X + 10, LANE0 - lane * LANE_STEP);
        const sx = NODE_X - NODE_R;
        const r = Math.min(10, (bottom - top) / 2);
        const d = `M ${sx} ${e.y1} H ${x + r} Q ${x} ${e.y1} ${x} ${e.y1 + (e.y2 > e.y1 ? r : -r)} V ${e.y2 - (e.y2 > e.y1 ? r : -r)} Q ${x} ${e.y2} ${x + r} ${e.y2} H ${sx}`;
        out.push({ key: `${e.from}-${e.to}`, d, solid: statusOf(statuses, e.from) === "completed", overdue: false });
      }
      setArcs(out);

      // Rail ticks: phase starts, landing (day 0), and every step whose deadline has an official rule.
      const tk: Tick[] = [];
      const firstDays = topOf(phaseRefs.current.arrival);
      if (firstDays != null) tk.push({ y: firstDays + 14, label: "0 · LANDING", strong: true });
      for (const t of checklist) {
        const dd = dueDay(t, profile.arrivalDate);
        const y = yOf(nodeRefs.current[t.id]);
        if (dd != null && y != null) tk.push({ y, label: `+${dd}` });
      }
      setTicks(tk);

      // Today marker: before landing it sits in the "before" span, proportional to days left (cap 120);
      // after landing it sits at the dated step it has reached, else at the start of settling in.
      const beforeTop = topOf(phaseRefs.current.before);
      let ty: number | null = null;
      if (days < 0 && beforeTop != null && firstDays != null) {
        const f = Math.max(0, 1 - Math.min(120, -days) / 120);
        ty = beforeTop + 14 + (firstDays - beforeTop) * f;
      } else if (days >= 0 && firstDays != null) {
        const dated = checklist
          .map((t) => ({ d: dueDay(t, profile.arrivalDate), y: yOf(nodeRefs.current[t.id]) }))
          .filter((x): x is { d: number; y: number } => x.d != null && x.y != null && x.d <= days)
          .sort((a, b) => b.d - a.d)[0];
        ty = dated?.y ?? topOf(phaseRefs.current.settle) ?? firstDays + 14;
      }
      setTodayY(ty);
      setH(box.height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [checklist, statuses, profile, days]);

  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const sum = summarise(checklist, statuses, profile.arrivalDate);
  const next = sum.next;
  const phases = (["before", "arrival", "settle", "return"] as const).filter((p) => checklist.some((t) => t.phase === p));
  const readoutValue = days === 0 ? "0" : days < 0 ? `−${-days}` : `+${days}`;

  return (
    <main className="relative">
      <header className="relative overflow-hidden px-5 pb-6 pt-6 lg:px-8 lg:pt-10">
        <Contours levels={8} cx={0.86} cy={0.2} />
        <p className="relative text-[15px] font-semibold text-ink-2">{dest.city}</p>
        <h1 className="relative mt-1 text-[34px] font-extrabold leading-[1.02] tracking-[-0.025em] [font-stretch:110%] lg:text-[48px]">Your checklist</h1>
        <p className="relative mt-2 text-[15px] text-ink-2">
          <span className="font-semibold text-ink">
            {sum.done.length} of {sum.total} done
          </span>
          {" · "}
          {sum.ready.length + sum.doing.length} you can do now · {sum.locked.length} locked
        </p>
        {/* Legend: the four states and what the lines mean, readable without the explanation. */}
        <ul className="relative mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-ink-2" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-ok text-white" aria-hidden>
              <Check size={9} strokeWidth={3} />
            </span>
            Done
          </li>
          <li className="flex items-center gap-1.5">
            <span className="block h-4 w-4 rounded-full border-[3px] border-accent" aria-hidden />
            In progress
          </li>
          <li className="flex items-center gap-1.5">
            <span className="block h-4 w-4 rounded-full border-2 border-ink" aria-hidden />
            Ready
          </li>
          <li className="flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded-full border border-dashed border-ink-3 text-ink-3" aria-hidden>
              <Lock size={8} />
            </span>
            Locked
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="22" height="10" aria-hidden>
              <path d="M2 5 H20" stroke="#4f46e5" strokeWidth="1.6" strokeDasharray="3 3" />
            </svg>
            Needs this first
          </li>
        </ul>
      </header>

      <div className="relative px-3 lg:px-6">
        <div ref={wrapRef} className="relative">
          {/* Rail, ticks, today marker and arcs */}
          <svg className="pointer-events-none absolute start-0 top-0 overflow-visible rtl:-scale-x-100" width={COL} height={h} aria-hidden>
            <line x1={RAIL_X} x2={RAIL_X} y1={0} y2={h} stroke="#111827" strokeWidth="1.5" />
            {/* Only real graduations: landing and rule-dated deadlines (no uniform ruler). */}
            {ticks.map((t) => (
              <line key={`tk-${t.y}`} x1={RAIL_X - 8} x2={RAIL_X + 4} y1={t.y} y2={t.y} stroke="#111827" strokeWidth={t.strong ? 2 : 1.4} />
            ))}
            {arcs.map((a) => (
              <path key={a.key} d={a.d} fill="none" stroke="#4f46e5" strokeWidth={a.solid ? 2 : 1.5} strokeDasharray={a.solid ? undefined : "3 4"} strokeLinecap="round" />
            ))}
          </svg>

          {/* Tick labels on the rail (HTML so they stay crisp and selectable) */}
          {ticks.map((t) => (
            <span
              key={`${t.label}-${t.y}`}
              className={`tabular pointer-events-none absolute -translate-y-1/2 whitespace-nowrap text-[10.5px] font-bold uppercase tracking-[0.06em] [font-stretch:75%] ${t.strong ? "text-ink" : "text-ink-2"}`}
              style={{ top: t.y, insetInlineStart: RAIL_X + 6, background: "white", paddingInline: 2 }}
            >
              {t.label}
            </span>
          ))}

          {/* Today: a marker on the rail carrying the vertical readout */}
          {todayY != null && (
            <div className="pointer-events-none absolute z-20 -translate-y-1/2" style={{ top: todayY, insetInlineStart: RAIL_X - 9 }} aria-hidden>
              <span className="block h-[18px] w-[18px] rounded-full border-[3px] border-white bg-accent shadow-[0_2px_6px_rgba(79,70,229,0.45)]" />
              {/* Readout set vertically on the rail's left, like an altitude scale; never over the arc lanes. */}
              <span
                className="tabular absolute bottom-[-2px] left-[-14px] whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em] text-accent [font-stretch:80%]"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Today {readoutValue}
              </span>
            </div>
          )}

          <ol className="relative">
            {phases.map((ph) => (
              <li key={ph} id={ph} className="scroll-mt-4" ref={(el) => void (phaseRefs.current[ph] = el)}>
                <h2 className="relative pb-1 pt-6 text-[12px] font-bold uppercase tracking-[0.14em] [font-stretch:80%]" style={{ paddingInlineStart: COL - 4 }}>
                  {phaseLabel[ph]}
                </h2>
                <ul>
                  {checklist
                    .filter((t) => t.phase === ph)
                    .map((t) => (
                      <Row key={t.id} task={t} n={checklist.indexOf(t) + 1} isNext={next?.id === t.id} nodeRef={(el) => void (nodeRefs.current[t.id] = el)} />
                    ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
        <p className="px-2 pb-4 pt-6 text-[13px] text-ink-3">The line on the left counts days from your arrival. Dates appear only where an official rule sets a deadline.</p>
      </div>
    </main>
  );

  function Row({ task, n, isNext, nodeRef }: { task: Task; n: number; isNext: boolean; nodeRef: (el: HTMLSpanElement | null) => void }) {
    const st = statusOf(statuses, task.id);
    const blocked = st === "pending" && isBlocked(task, statuses);
    const due = dueDay(task, profile!.arrivalDate);
    const overdue = due != null && st !== "completed" && days > due;
    const state = rowState(task, statuses);
    const waits = state === "locked" ? blockersOf(task, checklist, statuses).map((b) => b.title).join(" and ") : "";
    const label = `Step ${n}: ${task.title}. ${STATE_LABEL[state]}${waits ? `, first finish ${waits}` : ""}${isNext ? ". Your next step" : ""}${task.deadline && state !== "done" ? `. Deadline: ${task.deadline}` : ""}`;
    return (
      <li>
        <Link
          href={`/tasks/${task.id}`}
          aria-label={label}
          className={`group relative grid min-h-[56px] items-start gap-3 rounded-2xl py-3 pe-3 transition-colors duration-150 hover:bg-accent-soft/60 ${isNext ? "bg-accent-soft/70" : ""}`}
          style={{ gridTemplateColumns: `${COL}px 1fr auto` }}
        >
          <span ref={nodeRef} className="relative z-10 mt-0.5 -translate-x-1/2 rtl:translate-x-1/2" style={{ marginInlineStart: NODE_X }} aria-hidden>
            {st === "completed" ? (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ok text-white">
                <Check size={13} strokeWidth={3} />
              </span>
            ) : st === "in_progress" ? (
              <span className="block h-6 w-6 rounded-full border-[3px] border-accent bg-white" />
            ) : blocked ? (
              <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-ink-3 bg-white text-ink-3">
                <Lock size={10} />
              </span>
            ) : (
              <span className="block h-6 w-6 rounded-full border-2 border-ink bg-white" />
            )}
          </span>
          <span className="min-w-0">
            <span className={`block text-[16px] font-semibold leading-snug ${st === "completed" ? "text-ink-3 line-through decoration-ink-3/50" : ""}`}>{task.title}</span>
            <span className="block text-[12.5px] text-ink-3">
              {String(n).padStart(2, "0")} · {task.localName ?? task.category}
              {task.verificationStatus === "verified" ? "" : " · source not verified yet"}
            </span>
            <StepHint task={task} checklist={checklist} statuses={statuses} arrival={profile!.arrivalDate} showDoing={false} />
            {isNext && state === "ready" && (
              <span className="mt-0.5 block font-hand text-[22px] leading-[22px] text-accent" aria-hidden>
                <svg width="16" height="9" viewBox="0 0 18 10" className="me-1 inline-block align-middle">
                  <path d="M1 5 C 6 1, 10 9, 17 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                start here
              </span>
            )}
          </span>
          <span className="tabular pt-0.5 text-end text-[12.5px] font-semibold" aria-hidden>
            {due != null ? (
              <span className={overdue ? "text-stamp" : st === "completed" ? "text-ink-3" : "text-ink"}>day +{due}</span>
            ) : st === "in_progress" ? (
              <span className="text-accent">in progress</span>
            ) : st === "completed" ? (
              <span className="text-ok">done</span>
            ) : null}
          </span>
        </Link>
      </li>
    );
  }
}
