"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { Header } from "@/components/ui";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0 €",
    unit: "always",
    items: ["Personalised checklist in the right order", "24/7 assistant with official sources", "Voice assistant", "Community and local mentors"],
    tone: "card",
  },
  {
    id: "premium",
    name: "Premium pack",
    price: "19–39 €",
    unit: "one-off",
    items: ["Complete guide to the critical procedures of your destination", "Document templates and pre-filled checklists", "Priority answers from advisors"],
    tone: "bg-accent text-white",
  },
  {
    id: "dfy",
    name: "Done for you",
    price: "79–149 €",
    unit: "per procedure",
    items: ["A partner advisor or law firm handles the procedure end to end", "For critical, time-sensitive steps: visa, residence permit, registration"],
    tone: "bg-ink text-paper",
  },
];

export default function Plans() {
  const { log } = useApp();
  const [chosen, setChosen] = useState<string[]>([]);
  return (
    <main>
      <Header
        back="/profile"
        eyebrow="Plans"
        title={
          <>
            Free for students. <em>Help when it’s critical.</em>
          </>
        }
        subtitle="Many universities cover the app for their outgoing students."
      />
      <div className="space-y-3 px-5">
        <p className="rounded-2xl border border-dashed border-stamp/40 bg-stamp-soft px-4 py-3 font-mono text-[11px] leading-relaxed text-stamp">
          Pilot Jan 2027 — prices are hypotheses being validated. No payment is taken; we only record interest.
        </p>
        {PLANS.map((p) => {
          const dark = p.tone !== "card";
          return (
            <section key={p.id} className={`rounded-[26px] p-5 ${dark ? p.tone : "card"}`}>
              <div className="flex items-start justify-between">
                <p className={`font-mono text-[10.5px] uppercase tracking-[0.16em] ${dark ? "opacity-70" : "text-ink-3"}`}>{p.name}</p>
                {p.id === "premium" && <span className="rounded-full bg-white/20 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider">Most useful</span>}
              </div>
              <p className="mt-4 font-serif text-[48px] leading-none">
                {p.price} <span className={`font-sans text-[13px] ${dark ? "opacity-70" : "text-ink-3"}`}>{p.unit}</span>
              </p>
              <ul className="mt-4 space-y-2 text-[13.5px]">
                {p.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <Check size={15} className="mt-0.5 shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              {p.id === "free" ? (
                <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-ok">● Your current plan</p>
              ) : chosen.includes(p.id) ? (
                <p className="mt-5 rounded-full bg-white/15 px-4 py-3 text-center text-[13px] font-semibold">Thanks — interest recorded (demo)</p>
              ) : (
                <button
                  className="btn mt-5 w-full bg-paper text-ink hover:bg-white"
                  onClick={() => {
                    setChosen([...chosen, p.id]);
                    log(p.id === "premium" ? "premium_interest" : "done_for_you_interest", { plan: p.id });
                  }}
                >
                  I’m interested
                </button>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
