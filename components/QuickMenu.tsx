"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BarChart3, CalendarClock, FolderCheck, Mic, Plane, Sparkles, Ticket, UserRoundCog, X } from "lucide-react";

const ITEMS = [
  { href: "/documents", label: "Document wallet", hint: "Everything you need to carry", Icon: FolderCheck, tone: "bg-ink text-paper" },
  { href: "/deadlines", label: "Deadlines", hint: "Calendar & reminders", Icon: CalendarClock, tone: "bg-stamp text-white" },
  { href: "/chat/assistant", label: "Assistant", hint: "Answers with sources", Icon: Sparkles, tone: "bg-accent text-white" },
  { href: "#voice", label: "Talk", hint: "Voice assistant", Icon: Mic, tone: "bg-paper-2 text-ink" },
  { href: "/tasks#return", label: "Going home", hint: "Return reminders", Icon: Plane, tone: "bg-paper-2 text-ink" },
  { href: "/plans", label: "Plans", hint: "Premium & Done for you", Icon: Ticket, tone: "bg-paper-2 text-ink" },
  { href: "/profile", label: "Profile", hint: "Switch demo traveller", Icon: UserRoundCog, tone: "bg-paper-2 text-ink" },
  { href: "/office", label: "Office view", hint: "For universities", Icon: BarChart3, tone: "bg-paper-2 text-ink" },
];

export default function QuickMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <section
        role="dialog"
        aria-label="Quick menu"
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-[440px] rounded-t-[30px] bg-paper p-5 pb-8 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <div className="mb-5 flex items-center justify-between">
          <p className="font-serif text-[30px] leading-none">
            Quick <em>menu</em>
          </p>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card" aria-label="Close menu">
            <X size={16} />
          </button>
        </div>
        <ul className="grid grid-cols-2 gap-2.5">
          {ITEMS.map(({ href, label, hint, Icon, tone }) => {
            const inner = (
              <>
                <span className={`grid h-10 w-10 place-items-center rounded-full ${tone}`}>
                  <Icon size={18} />
                </span>
                <span className="mt-6 block text-[14.5px] font-semibold">{label}</span>
                <span className="block text-[12px] text-ink-3">{hint}</span>
              </>
            );
            return (
              <li key={href}>
                {href === "#voice" ? (
                  <button
                    className="card block h-full w-full p-4 text-left transition hover:border-ink"
                    onClick={() => {
                      onClose();
                      window.VoiceAgent?.start();
                    }}
                  >
                    {inner}
                  </button>
                ) : (
                  <Link href={href} onClick={onClose} className="card block h-full p-4 transition hover:border-ink">
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
