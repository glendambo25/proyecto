"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { Header, Segments, Tabs } from "@/components/ui";

type F = "All" | "To get" | "Ready";

export default function Documents() {
  const { profile, checklist, docs, toggleDoc, log } = useApp();
  const [f, setF] = useState<F>("All");
  if (!profile) return null;

  // One entry per document, with the steps that need it.
  const map = new Map<string, { title: string; id: string }[]>();
  for (const t of checklist) for (const d of t.documentsNeeded) map.set(d, [...(map.get(d) ?? []), { title: t.title, id: t.id }]);
  const all = [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  const list = all.filter(([d]) => (f === "All" ? true : f === "Ready" ? docs.includes(d) : !docs.includes(d)));
  const ready = all.filter(([d]) => docs.includes(d)).length;

  return (
    <main>
      <Header
        back="/home"
        eyebrow="Document wallet"
        title={
          <>
            What to <em>carry</em>
          </>
        }
        subtitle="Every document your checklist asks for, merged. The ones used in several steps come first."
      />
      <div className="space-y-5 px-5 lg:max-w-3xl">
        <div className="flex items-center gap-4">
          <p className="font-serif text-[40px] leading-none">
            {ready}
            <span className="text-ink-3">/{all.length}</span>
          </p>
          <div className="flex-1">
            <Segments total={all.length} done={ready} />
            <p className="eyebrow mt-2">ready in your folder</p>
          </div>
        </div>
        <Tabs<F> options={["All", "To get", "Ready"]} value={f} onChange={setF} />
        <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card">
          {list.map(([d, steps]) => {
            const on = docs.includes(d);
            return (
              <li key={d} className="flex items-start gap-3 px-4 py-3.5">
                <button
                  onClick={() => {
                    toggleDoc(d);
                    log("document_toggle", { ready: !on });
                  }}
                  aria-pressed={on}
                  aria-label={`Mark ${d} as ${on ? "missing" : "ready"}`}
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                >
                  {on && <Check size={13} strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[14.5px] font-semibold ${on ? "text-ink-3 line-through" : ""}`}>{d}</p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {steps.map((s) => (
                      <Link key={s.id} href={`/tasks/${s.id}`} className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-2 hover:text-accent">
                        {s.title}
                      </Link>
                    ))}
                  </p>
                </div>
                {steps.length > 1 && <span className="shrink-0 font-mono text-[10px] text-accent">×{steps.length}</span>}
              </li>
            );
          })}
          {list.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-ink-3">Nothing here.</li>}
        </ul>
        <p className="font-mono text-[10.5px] text-ink-3">Tip: keep digital copies too. In this demo nothing is uploaded; the checklist is saved on this device.</p>
      </div>
    </main>
  );
}
