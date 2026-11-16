"use client";

import Link from "next/link";
import { useState } from "react";
import { getDestination } from "@/lib/content";
import { threadsFor, type ChatFilter } from "@/lib/chats";
import { useApp } from "@/lib/store";
import { FilterChips, Header } from "@/components/ui";

export default function Chats() {
  const { profile } = useApp();
  const [filter, setFilter] = useState<ChatFilter>("All");
  const [q, setQ] = useState("");
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const threads = threadsFor(dest, profile.institution).filter(
    (t) => (filter === "All" || t.group === filter) && (t.name + t.role).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <main>
      <Header title="Chats" subtitle={`Talk to people who help you in ${dest.city}`} />
      <div className="space-y-3 px-4">
        <Link href="/chat/assistant" className="card flex items-center gap-3 bg-gradient-to-r from-navy to-brand p-4 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-xl" aria-hidden>
            ✦
          </span>
          <span className="flex-1">
            <span className="block font-bold">AI assistant · 24/7</span>
            <span className="block text-xs opacity-90">Every answer shows the official source and the date it was verified.</span>
          </span>
          <span aria-hidden>›</span>
        </Link>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
          aria-label="Search chats"
        />
        <FilterChips<ChatFilter> options={["All", "Uni", "City", "Work"]} value={filter} onChange={setFilter} />
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/chat/${t.id}`} className="card flex items-center gap-3 p-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-xl" aria-hidden>
                  {t.avatar}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between">
                    <span className="truncate text-sm font-bold text-navy">{t.name}</span>
                    <span className="text-[11px] text-gray-400">{t.time}</span>
                  </span>
                  <span className="block truncate text-xs text-gray-500">
                    {t.role} · {t.messages[t.messages.length - 1].text}
                  </span>
                </span>
                {t.unread && <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">{t.unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <p className="pb-4 text-center text-xs text-gray-400">Sample conversations for the demo.</p>
      </div>
    </main>
  );
}
