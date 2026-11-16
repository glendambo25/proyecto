"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Header } from "@/components/ui";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0 €",
    items: ["Personalised checklist in the right order", "24/7 assistant with official sources", "Community and local mentors"],
    cta: "Current plan",
  },
  {
    id: "premium",
    name: "Premium pack",
    price: "19–39 € one-off",
    items: ["Complete guide to the critical procedures of your destination", "Document templates and checklists", "Priority answers from advisors"],
    cta: "I'm interested",
  },
  {
    id: "dfy",
    name: "Done for you",
    price: "79–149 € per procedure",
    items: ["A partner advisor or law firm handles the procedure end to end", "For critical, time-sensitive steps (visa, residence permit, registration)"],
    cta: "I'm interested",
  },
];

export default function Plans() {
  const { log } = useApp();
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <main>
      <Header title="Plans" subtitle="Free for students. Many universities cover it." back="/profile" />
      <div className="space-y-3 px-4">
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          Pilot (January 2027): prices are <b>hypotheses being validated</b>, not final. No payment is taken in this demo; we only record interest.
        </p>
        {PLANS.map((p) => (
          <section key={p.id} className={`card p-4 ${p.id === "premium" ? "ring-2 ring-brand" : ""}`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-extrabold text-navy">{p.name}</h2>
              <span className="text-sm font-bold text-brand">{p.price}</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {p.items.map((i) => (
                <li key={i}>✓ {i}</li>
              ))}
            </ul>
            {p.id === "free" ? (
              <p className="mt-3 text-center text-sm font-semibold text-ok">{p.cta}</p>
            ) : chosen === p.id ? (
              <p className="mt-3 rounded-xl bg-ok-soft p-2 text-center text-sm font-semibold text-ok">Thanks! Interest recorded (demo).</p>
            ) : (
              <button
                className="btn-primary mt-3 w-full"
                onClick={() => {
                  setChosen(p.id);
                  log(p.id === "premium" ? "premium_interest" : "done_for_you_interest", { plan: p.id });
                }}
              >
                {p.cta}
              </button>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
