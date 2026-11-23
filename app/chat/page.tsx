"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { getDestination } from "@/lib/content";
import { threadsFor, type ChatFilter } from "@/lib/chats";
import { useApp } from "@/lib/store";
import { useFlag } from "@/lib/flags";
import { Header, Tabs } from "@/components/ui";
import Monogram from "@/components/Monogram";

export default function Chats() {
  const { profile } = useApp();
  const [filter, setFilter] = useState<ChatFilter>("All");
  const [q, setQ] = useState("");
  const peopleChat = useFlag("people_chat");
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const all = threadsFor(dest, profile.institution);
  const threads = peopleChat ? all.filter((t) => (filter === "All" || t.group === filter) && (t.name + t.role).toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <main>
      <Header
        eyebrow="Messages"
        title={
          <>
            People who help you <em>in {dest.city}</em>
          </>
        }
      />
      <div className="space-y-5 px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-10 lg:space-y-0">
        <Link href="/chat/assistant" className="group block rounded-[26px] bg-ink p-5 text-paper lg:sticky lg:top-6 lg:p-8">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/60">AI assistant · always on</p>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-paper/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7ee0a8]" /> Online
            </span>
          </div>
          <p className="mt-4 font-serif text-[28px] leading-[1.05] lg:mt-16 lg:text-[44px]">
            “What do I need to <em>register my address?</em>”
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-paper/90 transition group-hover:gap-3">
            Ask with official sources <ArrowRight size={14} />
          </span>
        </Link>

        <div className="space-y-5">
        <label className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-3 focus-within:border-ink">
          <Search size={16} className="text-ink-3" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" aria-label="Search chats" className="flex-1 bg-transparent text-[14px] outline-none" />
        </label>
        <Tabs<ChatFilter> options={["All", "Uni", "City", "Work"]} value={filter} onChange={setFilter} />

        {!peopleChat && <p className="rounded-[22px] border border-dashed border-line p-4 text-[14px] text-ink-2">Chats with mentors, your international office and partners are coming soon. The assistant above is available now.</p>}
        <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/chat/${t.id}`} className="flex items-center gap-3 px-4 py-4 transition hover:bg-paper">
                <Monogram name={t.name} seed={all.indexOf(t)} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15px] font-semibold">{t.name}</span>
                    <span className="shrink-0 font-mono text-[10.5px] text-ink-3">{t.time}</span>
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-accent">
                    {t.group} · {t.role}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-ink-2">{t.messages[t.messages.length - 1].text}</span>
                </span>
                {t.unread && <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-stamp font-mono text-[10px] text-white">{t.unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-center font-mono text-[10.5px] text-ink-3">Sample conversations for the demo</p>
        </div>
      </div>
    </main>
  );
}
