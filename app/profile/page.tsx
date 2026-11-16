"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate, getDestination, personas, progressOf, purposeLabel } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { Header } from "@/components/ui";

function Row({ k, v, ok }: { k: string; v: React.ReactNode; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm last:border-0">
      <span className="text-gray-500">{k}</span>
      <span className={`text-right font-semibold ${ok === undefined ? "text-navy" : ok ? "text-ok" : "text-amber-600"}`}>{v}</span>
    </div>
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
      <Header title="Profile" />
      <div className="space-y-4 px-4">
        <section className="card flex items-center gap-4 p-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-navy to-brand text-xl font-extrabold text-white">{initials}</span>
          <div>
            <h2 className="text-lg font-extrabold text-navy">{profile.name}</h2>
            <p className="text-sm text-gray-500">
              {purposeLabel[profile.purpose]} · {profile.institution}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.age && <span className="chip bg-brand-soft text-navy">{profile.age}</span>}
              <span className="chip bg-brand-soft text-navy">{profile.purpose === "study" ? "Erasmus" : purposeLabel[profile.purpose]}</span>
              <span className="chip bg-brand-soft text-navy">{dest.city}</span>
            </div>
          </div>
        </section>

        <Link href="/tasks" className="card block p-4">
          <p className="text-sm font-bold text-navy">Arrival preparation</p>
          <p className="text-sm text-gray-500">
            {prog.done} of {prog.total} steps · {prog.pct}%
          </p>
          <div className="mt-2 h-2 rounded-full bg-brand-soft">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${prog.pct}%` }} />
          </div>
        </Link>

        <section className="card px-4 py-2">
          <h3 className="pt-2 text-xs font-bold uppercase text-gray-500">My details</h3>
          <Row k="Nationality" v={profile.nationalityLabel} />
          <Row k="Passport" v={profile.passport} />
          <Row k="Phone" v={profile.phone} />
          <Row k="Email" v={profile.email} />
          <Row k="Arrival date" v={formatDate(profile.arrivalDate)} />
        </section>

        <section className="card px-4 py-2">
          <h3 className="pt-2 text-xs font-bold uppercase text-gray-500">Destination</h3>
          <Row k="City" v={`${dest.flag} ${dest.city}`} />
          <Row k={profile.purpose === "study" ? "University" : "Host"} v={profile.institution} />
          <Row k="Accommodation" v={done("accommodation") ? "Confirmed" : profile.accommodation} ok={done("accommodation")} />
          <Row k="Neighbourhood" v={profile.neighbourhood} />
        </section>

        <section className="card px-4 py-2">
          <h3 className="pt-2 text-xs font-bold uppercase text-gray-500">Documents</h3>
          <Row k="Passport / ID" v="✓" ok />
          {insuranceId && <Row k="Insurance" v={done(insuranceId) ? "✓" : "Pending"} ok={done(insuranceId)} />}
          <Row k="Visa" v={visaId ? (done(visaId) ? "✓" : "Pending") : "✓ Not needed (EU)"} ok={visaId ? done(visaId) : true} />
          <Row k="Contract" v={done("accommodation") ? "✓" : "Pending"} ok={done("accommodation")} />
        </section>

        <section className="card px-4 py-2">
          <h3 className="pt-2 text-xs font-bold uppercase text-gray-500">Preferences</h3>
          <Row k="App language" v="English" />
          <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
            <span className="text-gray-500">Notifications & deadline reminders</span>
            <input type="checkbox" checked={notif} onChange={(e) => setNotif(e.target.checked)} className="h-5 w-5 accent-brand" aria-label="Notifications" />
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
            <span className="text-gray-500">Linked family account</span>
            <input type="checkbox" checked={family} onChange={(e) => setFamily(e.target.checked)} className="h-5 w-5 accent-brand" aria-label="Linked family account" />
          </div>
          <Row k="Privacy" v="Demo: data stays on this device" />
        </section>

        <section className="card p-4">
          <h3 className="mb-2 text-xs font-bold uppercase text-gray-500">How useful is the app so far?</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => rate(n)} className={`h-10 flex-1 rounded-xl text-lg ${satisfaction && n <= satisfaction ? "bg-amber-400" : "bg-bg"}`} aria-label={`${n} stars`}>
                ★
              </button>
            ))}
          </div>
        </section>

        <section className="card px-4 py-2">
          <h3 className="pt-2 text-xs font-bold uppercase text-gray-500">Help & support</h3>
          <Link href="/chat/assistant" className="block border-b border-gray-100 py-2.5 text-sm font-semibold text-navy">
            Help centre (AI assistant)
          </Link>
          <Link href="/chat/advisor" className="block border-b border-gray-100 py-2.5 text-sm font-semibold text-navy">
            Contact an advisor
          </Link>
          <Link href="/plans" className="block border-b border-gray-100 py-2.5 text-sm font-semibold text-navy">
            Plans
          </Link>
          <button
            className="block py-2.5 text-sm font-semibold text-red-600"
            onClick={() => {
              reset();
              router.push("/onboarding");
            }}
          >
            Log out (reset demo)
          </button>
        </section>

        <section className="card p-4">
          <h3 className="mb-2 text-xs font-bold uppercase text-gray-500">Demo: switch profile</h3>
          <div className="grid grid-cols-2 gap-2">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  startPersona(p.id);
                  router.push("/home");
                }}
                className={`rounded-xl border px-2 py-2 text-left text-xs ${profile.personaId === p.id ? "border-brand bg-brand-soft" : "border-gray-200"}`}
              >
                <b className="block text-navy">{p.name.split(" ")[0]}</b>
                {getDestination(p.destinationId).flag} {getDestination(p.destinationId).city} · {p.nationalityLabel}
              </button>
            ))}
          </div>
          <Link href="/office" className="mt-3 block text-center text-xs font-semibold text-brand underline">
            International office view →
          </Link>
        </section>
      </div>
    </main>
  );
}
