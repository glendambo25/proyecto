"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BarChart3, Check, CircleHelp, LogOut, Star, Ticket, UserRoundCheck } from "lucide-react";
import { cityCode, formatDate, getDestination, personas, progressOf, purposeLabel } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { Header, Segments } from "@/components/ui";

function Row({ k, v, tone }: { k: string; v: React.ReactNode; tone?: "ok" | "warn" }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-[14px]">
      <span className="text-ink-3">{k}</span>
      <span className={`text-right font-semibold ${tone === "ok" ? "text-ok" : tone === "warn" ? "text-stamp" : ""}`}>{v}</span>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-ink" : "bg-paper-2"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="eyebrow mb-2 px-1">{title}</p>
      <div className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { profile, checklist, statuses, startPersona, reset, satisfaction, rate } = useApp();
  const router = useRouter();
  const [notif, setNotif] = useState(true);
  const [family, setFamily] = useState(false);
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const prog = progressOf(checklist, statuses);
  const done = (id: string) => statusOf(statuses, id) === "completed";
  const has = (id: string) => checklist.some((t) => t.id === id);
  const insuranceId = ["ehic", "health-non-eu", "insurance"].find(has);
  const visaId = ["visa", "ds160-interview"].find(has);
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <main>
      <Header eyebrow="Profile" title={profile.name.split(" ")[0]} />
      <div className="space-y-7 px-5">
        <section className="-mt-2 flex items-center gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-ink font-serif text-[32px] text-paper">{initials}</span>
          <div>
            <p className="text-[15px] font-semibold">{profile.name}</p>
            <p className="text-[13px] text-ink-2">
              {profile.purpose === "study" ? "Erasmus student" : purposeLabel[profile.purpose]} · {profile.institution}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.age && <span className="chip border-line text-ink-2">{profile.age} yrs</span>}
              <span className="chip border-line text-ink-2">{profile.purpose === "study" ? "Erasmus" : profile.purpose}</span>
              <span className="chip border-accent/30 bg-accent-soft text-accent">{cityCode[dest.id]} · {dest.city}</span>
            </div>
          </div>
        </section>

        <Link href="/tasks" className="card block p-4 transition hover:border-ink">
          <div className="flex items-baseline justify-between">
            <p className="text-[14px] font-semibold">Arrival preparation</p>
            <p className="font-mono text-[11px] text-ink-3">
              {prog.done} of {prog.total} · {prog.pct}%
            </p>
          </div>
          <div className="mt-3">
            <Segments total={prog.total} done={prog.done} />
          </div>
        </Link>

        <Group title="My details">
          <Row k="Nationality" v={profile.nationalityLabel} />
          <Row k="Passport" v={<span className="font-mono text-[12.5px]">{profile.passport}</span>} />
          <Row k="Phone" v={profile.phone} />
          <Row k="Email" v={profile.email} />
          <Row k="Arrival date" v={formatDate(profile.arrivalDate)} />
        </Group>

        <Group title="Destination">
          <Row k="City" v={`${dest.city}, ${dest.country}`} />
          <Row k={profile.purpose === "study" ? "University" : "Host"} v={profile.institution} />
          <Row k="Accommodation" v={done("accommodation") ? "Confirmed" : profile.accommodation} tone={done("accommodation") ? "ok" : "warn"} />
          <Row k="Neighbourhood" v={profile.neighbourhood} />
        </Group>

        <Group title="Documents">
          <Row k="Passport / ID" v={<Check size={16} className="inline text-ok" />} />
          {insuranceId && <Row k="Insurance" v={done(insuranceId) ? <Check size={16} className="inline" /> : "Pending"} tone={done(insuranceId) ? "ok" : "warn"} />}
          <Row k="Visa" v={visaId ? (done(visaId) ? <Check size={16} className="inline" /> : "Pending") : "Not needed (EU)"} tone={visaId ? (done(visaId) ? "ok" : "warn") : "ok"} />
          <Row k="Contract" v={done("accommodation") ? <Check size={16} className="inline" /> : "Pending"} tone={done("accommodation") ? "ok" : "warn"} />
          <Link href="/documents" className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-accent">
            Open document wallet <ArrowRight size={15} />
          </Link>
        </Group>

        <Group title="Preferences">
          <Row k="App language" v="English" />
          <div className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="text-ink-3">Deadline reminders</span>
            <Toggle on={notif} onChange={setNotif} label="Deadline reminders" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="text-ink-3">Linked family account</span>
            <Toggle on={family} onChange={setFamily} label="Linked family account" />
          </div>
          <Row k="Privacy" v="Data stays on this device" />
        </Group>

        <section className="card p-4">
          <p className="text-[14px] font-semibold">How useful is the app so far?</p>
          <div className="mt-3 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => rate(n)} aria-label={`${n} stars`} className={`grid h-11 flex-1 place-items-center rounded-2xl border transition ${satisfaction && n <= satisfaction ? "border-ink bg-ink text-paper" : "border-line text-ink-3 hover:border-ink"}`}>
                <Star size={16} fill={satisfaction && n <= satisfaction ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </section>

        <Group title="Help & support">
          {[
            { href: "/chat/assistant", label: "Help centre", Icon: CircleHelp },
            { href: "/chat/advisor", label: "Contact an advisor", Icon: UserRoundCheck },
            { href: "/plans", label: "Plans", Icon: Ticket },
            { href: "/office", label: "International office view", Icon: BarChart3 },
          ].map(({ href, label, Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 text-[14px] font-semibold transition hover:bg-paper">
              <Icon size={17} className="text-ink-3" />
              <span className="flex-1">{label}</span>
              <ArrowRight size={15} className="text-ink-3" />
            </Link>
          ))}
          <button
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[14px] font-semibold text-stamp transition hover:bg-paper"
            onClick={() => {
              reset();
              router.push("/onboarding");
            }}
          >
            <LogOut size={17} /> Log out (reset demo)
          </button>
        </Group>

        <section>
          <p className="eyebrow mb-2 px-1">Demo · switch traveller</p>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
            {personas.map((p) => {
              const pd = getDestination(p.destinationId);
              const active = profile.personaId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    startPersona(p.id);
                    router.push("/home");
                  }}
                  className={`w-32 shrink-0 rounded-[20px] border p-3 text-left transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"}`}
                >
                  <span className={`font-mono text-[11px] ${active ? "text-paper/60" : "text-accent"}`}>{cityCode[pd.id]}</span>
                  <span className="mt-4 block font-serif text-[20px] leading-none">{p.name.split(" ")[0]}</span>
                  <span className={`mt-1 block text-[11px] ${active ? "text-paper/60" : "text-ink-3"}`}>{p.nationalityLabel}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
