"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { House, ListChecks, Menu, MessageCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { getDestination, personas, progressOf } from "@/lib/content";
import NomadLogo from "./brand/NomadLogo";
import { useApp } from "@/lib/store";
import QuickMenu, { MORE_ITEMS, startVoice } from "./QuickMenu";
import { Segments } from "./ui";

/** Labels: messages nav.<key>. */
const TABS = [
  { href: "/home", key: "today", Icon: House },
  { href: "/tasks", key: "checklist", Icon: ListChecks },
  { href: "/chat/assistant", key: "ask", Icon: Sparkles },
  { href: "/chat", key: "chats", Icon: MessageCircle },
] as const;

const PUBLIC = ["/", "/onboarding", "/office", "/login", "/auth/callback"];

function isActive(path: string, href: string) {
  if (href === "/chat") return path === "/chat" || (path.startsWith("/chat/") && !path.startsWith("/chat/assistant"));
  return path === href || path.startsWith(href + "/");
}

function Sidebar({ path }: { path: string }) {
  const { profile, checklist, statuses } = useApp();
  const t = useTranslations("nav");
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const prog = progressOf(checklist, statuses);
  const cls = (active: boolean) =>
    `flex min-h-[44px] w-full items-center gap-3 rounded-full px-4 text-start text-[14px] font-semibold transition-colors duration-150 ${active ? "bg-paper text-ink" : "text-paper/75 hover:bg-paper/10 hover:text-paper"}`;

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-[272px] flex-col overflow-y-auto bg-ink p-5 text-paper lg:flex" aria-label={t("sidebarLabel")}>
      <Link href="/home" className="px-3 pt-2 text-paper" aria-label="Nomad">
        <NomadLogo height={30} onDark />
      </Link>
      <nav className="mt-8 space-y-1" aria-label={t("mainLabel")}>
        {TABS.map(({ href, key, Icon }) => {
          const active = isActive(path, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cls(active)}>
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <p className="mt-8 px-4 text-[12px] font-semibold text-paper/60">{t("moreLabel")}</p>
      <nav className="mt-2 space-y-1" aria-label={t("moreLabel")}>
        {MORE_ITEMS.map(({ href, key, Icon }) =>
          href === "#voice" ? (
            <button key={href} onClick={startVoice} className={cls(false)}>
              <Icon size={18} strokeWidth={1.8} aria-hidden /> {t(`items.${key}.label`)}
            </button>
          ) : (
            <Link key={href} href={href} aria-current={isActive(path, href) ? "page" : undefined} className={cls(isActive(path, href))}>
              <Icon size={18} strokeWidth={isActive(path, href) ? 2.2 : 1.8} aria-hidden /> {t(`items.${key}.label`)}
            </Link>
          ),
        )}
      </nav>

      <Link href="/profile" className="mt-6 block rounded-2xl border border-paper/20 p-4 transition-colors hover:border-paper/50">
        <p className="text-[15px] font-semibold">{profile.name || t("yourMove")}</p>
        <p className="mt-0.5 text-[13px] text-paper/70">{t("progress", { city: dest.city, done: prog.done, total: prog.total })}</p>
        <div className="mt-3">
          <Segments total={prog.total} done={prog.done} dark />
        </div>
      </Link>
    </aside>
  );
}

function BottomNav({ path, onMore, moreOpen }: { path: string; onMore: () => void; moreOpen: boolean }) {
  const t = useTranslations("nav");
  const item = "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold leading-tight";
  return (
    <nav aria-label={t("mainLabel")} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-[440px] grid-cols-5">
        {TABS.map(({ href, key, Icon }) => {
          const active = isActive(path, href);
          const ask = href === "/chat/assistant";
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`${item} ${active ? "text-accent" : "text-ink-2 hover:text-ink"}`}>
                {ask ? (
                  <span className={`grid h-8 w-12 place-items-center rounded-full ${active ? "bg-accent text-white" : "bg-accent-soft text-accent"}`}>
                    <Icon size={18} strokeWidth={2.2} aria-hidden />
                  </span>
                ) : (
                  <span className={`grid h-8 w-12 place-items-center rounded-full ${active ? "bg-accent-soft" : ""}`}>
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                  </span>
                )}
                <span className="line-clamp-2 max-w-full px-0.5 text-center [overflow-wrap:anywhere]">{t(key)}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button onClick={onMore} aria-haspopup="dialog" aria-expanded={moreOpen} className={`${item} w-full text-ink-2 hover:text-ink`}>
            <span className="grid h-8 w-12 place-items-center rounded-full">
              <Menu size={20} strokeWidth={1.8} aria-hidden />
            </span>
            <span className="line-clamp-2 max-w-full px-0.5 text-center [overflow-wrap:anywhere]">{t("more")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function Loading() {
  const t = useTranslations("nav");
  return (
    <div className="px-5 pt-8" role="status" aria-label={t("loading")}>
      <div className="h-4 w-28 animate-pulse rounded-full bg-paper-2 motion-reduce:animate-none" />
      <div className="mt-5 h-9 w-3/4 animate-pulse rounded-xl bg-paper-2 motion-reduce:animate-none" />
      <div className="mt-8 h-40 animate-pulse rounded-2xl bg-paper-2 motion-reduce:animate-none" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-paper-2 motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { ready, profile, startPersona } = useApp();
  const t = useTranslations("nav");
  const isPublic = PUBLIC.includes(path);
  const [more, setMore] = useState(false);
  const closeMore = useCallback(() => setMore(false), []);
  useEffect(() => setMore(false), [path]);

  // Demo links: ?demo=<persona> opens a demo traveller, ?design=chart|minimal picks the direction.
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(window.location.search);
    const demo = q.get("demo");
    const design = q.get("design");
    if (design === "chart" || design === "minimal") {
      try {
        localStorage.setItem("arrival-design", design);
      } catch {}
      window.dispatchEvent(new Event("arrival-design-change"));
    }
    if (demo && personas.some((p) => p.id === demo) && profile?.personaId !== demo) {
      startPersona(demo);
      return;
    }
    if (!profile && !isPublic) router.replace("/onboarding");
  }, [ready, profile, isPublic, router, startPersona]);

  // Conversation screens have their own composer + mic: hide the floating voice button there (and on onboarding).
  useEffect(() => {
    if (path.startsWith("/chat/") || isPublic) document.body.dataset.vaHidden = "1";
    else delete document.body.dataset.vaHidden;
  }, [path, isPublic]);

  const showNav = !isPublic && !!profile;
  const fullBleed = path === "/onboarding" || path === "/office";

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        {t("skip")}
      </a>
      {showNav && <Sidebar path={path} />}
      <div className={showNav ? "lg:ps-[272px]" : ""}>
        <div id="main" className={`mx-auto min-h-dvh ${fullBleed ? "max-w-[1200px]" : "max-w-[440px] lg:max-w-[1120px] lg:px-6"} ${showNav ? "pb-28 lg:pb-16" : ""}`}>
          {ready ? children : <Loading />}
        </div>
      </div>
      {showNav && (
        <>
          <BottomNav path={path} onMore={() => setMore(true)} moreOpen={more} />
          <QuickMenu open={more} onClose={closeMore} />
        </>
      )}
    </>
  );
}
