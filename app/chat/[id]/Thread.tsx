"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { getDestination } from "@/lib/content";
import { threadsFor } from "@/lib/chats";
import { useApp } from "@/lib/store";
import { Header } from "@/components/ui";
import Monogram from "@/components/Monogram";

export default function Thread({ id }: { id: string }) {
  const { profile, log } = useApp();
  const [extra, setExtra] = useState<string[]>([]);
  const [text, setText] = useState("");
  if (!profile) return null;
  const all = threadsFor(getDestination(profile.destinationId), profile.institution);
  const t = all.find((x) => x.id === id);
  if (!t) return <Header title="Chat not found" back="/chat" />;

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-3xl flex-col">
      <Header back="/chat" eyebrow={`${t.group} · ${t.role}`} title={t.name} right={<Monogram name={t.name} seed={all.indexOf(t)} size={36} />} />
      <div className="flex-1 space-y-2 px-5">
        {t.messages.map((m, i) => (
          <p key={i} className={`max-w-[82%] rounded-[20px] px-4 py-2.5 text-[14.5px] leading-snug ${m.from === "me" ? "ml-auto rounded-br-md bg-ink text-paper" : "rounded-bl-md border border-line bg-card"}`}>
            {m.text}
          </p>
        ))}
        {extra.map((m, i) => (
          <p key={`x${i}`} className="ml-auto max-w-[82%] rounded-[20px] rounded-br-md bg-ink px-4 py-2.5 text-[14.5px] text-paper">
            {m}
          </p>
        ))}
        {extra.length > 0 && <p className="pt-2 text-center font-mono text-[10.5px] text-ink-3">Demo: messages are not delivered to real people</p>}
      </div>
      <form
        className="sticky bottom-24 lg:bottom-6 mt-4 px-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setExtra([...extra, text.trim()]);
          setText("");
          log("community_message", { thread: t.id, partner: t.id === "advisor" || t.id === "accommodation" });
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-line bg-card p-1.5 pl-4 focus-within:border-ink">
          <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 bg-transparent text-[14px] outline-none" placeholder="Write a message" aria-label="Message" />
          <button className="grid h-9 w-9 place-items-center rounded-full bg-ink text-paper" type="submit" aria-label="Send message">
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
    </main>
  );
}
