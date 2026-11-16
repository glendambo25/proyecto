"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { APP_NAME, cityCode, destinations, getDestination, personas, purposeLabel } from "@/lib/content";
import { useApp } from "@/lib/store";
import type { Nationality, Purpose } from "@/lib/types";

const NATIONALITIES: { label: string; value: Nationality }[] = [
  { label: "Spanish", value: "eu" },
  { label: "Other EU / EEA / Swiss", value: "eu" },
  { label: "Indian", value: "non-eu" },
  { label: "Chinese", value: "non-eu" },
  { label: "Other non-EU", value: "non-eu" },
];

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] transition ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-ink"
      }`}
    >
      <span>{children}</span>
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-paper bg-paper text-ink" : "border-line"}`}>{active && <Check size={12} strokeWidth={3} />}</span>
    </button>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { startPersona, startCustom } = useApp();
  const [step, setStep] = useState(-1);
  const [nat, setNat] = useState(0);
  const [dest, setDest] = useState("turin");
  const [purpose, setPurpose] = useState<Purpose>("study");
  const [institution, setInstitution] = useState("");
  const [arrival, setArrival] = useState("2027-02-01");
  const [duration, setDuration] = useState("1 semester");
  const [name, setName] = useState("");
  const d = getDestination(dest);
  const steps = ["About you", "Destination", "Purpose & dates"];

  function finish() {
    const n = NATIONALITIES[nat];
    startCustom({
      name: name.trim() || "Guest",
      nationality: n.value,
      nationalityLabel: n.label,
      passport: `${n.label} passport`,
      phone: "—",
      email: "—",
      destinationId: dest,
      purpose,
      institution: institution.trim() || d.institutions[0],
      arrivalDate: arrival,
      duration,
      neighbourhood: "—",
      accommodation: "Searching",
    });
    router.push("/home");
  }

  if (step === -1)
    return (
      <main className="flex min-h-dvh flex-col px-6 pb-10 pt-8">
        <div className="flex items-center justify-between">
          <span className="font-serif text-2xl">{APP_NAME}</span>
          <span className="eyebrow">Pilot · 2027</span>
        </div>

        <div className="mt-12">
          <p className="eyebrow mb-4">For students, interns & movers</p>
          <h1 className="display rise text-[64px]">
            You move.
            <br />
            <em className="text-accent">We handle</em>
            <br />
            the paperwork.
          </h1>
          <p className="mt-6 max-w-[34ch] text-[15px] leading-relaxed text-ink-2">
            A checklist for your city, passport and reason for moving — in the right order, with the official source and the date we last checked it.
          </p>
        </div>

        {/* destinations marquee as luggage tags */}
        <div className="mt-8 flex flex-wrap gap-2">
          {destinations.map((x) => (
            <span key={x.id} className="rounded-full border border-line bg-card px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-2">
              {cityCode[x.id]} · {x.city}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-10">
          <button className="btn-primary w-full" onClick={() => setStep(0)}>
            Build my checklist <ArrowRight size={16} />
          </button>
        </div>

        <section className="mt-12">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-[26px]">Or try a demo traveller</h2>
          </div>
          <p className="mb-4 text-[13px] text-ink-3">Fictional profiles based on real interview cases.</p>
          <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card">
            {personas.map((p) => {
              const pd = getDestination(p.destinationId);
              return (
                <li key={p.id}>
                  <button
                    className="group flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-paper"
                    onClick={() => {
                      startPersona(p.id);
                      router.push("/home");
                    }}
                  >
                    <span className="w-12 shrink-0 font-mono text-[13px] font-medium text-accent">{cityCode[pd.id]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">
                        {p.name} <span className="font-normal text-ink-3">· {p.nationalityLabel}</span>
                      </span>
                      <span className="block truncate text-[12.5px] text-ink-3">
                        {purposeLabel[p.purpose]} in {pd.city} — {p.note}
                      </span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </button>
                </li>
              );
            })}
          </ul>
          <a href="/office" className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
            International office view (B2B) <ArrowUpRight size={14} />
          </a>
        </section>
      </main>
    );

  return (
    <main className="flex min-h-dvh flex-col px-6 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setStep(step - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card" aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <span className="eyebrow">
          Step {step + 1} / {steps.length}
        </span>
      </div>
      <div className="mt-6 flex gap-1.5" aria-hidden>
        {steps.map((s, i) => (
          <span key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-ink" : "bg-paper-2"}`} />
        ))}
      </div>

      <p className="eyebrow mt-10">{steps[step]}</p>
      <h1 className="display mb-8 mt-2 text-[44px]">
        {step === 0 && (
          <>
            Who’s <em>travelling?</em>
          </>
        )}
        {step === 1 && (
          <>
            Where are <em>you going?</em>
          </>
        )}
        {step === 2 && (
          <>
            Why, and <em>when?</em>
          </>
        )}
      </h1>

      <div className="flex-1 space-y-5">
        {step === 0 && (
          <>
            <label className="block">
              <span className="eyebrow">First name</span>
              <input
                className="mt-2 w-full border-b-2 border-line bg-transparent pb-2 font-serif text-[30px] outline-none placeholder:text-ink-3/50 focus:border-ink"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Eduardo"
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="eyebrow mb-2">Passport</legend>
              {NATIONALITIES.map((n, i) => (
                <Option key={n.label} active={nat === i} onClick={() => setNat(i)}>
                  {n.label}
                </Option>
              ))}
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="eyebrow mb-2">City</legend>
              {destinations.map((x) => (
                <button
                  key={x.id}
                  onClick={() => setDest(x.id)}
                  aria-pressed={dest === x.id}
                  className={`rounded-2xl border p-4 text-left transition ${dest === x.id ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"}`}
                >
                  <span className="block font-serif text-[34px] leading-none">{cityCode[x.id]}</span>
                  <span className="mt-2 block text-[13px] font-semibold">{x.city}</span>
                  <span className={`block text-[11px] ${dest === x.id ? "text-paper/60" : "text-ink-3"}`}>{x.country}</span>
                </button>
              ))}
            </fieldset>
            <label className="block">
              <span className="eyebrow">Institution or company</span>
              <input
                className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-[15px] outline-none focus:border-ink"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={d.institutions[0]}
                list="inst"
              />
              <datalist id="inst">
                {d.institutions.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <fieldset className="space-y-2">
              <legend className="eyebrow mb-2">Reason</legend>
              {(Object.keys(purposeLabel) as Purpose[]).map((p) => (
                <Option key={p} active={purpose === p} onClick={() => setPurpose(p)}>
                  {purposeLabel[p]}
                </Option>
              ))}
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow">Arrival</span>
                <input type="date" className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3 text-[14px]" value={arrival} onChange={(e) => setArrival(e.target.value)} />
              </label>
              <label className="block">
                <span className="eyebrow">Duration</span>
                <select className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3 text-[14px]" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option>3 months</option>
                  <option>1 semester</option>
                  <option>1 academic year</option>
                  <option>More than 1 year</option>
                </select>
              </label>
            </div>
          </>
        )}
      </div>

      <button className="btn-primary mt-8 w-full" onClick={() => (step < 2 ? setStep(step + 1) : finish())}>
        {step < 2 ? "Continue" : "Generate my checklist"} <ArrowRight size={16} />
      </button>
    </main>
  );
}
