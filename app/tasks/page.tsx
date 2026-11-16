"use client";

import Link from "next/link";
import { getDestination, isBlocked, phaseLabel, progressOf } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { Header, ProgressBar, StatusBadge, StatusDot } from "@/components/ui";
import DependencyMap from "@/components/DependencyMap";
import type { Phase } from "@/lib/types";

export default function Tasks() {
  const { profile, checklist, statuses } = useApp();
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const phases: Phase[] = ["before", "arrival", "settle", "return"];

  return (
    <main>
      <Header title="Tasks" subtitle={`${dest.flag} ${dest.city} · personalised for ${profile.nationalityLabel} · ${profile.purpose}`} />
      <div className="space-y-5 px-4">
        <div className="card p-4">
          <ProgressBar {...progressOf(checklist, statuses)} />
        </div>
        <DependencyMap tasks={checklist.filter((t) => t.phase !== "return")} statuses={statuses} />
        {phases.map((ph) => {
          const list = checklist.filter((t) => t.phase === ph);
          if (!list.length) return null;
          return (
            <section key={ph}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                {ph === "return" ? "🔁 " : ""}
                {phaseLabel[ph]}
              </h2>
              <ul className="space-y-2">
                {list.map((t, i) => {
                  const st = statusOf(statuses, t.id);
                  const blocked = st === "pending" && isBlocked(t, statuses);
                  return (
                    <li key={t.id}>
                      <Link href={`/tasks/${t.id}`} className="card flex items-start gap-3 p-3">
                        <StatusDot status={st} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-navy">
                            {checklist.indexOf(t) + 1}. {t.title}
                          </span>
                          {t.localName && <span className="block text-xs text-gray-500">{t.localName}</span>}
                          <span className="mt-1 flex flex-wrap gap-1">
                            {t.critical && <span className="chip bg-red-50 text-red-700">Critical</span>}
                            {t.deadline && <span className="chip bg-amber-50 text-amber-800">⏱ {t.deadline}</span>}
                            {t.verificationStatus === "verified" ? (
                              <span className="chip bg-ok-soft text-ok">Source verified</span>
                            ) : (
                              <span className="chip bg-amber-50 text-amber-800">Source: TODO verify</span>
                            )}
                          </span>
                        </span>
                        <StatusBadge status={st} blocked={blocked} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
