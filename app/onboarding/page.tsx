"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { APP_NAME, cityCode, destinations, getDestination, personas, purposeLabel } from "@/lib/content";
import { daysFromArrival, readout } from "@/lib/chart";
import { DesignSwitch, useDesign } from "@/lib/design";
import { useApp } from "@/lib/store";
import type { Nationality, Purpose } from "@/lib/types";
import Contours from "@/components/chart/Contours";

const NATIONALITIES: { label: string; value: Nationality }[] = [
  { label: "Indian", value: "non-eu" },
  { label: "Chinese", value: "non-eu" },
  { label: "Other non-EU", value: "non-eu" },
  { label: "Spanish", value: "eu" },
  { label: "Other EU / EEA / Swiss", value: "eu" },
];

export default function Onboarding() {
  const router = useRouter();
  const [variant] = useDesign();
  const chart = variant === "chart";
  const { startPersona, startCustom } = useApp();
  const [step, setStep] = useState(-1);
  const [nat, setNat] = useState(0);
  const [dest, setDest] = useState("madrid");
  const [purpose, setPurpose] = useState<Purpose>("study");
  const [institution, setInstitution] = useState("");
  const [arrival, setArrival] = useState("2027-02-01");
  const [duration, setDuration] = useState("1 semester");
  const [name, setName] = useState("");
  const d = getDestination(dest);
  const steps = ["About you", "Destination", "Purpose and dates"];

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

  const choice = (active: boolean) =>
    `flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] transition-colors duration-150 ${
      active ? (chart ? "border-accent bg-accent text-white" : "border-ink bg-ink text-white") : "border-line bg-card hover:border-ink"
    }`;

  if (step === -1)
    return (
      <main className={`relative min-h-dvh ${chart ? "" : "font-ui"}`}>
        {chart && <Contours levels={13} cx={0.82} cy={0.25} />}
        <div className="relative mx-auto flex min-h-dvh max-w-[440px] flex-col px-6 pb-10 pt-6 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20 lg:px-14 lg:pt-10">
          <div className="flex flex-col lg:sticky lg:top-10 lg:pb-10">
            <div className="flex items-center justify-between">
              <span className={chart ? "text-[20px] font-extrabold tracking-[-0.02em] [font-stretch:115%]" : "text-[17px] font-semibold"}>{APP_NAME}</span>
              <DesignSwitch />
            </div>

            <div className="mt-14 lg:mt-14">
              {chart ? (
                <h1 className="text-[50px] font-extrabold leading-[0.95] tracking-[-0.035em] [font-stretch:112%] [text-wrap:balance] lg:text-[76px] lg:[font-stretch:106%]">
                  You move.
                  <br />
                  <span className="text-accent">We chart</span>
                  <br />
                  the paperwork.
                </h1>
              ) : (
                <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[52px]">
                  You move.
                  <br />
                  We handle the paperwork.
                </h1>
              )}
              <p className="mt-5 max-w-[42ch] text-[16px] leading-relaxed text-ink-2 lg:text-[18px]">
                Your steps for your city, passport and reason for moving, in the order that works, each with the official source and the date it was last checked.
              </p>
            </div>

            {chart && <ExampleRoute />}

            <div className="mt-auto pt-10 lg:mt-10 lg:pt-0">
              <button
                onClick={() => setStep(0)}
                className={`flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-[16px] font-semibold text-white transition-colors duration-150 lg:w-auto ${chart ? "bg-accent hover:bg-ink" : "bg-ink hover:bg-accent"}`}
              >
                Build my checklist <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <section className="mt-14 lg:mt-0 lg:self-center">
            <h2 className={chart ? "text-[22px] font-extrabold tracking-[-0.01em] [font-stretch:110%]" : "text-[17px] font-semibold"}>Or open a demo traveller</h2>
            <p className="mb-4 mt-1 text-[14px] text-ink-3">Fictional people, based on real interview cases.</p>
            <ul className="divide-y divide-line border-y border-line">
              {personas.map((p) => {
                const pd = getDestination(p.destinationId);
                const r = readout(daysFromArrival(p.arrivalDate));
                return (
                  <li key={p.id}>
                    <button
                      className="group flex w-full items-center gap-4 py-4 text-left"
                      onClick={() => {
                        startPersona(p.id);
                        router.push("/home");
                      }}
                    >
                      {chart ? (
                        <span className="tabular w-14 shrink-0 text-[22px] font-extrabold leading-none text-accent [font-stretch:75%]">{cityCode[pd.id]}</span>
                      ) : (
                        <span className="w-10 shrink-0 text-[13px] font-medium text-ink-3">{cityCode[pd.id]}</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold group-hover:text-accent">
                          {p.name} <span className="font-normal text-ink-3">· {p.nationalityLabel}</span>
                        </span>
                        <span className="block truncate text-[13px] text-ink-3">
                          {purposeLabel[p.purpose]} in {pd.city} · {r.value} {r.label}
                        </span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <a href="/office" className="mt-5 inline-block text-[14px] font-semibold text-accent hover:underline">
              International office view →
            </a>
          </section>
        </div>
      </main>
    );

  return (
    <main className={`relative min-h-dvh ${chart ? "" : "font-ui"}`}>
      {chart && <Contours levels={10} className="opacity-70" />}
      <div className="relative mx-auto flex min-h-dvh max-w-[440px] flex-col px-6 pb-8 pt-6 lg:max-w-xl lg:pt-12">
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(step - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card hover:border-ink" aria-label="Back">
            <ArrowLeft size={16} />
          </button>
          <span className="tabular text-[13px] text-ink-3">
            {step + 1} of {steps.length}
          </span>
        </div>
        <div className="mt-6 flex gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <span key={s} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= step ? (chart ? "bg-accent" : "bg-ink") : "bg-paper-2"}`} />
          ))}
        </div>

        <h1 className={`mb-8 mt-10 ${chart ? "text-[40px] font-extrabold leading-[1] tracking-[-0.03em] [font-stretch:115%]" : "text-[28px] font-semibold tracking-[-0.015em]"}`}>
          {step === 0 && "Who is travelling?"}
          {step === 1 && "Where are you going?"}
          {step === 2 && "Why, and when?"}
        </h1>

        <div className="flex-1 space-y-6">
          {step === 0 && (
            <>
              <label className="block">
                <span className="text-[13px] font-medium text-ink-2">First name</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-[16px] outline-none transition-colors duration-150 placeholder:text-ink-3 focus:border-accent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya"
                  autoComplete="given-name"
                />
              </label>
              <fieldset className="space-y-2">
                <legend className="mb-2 text-[13px] font-medium text-ink-2">Passport</legend>
                {NATIONALITIES.map((n, i) => (
                  <button key={n.label} onClick={() => setNat(i)} aria-pressed={nat === i} className={choice(nat === i)}>
                    <span>{n.label}</span>
                    {nat === i && <Check size={16} strokeWidth={3} />}
                  </button>
                ))}
              </fieldset>
            </>
          )}

          {step === 1 && (
            <>
              <fieldset className="grid grid-cols-2 gap-2">
                <legend className="mb-2 text-[13px] font-medium text-ink-2">City</legend>
                {destinations.map((x) => (
                  <button key={x.id} onClick={() => setDest(x.id)} aria-pressed={dest === x.id} className={`${choice(dest === x.id)} flex-col items-start`}>
                    {chart && <span className="text-[28px] font-extrabold leading-none [font-stretch:75%]">{cityCode[x.id]}</span>}
                    <span className="font-semibold">{x.city}</span>
                    <span className={`text-[12px] ${dest === x.id ? "text-white/70" : "text-ink-3"}`}>{x.country}</span>
                  </button>
                ))}
              </fieldset>
              <label className="block">
                <span className="text-[13px] font-medium text-ink-2">University or company</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-[16px] outline-none placeholder:text-ink-3 focus:border-accent"
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
                <legend className="mb-2 text-[13px] font-medium text-ink-2">Reason</legend>
                {(Object.keys(purposeLabel) as Purpose[]).map((p) => (
                  <button key={p} onClick={() => setPurpose(p)} aria-pressed={purpose === p} className={choice(purpose === p)}>
                    <span>{purposeLabel[p]}</span>
                    {purpose === p && <Check size={16} strokeWidth={3} />}
                  </button>
                ))}
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[13px] font-medium text-ink-2">Arrival</span>
                  <input type="date" className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3 text-[15px] focus:border-accent" value={arrival} onChange={(e) => setArrival(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-ink-2">Length of stay</span>
                  <select className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3 text-[15px] focus:border-accent" value={duration} onChange={(e) => setDuration(e.target.value)}>
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

        <button
          onClick={() => (step < 2 ? setStep(step + 1) : finish())}
          className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[16px] font-semibold text-white transition-colors duration-150 ${chart ? "bg-accent hover:bg-ink" : "bg-ink hover:bg-accent"}`}
        >
          {step < 2 ? "Continue" : "Generate my checklist"} <ArrowRight size={17} />
        </button>
      </div>
    </main>
  );
}

/** A small charted route on the welcome screen, labelled as an example. */
function ExampleRoute() {
  const stops = ["Study visa", "Residence permit", "Address registration"];
  return (
    <figure className="mt-8 max-w-[380px]">
      <svg viewBox="0 0 360 96" className="w-full" aria-hidden>
        <line x1="14" x2="346" y1="58" y2="58" stroke="#111827" strokeOpacity="0.18" />
        <path d="M30 58 C 80 6, 150 6, 180 58" fill="none" stroke="#4f46e5" strokeWidth="2" />
        <path d="M180 58 C 220 14, 300 14, 330 58" fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="30" cy="58" r="8" fill="#16a34a" />
        <circle cx="180" cy="58" r="8" fill="#fff" stroke="#4f46e5" strokeWidth="3" />
        <circle cx="330" cy="58" r="8" fill="#fff" stroke="#111827" strokeWidth="2" />
      </svg>
      <div className="grid grid-cols-3 text-[12.5px] font-semibold">
        {stops.map((s, i) => (
          <span key={s} className={i === 1 ? "text-center" : i === 2 ? "text-right" : ""}>
            {s}
          </span>
        ))}
      </div>
      <figcaption className="mt-1 font-hand text-[22px] text-accent">an example route: each arc is a step you must finish first</figcaption>
    </figure>
  );
}
