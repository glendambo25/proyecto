"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react";
import { destinations, getDestination, personas, purposeLabel } from "@/lib/content";
import { useApp } from "@/lib/store";
import { withDemo } from "@/lib/demo";
import type { Nationality, Purpose } from "@/lib/types";
import Contours from "@/components/chart/Contours";
import NomadLogo from "@/components/brand/NomadLogo";

/**
 * Passport choices. Only EU vs non-EU changes the checklist; the label personalises the copy.
 * `region` is an ISO 3166 code so the country name comes from Intl.DisplayNames in the user's language.
 */
const PASSPORTS: { region?: string; key?: "otherNonEu" | "eu"; label: string; value: Nationality }[] = [
  { region: "IN", label: "Indian", value: "non-eu" },
  { region: "CN", label: "Chinese", value: "non-eu" },
  { region: "US", label: "American", value: "non-eu" },
  { region: "MX", label: "Mexican", value: "non-eu" },
  { region: "CO", label: "Colombian", value: "non-eu" },
  { region: "BR", label: "Brazilian", value: "non-eu" },
  { region: "MA", label: "Moroccan", value: "non-eu" },
  { key: "otherNonEu", label: "Other non-EU", value: "non-eu" },
  { key: "eu", label: "Other EU / EEA / Swiss", value: "eu" },
];

const REASONS: Purpose[] = ["study", "internship", "work"];
const QUESTIONS = ["passport", "city", "reason", "arrival"] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function Onboarding() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const { startPersona, startCustom } = useApp();
  const [step, setStep] = useState(-1);
  const [passport, setPassport] = useState<number | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [arrival, setArrival] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const regionName = useMemo(() => {
    try {
      const dn = new Intl.DisplayNames([locale, "en"], { type: "region" });
      return (code: string) => dn.of(code) ?? code;
    } catch {
      return (code: string) => code;
    }
  }, [locale]);

  // Move focus to the question so screen readers announce each new step.
  useEffect(() => {
    if (step >= 0) headingRef.current?.focus();
  }, [step]);

  const spain = destinations.filter((d) => d.country === "Spain");
  const others = destinations.filter((d) => d.country !== "Spain");
  const question = step >= 0 ? t(`questions.${QUESTIONS[step]}`) : "";

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
          <NomadLogo height={30} className="text-ink" />

          <div className="mt-16">
            <h1 className="text-[44px] font-extrabold leading-[0.98] tracking-[-0.035em] [font-stretch:112%] [text-wrap:balance] lg:text-[60px]">
              {t("welcome.title")} <span className="text-accent">{t("welcome.titleAccent")}</span>
            </h1>
            <p className="mt-5 max-w-[40ch] text-[17px] leading-relaxed text-ink-2">{t("welcome.lead")}</p>
          </div>

          <div className="mt-auto pt-12">
            <button
              onClick={() => setStep(0)}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-accent px-7 text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-ink"
            >
              {t("welcome.start")} <ArrowRight size={18} className="flip-rtl" aria-hidden />
            </button>
            <p className="mt-3 text-center text-[14px] text-ink-3">{t("welcome.startNote")}</p>

            <details className="group mt-8 border-t border-line pt-4">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-ink-2 hover:text-ink">
                {t("welcome.demo")}
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
                {t("welcome.office")}
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
          <button onClick={() => setStep(step - 1)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card hover:border-ink" aria-label={t("back")}>
            <ArrowLeft size={18} className="flip-rtl" />
          </button>
          <span className="tabular text-[14px] font-semibold text-ink-3">{t("position", { n: step + 1, total: QUESTIONS.length })}</span>
        </div>
        <div className="mt-5 flex gap-1.5" role="progressbar" aria-label={t("answered")} aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={step}>
          {QUESTIONS.map((q, i) => (
            <span key={q} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= step ? "bg-accent" : "bg-paper-2"}`} />
          ))}
        </div>

        <h1 ref={headingRef} tabIndex={-1} className="mb-6 mt-8 text-[30px] font-extrabold leading-[1.05] tracking-[-0.025em] outline-none [font-stretch:110%] [text-wrap:balance]">
          {question}
        </h1>

        <div className="flex-1">
          {step === 0 && (
            <div role="group" aria-label={question} className="space-y-2">
              {PASSPORTS.map((p, i) => (
                <button key={p.label} onClick={() => pick(setPassport, i)} aria-pressed={passport === i} className={tile(passport === i)}>
                  <span>{p.region ? regionName(p.region) : t(`passport.${p.key}`)}</span>
                  {passport === i && <Check size={18} strokeWidth={3} aria-hidden />}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div role="group" aria-label={t("city.spain")} className="space-y-2">
                {spain.map((x) => (
                  <button key={x.id} onClick={() => pick(setDest, x.id)} aria-pressed={dest === x.id} className={tile(dest === x.id)}>
                    <span>
                      <span className="block font-semibold">{x.city}</span>
                      <span className={`block text-[13px] ${dest === x.id ? "text-white/80" : "text-ink-3"}`}>{regionName("ES")}</span>
                    </span>
                    {dest === x.id && <Check size={18} strokeWidth={3} aria-hidden />}
                  </button>
                ))}
                <div className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-ink-3" aria-disabled="true">
                  <span>
                    <span className="block font-semibold">Barcelona</span>
                    <span className="block text-[13px]">{t("city.comingSoon")}</span>
                  </span>
                </div>
              </div>
              <details className="group">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-[15px] font-semibold text-ink-2 hover:text-ink">
                  {t("city.others")}
                  <ChevronDown size={18} className="transition-transform duration-150 group-open:rotate-180" aria-hidden />
                </summary>
                <div role="group" aria-label={t("city.others")} className="mt-2 grid grid-cols-2 gap-2">
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
            <div role="group" aria-label={question} className="space-y-2">
              {REASONS.map((r) => (
                <button key={r} onClick={() => pick(setPurpose, r)} aria-pressed={purpose === r} className={tile(purpose === r)}>
                  <span>
                    <span className="block font-semibold">{t(`reasons.${r}.label`)}</span>
                    <span className={`block text-[13px] ${purpose === r ? "text-white/80" : "text-ink-3"}`}>{t(`reasons.${r}.hint`)}</span>
                  </span>
                  {purpose === r && <Check size={18} strokeWidth={3} aria-hidden />}
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
                <span className="text-[15px] text-ink-2">{t("arrival.label")}</span>
                <input
                  type="date"
                  required
                  min={todayIso()}
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                  className="mt-3 block min-h-[56px] w-full rounded-2xl border border-line bg-card px-4 text-[17px] outline-none focus:border-accent"
                />
              </label>
              {!canFinish && arrival && <p className="mt-3 text-[14px] text-stamp">{t("arrival.missing")}</p>}
              <button
                type="submit"
                disabled={!canFinish}
                className="mt-8 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-ink disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-line disabled:bg-card disabled:text-ink-3"
              >
                {t("arrival.finish")} <ArrowRight size={18} className="flip-rtl" aria-hidden />
              </button>
            </form>
          )}
        </div>

        {step < 3 && <p className="mt-6 text-[13px] text-ink-3">{t(`hints.${QUESTIONS[step] as "passport" | "city" | "reason"}`)}</p>}
      </div>
    </main>
  );
}
