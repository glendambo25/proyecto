"use client";

import { use, useState } from "react";
import { getDestination } from "@/lib/content";
import { threadsFor } from "@/lib/chats";
import { useApp } from "@/lib/store";
import { Header } from "@/components/ui";

export default function Thread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile, log } = useApp();
  const [extra, setExtra] = useState<string[]>([]);
  const [text, setText] = useState("");
  if (!profile) return null;
  const t = threadsFor(getDestination(profile.destinationId), profile.institution).find((x) => x.id === id);
  if (!t) return <Header title="Chat not found" back="/chat" />;

  return (
    <main className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <Header title={t.name} subtitle={t.role} back="/chat" />
      <div className="flex-1 space-y-2 px-4">
        {t.messages.map((m, i) => (
          <p key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "ml-auto bg-brand text-white" : "bg-white text-navy shadow-sm"}`}>
            {m.text}
          </p>
        ))}
        {extra.map((m, i) => (
          <p key={`x${i}`} className="ml-auto max-w-[85%] rounded-2xl bg-brand px-3 py-2 text-sm text-white">
            {m}
          </p>
        ))}
        {extra.length > 0 && <p className="text-center text-xs text-gray-400">Demo: messages are not delivered to real people.</p>}
      </div>
      <form
        className="sticky bottom-24 flex gap-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setExtra([...extra, text.trim()]);
          setText("");
          log("community_message", { thread: t.id, partner: t.id === "advisor" || t.id === "accommodation" });
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="Write a message" aria-label="Message" />
        <button className="btn-primary" type="submit" aria-label="Send message">
          ➤
        </button>
      </form>
    </main>
  );
}
