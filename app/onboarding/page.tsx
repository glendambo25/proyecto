"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME, TAGLINE, destinations, getDestination, personas, purposeLabel } from "@/lib/content";
import { useApp } from "@/lib/store";
import type { Nationality, Purpose } from "@/lib/types";

const NATIONALITIES: { label: string; value: Nationality }[] = [
  { label: "Spanish", value: "eu" },
  { label: "Other EU / EEA / Swiss", value: "eu" },
  { label: "Indian", value: "non-eu" },
  { label: "Chinese", value: "non-eu" },
  { label: "Other non-EU", value: "non-eu" },
];

export default function Onboarding() {
  const router = useRouter();
  const { startPersona, startCustom } = useApp();
  const [step, setStep] = useState(0);
  const [nat, setNat] = useState(0);
  const [dest, setDest] = useState("turin");
  const [purpose, setPurpose] = useState<Purpose>("study");
  const [institution, setInstitution] = useState("");
  const [arrival, setArrival] = useState("2027-02-01");
  const [duration, setDuration] = useState("1 semester");
  const [name, setName] = useState("");

  const d = getDestination(dest);
  const steps = ["Who are you?", "Where are you going?", "Why and when?"];

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

  return (
    <main className="px-5 pb-10 pt-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-navy to-brand p-6 text-white">
        <p className="text-sm font-semibold opacity-80">{APP_NAME}</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">{TAGLINE}</h1>
        <p className="mt-2 text-sm opacity-90">Answer 3 quick questions and get a checklist for your city, nationality and reason for moving — in the right order, with official sources.</p>
      </div>

      <section className="card p-5">
        <ol className="mb-4 flex gap-2" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-brand-soft"}`} aria-current={i === step ? "step" : undefined} />
          ))}
        </ol>
        <h2 className="mb-4 text-lg font-bold text-navy">{steps[step]}</h2>

        {step === 0 && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold">
              First name
              <input className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eduardo" />
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Nationality / passport</legend>
              <div className="grid grid-cols-2 gap-2">
                {NATIONALITIES.map((n, i) => (
                  <button key={n.label} onClick={() => setNat(i)} className={`rounded-xl border px-3 py-2.5 text-left text-sm ${nat === i ? "border-brand bg-brand-soft font-semibold text-navy" : "border-gray-200"}`}>
                    {n.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Destination city</legend>
              <div className="grid grid-cols-2 gap-2">
                {destinations.map((x) => (
                  <button key={x.id} onClick={() => setDest(x.id)} className={`rounded-xl border px-3 py-2.5 text-left text-sm ${dest === x.id ? "border-brand bg-brand-soft font-semibold text-navy" : "border-gray-200"}`}>
                    {x.flag} {x.city}
                    <span className="block text-xs text-gray-500">{x.country}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-semibold">
              Institution or company
              <input className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder={d.institutions[0]} list="inst" />
              <datalist id="inst">
                {d.institutions.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Reason for moving</legend>
              <div className="grid gap-2">
                {(Object.keys(purposeLabel) as Purpose[]).map((p) => (
                  <button key={p} onClick={() => setPurpose(p)} className={`rounded-xl border px-3 py-2.5 text-left text-sm ${purpose === p ? "border-brand bg-brand-soft font-semibold text-navy" : "border-gray-200"}`}>
                    {purposeLabel[p]}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold">
                Arrival date
                <input type="date" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5" value={arrival} onChange={(e) => setArrival(e.target.value)} />
              </label>
              <label className="block text-sm font-semibold">
                Duration
                <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option>3 months</option>
                  <option>1 semester</option>
                  <option>1 academic year</option>
                  <option>More than 1 year</option>
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button className="btn-ghost flex-1" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < 2 ? (
            <button className="btn-primary flex-1" onClick={() => setStep(step + 1)}>
              Continue
            </button>
          ) : (
            <button className="btn-primary flex-1" onClick={finish}>
              Generate my checklist
            </button>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-gray-500">Demo profiles</h2>
        <p className="mb-3 text-xs text-gray-500">Fictional users based on the interview cases. Switch any time from Profile.</p>
        <div className="grid gap-2">
          {personas.map((p) => {
            const pd = getDestination(p.destinationId);
            return (
              <button
                key={p.id}
                className="card flex items-center gap-3 p-3 text-left hover:ring-2 hover:ring-brand"
                onClick={() => {
                  startPersona(p.id);
                  router.push("/home");
                }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-lg">{pd.flag}</span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-navy">
                    {p.name} · {pd.city}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {p.nationalityLabel} · {purposeLabel[p.purpose]} — {p.note}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <a href="/office" className="mt-4 block text-center text-sm font-semibold text-brand underline">
          International office view (B2B demo) →
        </a>
      </section>
    </main>
  );
}
