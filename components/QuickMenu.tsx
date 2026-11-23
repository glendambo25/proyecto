"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BarChart3, CalendarClock, FolderCheck, MapPinned, Mic, Plane, Ticket, UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";

/** Everything that is not one of the four main tabs. Same items on mobile ("More") and desktop (sidebar). */
/** Labels live in messages/<locale>.json under nav.items.<key>.{label,hint}. */
export const MORE_ITEMS = [
  { href: "/city", key: "city", Icon: MapPinned },
  { href: "/documents", key: "documents", Icon: FolderCheck },
  { href: "/deadlines", key: "deadlines", Icon: CalendarClock },
  { href: "#voice", key: "voice", Icon: Mic },
  { href: "/tasks#return", key: "goingHome", Icon: Plane },
  { href: "/profile", key: "profile", Icon: UserRound },
  { href: "/plans", key: "plans", Icon: Ticket },
  { href: "/office", key: "office", Icon: BarChart3 },
] as const;

export function startVoice() {
  window.VoiceAgent?.start();
}

export default function QuickMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("nav");
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 transition-[visibility] ${open ? "visible" : "pointer-events-none invisible delay-200"}`} inert={!open}>
      <div className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} aria-hidden />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="more-title"
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-[440px] rounded-t-3xl bg-paper px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />
        <div className="mb-3 flex items-center justify-between">
          <h2 id="more-title" className="text-[20px] font-bold">
            {t("more")}
          </h2>
          <button ref={closeRef} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card hover:border-ink" aria-label={t("close")}>
            <X size={18} />
          </button>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {MORE_ITEMS.map(({ href, key, Icon }) => {
            const inner = (
              <>
                <Icon size={20} className="shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{t(`items.${key}.label`)}</span>
                  <span className="block text-[13px] text-ink-3">{t(`items.${key}.hint`)}</span>
                </span>
              </>
            );
            const cls = "flex min-h-[56px] w-full items-center gap-4 py-2 text-start hover:text-accent";
            return (
              <li key={href}>
                {href === "#voice" ? (
                  <button
                    className={cls}
                    onClick={() => {
                      onClose();
                      startVoice();
                    }}
                  >
                    {inner}
                  </button>
                ) : (
                  <Link href={href} onClick={onClose} className={cls}>
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
