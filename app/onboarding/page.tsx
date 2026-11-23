"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react";
import { APP_NAME, destinations, getDestination, personas, purposeLabel } from "@/lib/content";
import { useApp } from "@/lib/store";
import type { Nationality, Purpose } from "@/lib/types";
import Contours from "@/components/chart/Contours";

/** Passport choices. Only EU vs non-EU changes the checklist; the label personalises the copy. */
const PASSPORTS: { country: string; label: string; value: Nationality }[] = [
  { country: "India", label: "Indian", value: "non-eu" },
  { country: "China", label: "Chinese", value: "non-eu" },
  { country: "United States", label: "American", value: "non-eu" },
  { country: "Mexico", label: "Mexican", value: "non-eu" },
  { country: "Colombia", label: "Colombian", value: "non-eu" },
  { country: "Brazil", label: "Brazilian", value: "non-eu" },
  { country: "Morocco", label: "Moroccan", value: "non-eu" },
  { country: "Another country outside the EU", label: "Other non-EU", value: "non-eu" },
  { country: "An EU, EEA or Swiss passport", label: "Other EU / EEA / Swiss", value: "eu" },
];

const REASONS: { value: Purpose; label: string; hint: string }[] = [
  { value: "study", label: "Studies", hint: "Degree, master or exchange" },
  { value: "internship", label: "Internship", hint: purposeLabel.internship },
  { value: "work", label: "Work", hint: "Employee or posted worker" },
];

const QUESTIONS = ["Which passport will you travel with?", "Which city are you moving to?", "Why are you moving?", "When do you arrive?"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function Onboarding() {
  const router = useRouter();
  const { startPersona, startCustom } = useApp();
  const [step, setStep] = useState(-1);
  const [passport, setPassport] = useState<number | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [arrival, setArrival] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the question so screen readers announce each new step.
  useEffect(() => {
    if (step >= 0) headingRef.current?.focus();
  }, [step]);

  const spain = destinations.filter((d) => d.country === "Spain");
  const others = destinations.filter((d) => d.country !== "Spain");

  function pick<T>(set: (v: T) => void, v: T) {
    set(v);
    // A short beat so the selection is seen before moving on.
    window.setTimeout(() => setStep((s) => Math.min(s + 1, QUESTIONS.length - 1)), 220);
  }

  function finish() {
    if (passport == null || !dest || !purpose || !arrival) return;
    const p = PASSPORTS[passport];
    startCustom({
      name: "",
      nationality: p.value,
      nationalityLabel: p.label,
      passport: `${p.label} passport`,
      phone: "—",
      email: "—",
      destinationId: dest,
      purpose,
      institution: "Your university",
      arrivalDate: arrival,
      duration: "Not set",
      neighbourhood: "—",
      accommodation: "Searching",
    });
    router.push("/home");
  }

  const tile = (active: boolean) =>
    `flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-start text-[16px] transition-colors duration-150 ${
      active ? "border-accent bg-accent text-white" : "border-line bg-card hover:border-ink"
    }`;

  if (step === -1)
    return (
      <main className="relative min-h-dvh overflow-hidden">
        <Contours levels={11} cx={0.85} cy={0.18} className="opacity-70" />
        <div className="relative mx-auto flex min-h-dvh max-w-[440px] flex-col px-6 pb-8 pt-6 lg:max-w-xl lg:pt-12">
          <span className="text-[20px] font-extrabold tracking-[-0.02em] [font-stretch:115%]">{APP_NAME}</span>

          <div className="mt-16">
            <h1 className="text-[44px] font-extrabold leading-[0.98] tracking-[-0.035em] [font-stretch:112%] [text-wrap:balance] lg:text-[60px]">
              Your paperwork for Spain, <span className="text-accent">in the right order.</span>
            </h1>
            <p className="mt-5 max-w-[40ch] text-[17px] leading-relaxed text-ink-2">
              Answer 4 questions and get your steps: what to do first, what each step unlocks, and the official source for every one.
            </p>
          </div>

          <div className="mt-auto pt-12">
            <button
              onClick={() => setStep(0)}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-accent px-7 text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-ink"
            >
              Start <ArrowRight size={18} className="flip-rtl" aria-hidden />
            </button>
            <p className="mt-3 text-center text-[14px] text-ink-3">Takes under a minute. No account needed.</p>

            <details className="group mt-8 border-t border-line pt-4">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-ink-2 hover:text-ink">
                Explore with a demo student
                <ChevronDown size={18} className="transition-transform duration-150 group-open:rotate-180" aria-hidden />
              </summary>
              <ul className="mt-2 divide-y divide-line">
                {personas.map((p) => {
                  const pd = getDestination(p.destinationId);
                  return (
                    <li key={p.id}>
                      <button
                        className="flex min-h-[52px] w-full items-center gap-3 py-2 text-start hover:text-accent"
                        onClick={() => {
                          startPersona(p.id);
                          router.push("/home");
                        }}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold">{p.name}</span>
                          <span className="block text-[13px] text-ink-3">
                            {p.nationalityLabel} · {purposeLabel[p.purpose]} · {pd.city}
                          </span>
                        </span>
                        <ArrowRight size={16} className="flip-rtl shrink-0 text-ink-3" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <a href="/office" className="mt-3 inline-flex min-h-[44px] items-center text-[14px] font-semibold text-accent hover:underline">
                For universities: international office view
              </a>
            </details>
          </div>
        </div>
      </main>
    );

  const canFinish = passport != null && !!dest && !!purpose && !!arrival;

  return (
    <main className="relative min-h-dvh">
      <div className="relative mx-auto flex min-h-dvh max-w-[440px] flex-col px-6 pb-8 pt-5 lg:max-w-xl lg:pt-12">
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(step - 1)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card hover:border-ink" aria-label="Back">
            <ArrowLeft size={18} className="flip-rtl" />
          </button>
          <span className="tabular text-[14px] font-semibold text-ink-3">
            {step + 1} of {QUESTIONS.length}
          </span>
        </div>
        <div className="mt-5 flex gap-1.5" role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={step}>
          {QUESTIONS.map((q, i) => (
            <span key={q} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= step ? "bg-accent" : "bg-paper-2"}`} />
          ))}
        </div>

        <h1 ref={headingRef} tabIndex={-1} className="mb-6 mt-8 text-[30px] font-extrabold leading-[1.05] tracking-[-0.025em] outline-none [font-stretch:110%] [text-wrap:balance]">
          {QUESTIONS[step]}
        </h1>

        <div className="flex-1">
          {step === 0 && (
            <div role="group" aria-label={QUESTIONS[0]} className="space-y-2">
              {PASSPORTS.map((p, i) => (
                <button key={p.label} onClick={() => pick(setPassport, i)} aria-pressed={passport === i} className={tile(passport === i)}>
                  <span>{p.country}</span>
                  {passport === i && <Check size={18} strokeWidth={3} aria-hidden />}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div role="group" aria-label="Spain" className="space-y-2">
                {spain.map((x) => (
                  <button key={x.id} onClick={() => pick(setDest, x.id)} aria-pressed={dest === x.id} className={tile(dest === x.id)}>
                    <span>
                      <span className="block font-semibold">{x.city}</span>
                      <span className={`block text-[13px] ${dest === x.id ? "text-white/80" : "text-ink-3"}`}>{x.country}</span>
                    </span>
                    {dest === x.id && <Check size={18} strokeWidth={3} aria-hidden />}
                  </button>
                ))}
                <div className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-ink-3" aria-disabled="true">
                  <span>
                    <span className="block font-semibold">Barcelona</span>
                    <span className="block text-[13px]">Coming soon: we only show steps we have verified</span>
                  </span>
                </div>
              </div>
              <details className="group">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-[15px] font-semibold text-ink-2 hover:text-ink">
                  Other cities (pilot)
                  <ChevronDown size={18} className="transition-transform duration-150 group-open:rotate-180" aria-hidden />
                </summary>
                <div role="group" aria-label="Other cities" className="mt-2 grid grid-cols-2 gap-2">
                  {others.map((x) => (
                    <button key={x.id} onClick={() => pick(setDest, x.id)} aria-pressed={dest === x.id} className={tile(dest === x.id)}>
                      <span>
                        <span className="block font-semibold">{x.city}</span>
                        <span className={`block text-[13px] ${dest === x.id ? "text-white/80" : "text-ink-3"}`}>{x.country}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </details>
            </div>
          )}

          {step === 2 && (
            <div role="group" aria-label={QUESTIONS[2]} className="space-y-2">
              {REASONS.map((r) => (
                <button key={r.value} onClick={() => pick(setPurpose, r.value)} aria-pressed={purpose === r.value} className={tile(purpose === r.value)}>
                  <span>
                    <span className="block font-semibold">{r.label}</span>
                    <span className={`block text-[13px] ${purpose === r.value ? "text-white/80" : "text-ink-3"}`}>{r.hint}</span>
                  </span>
                  {purpose === r.value && <Check size={18} strokeWidth={3} aria-hidden />}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                finish();
              }}
            >
              <label className="block">
                <span className="text-[15px] text-ink-2">Arrival date (an estimate is fine, you can change it later)</span>
                <input
                  type="date"
                  required
                  min={todayIso()}
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                  className="mt-3 block min-h-[56px] w-full rounded-2xl border border-line bg-card px-4 text-[17px] outline-none focus:border-accent"
                />
              </label>
              {!canFinish && arrival && <p className="mt-3 text-[14px] text-stamp">Go back and answer the earlier questions.</p>}
              <button
                type="submit"
                disabled={!canFinish}
                className="mt-8 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-ink disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-line disabled:bg-card disabled:text-ink-3"
              >
                Show my steps <ArrowRight size={18} className="flip-rtl" aria-hidden />
              </button>
            </form>
          )}
        </div>

        {step < 3 && (
          <p className="mt-6 text-[13px] text-ink-3">{step === 0 ? "Your passport decides whether you need a visa and a residence card." : step === 1 ? "Each city has its own offices and deadlines." : "Studies, internships and work have different permits."}</p>
        )}
      </div>
    </main>
  );
}
