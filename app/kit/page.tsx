"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bus, Landmark, MapPinned, MessageCircle, Smartphone, Home as HomeIcon } from "lucide-react";
import { formatDate, getDestination } from "@/lib/content";
import { statusOf, useApp } from "@/lib/store";
import { Header } from "@/components/ui";

/**
 * LOCAL KIT: DEMO MOCK (docs/demo-script.md, scene 7).
 * The three "official" cards read their text and source from the verified content (content/<city>.json).
 * The partner offers below them are SIMULATED: no partner, price or deal exists yet.
 */
const OFFICIAL = [
  { id: "transport", Icon: Bus },
  { id: "bank", Icon: Landmark },
  { id: "padron", Icon: HomeIcon },
];

const PARTNERS = [
  // SIMULATED partner offers (TODO: verify / sign partners before showing as real).
  { Icon: Smartphone, title: "Spanish SIM or eSIM", body: "Local number for bank and appointment SMS. Partner offer shown for the demo.", cta: "See offer" },
  { Icon: MessageCircle, title: "Coffee with a local mentor", body: "A student who did the same paperwork last year, in your neighbourhood.", cta: "Book a chat", href: "/chat" },
];

export default function Kit() {
  const { profile, checklist, statuses, log } = useApp();
  const [interest, setInterest] = useState<string[]>([]);
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const cards = OFFICIAL.map((o) => ({ ...o, t: checklist.find((t) => t.id === o.id) })).filter((o) => o.t);

  return (
    <main>
      <Header
        back="/home"
        eyebrow="Local kit"
        title={
          <>
            Your <em>{dest.city}</em> starter kit
          </>
        }
        subtitle="The everyday things you'll need in your first weeks, with the official rules and what to do next."
      />
      <div className="space-y-6 px-5 lg:max-w-3xl">
        <p className="rounded-2xl border border-dashed border-stamp/40 bg-stamp-soft px-4 py-3 font-mono text-[11px] leading-relaxed text-stamp">
          <b>Demo mock.</b> Official cards come from verified sources. Partner offers are simulated: there are no partners, prices or deals yet.
        </p>

        <section>
          <p className="eyebrow mb-2">Official · verified</p>
          <ul className="space-y-3">
            {cards.map(({ id, Icon, t }) => (
              <li key={id}>
                <Link href={`/tasks/${id}`} className="card group flex items-start gap-4 p-4 transition hover:border-ink">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold group-hover:text-accent">
                      {t!.title}
                      {t!.localName && <span className="font-normal text-ink-3"> · {t!.localName}</span>}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[13px] text-ink-2">{t!.description}</span>
                    <span className="mt-2 block font-mono text-[10.5px] text-ink-3">
                      {t!.verificationStatus === "verified" && t!.lastVerified ? `✓ ${t!.officialSourceName} · checked ${formatDate(t!.lastVerified)}` : "⚠ TODO: verify"}
                      {statusOf(statuses, id) === "completed" ? " · done" : ""}
                    </span>
                  </span>
                  <ArrowRight size={16} className="mt-1 shrink-0 text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="eyebrow mb-2">Partner offers · simulated for the demo</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PARTNERS.map((p) => (
              <li key={p.title} className="card flex flex-col gap-2 p-4">
                <p.Icon size={18} className="text-accent" />
                <span className="text-[15px] font-semibold">{p.title}</span>
                <span className="text-[13px] text-ink-2">{p.body}</span>
                {p.href ? (
                  <Link href={p.href} className="btn-ghost mt-auto self-start">
                    {p.cta}
                  </Link>
                ) : (
                  <button
                    className="btn-ghost mt-auto self-start"
                    disabled={interest.includes(p.title)}
                    onClick={() => {
                      setInterest((x) => [...x, p.title]);
                      log("kit_partner_interest", { offer: p.title });
                    }}
                  >
                    {interest.includes(p.title) ? "Interest saved (demo)" : p.cta}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <Link href="/city" className="card flex items-center gap-3 p-4 transition hover:border-ink">
          <MapPinned size={18} className="text-accent" />
          <span className="flex-1 text-[14px] font-semibold">City guide, map and housing scam alert</span>
          <ArrowRight size={16} className="text-ink-3" />
        </Link>
      </div>
    </main>
  );
}
