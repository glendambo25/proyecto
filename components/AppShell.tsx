"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, CalendarClock, FolderCheck, House, ListChecks, Map, MessageCircle, Mic, Sparkles, Ticket, UserRound } from "lucide-react";
import { APP_NAME, cityCode, getDestination, personas, progressOf } from "@/lib/content";
import { useApp } from "@/lib/store";
import { Segments } from "./ui";

const TABS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/tasks", label: "Tasks", Icon: ListChecks },
  { href: "/city", label: "City", Icon: Map },
  { href: "/chat", label: "Chat", Icon: MessageCircle },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

const TOOLS = [
  { href: "/chat/assistant", label: "Assistant", Icon: Sparkles },
  { href: "/documents", label: "Document wallet", Icon: FolderCheck },
  { href: "/deadlines", label: "Deadlines", Icon: CalendarClock },
  { href: "/plans", label: "Plans", Icon: Ticket },
  { href: "/office", label: "Office view", Icon: BarChart3 },
];

const PUBLIC = ["/", "/onboarding", "/office", "/login"];

function Sidebar({ path }: { path: string }) {
  const { profile, checklist, statuses } = useApp();
  if (!profile) return null;
  const dest = getDestination(profile.destinationId);
  const prog = progressOf(checklist, statuses);
  const isActive = (href: string) => path === href || (href !== "/chat" && path.startsWith(href + "/")) || (href === "/chat" && path.startsWith("/chat/") && !path.startsWith("/chat/assistant"));
  const item = (href: string, label: string, Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[14px] font-semibold transition ${active ? "bg-paper text-ink" : "text-paper/65 hover:bg-paper/10 hover:text-paper"}`}
      >
        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
        {label}
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-ink p-5 text-paper lg:flex" aria-label="Sidebar">
      <Link href="/home" className="px-3 pt-2 font-serif text-[30px] leading-none">
        {APP_NAME}
      </Link>
      <p className="px-3 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/45">You move. We handle the paperwork.</p>

      <nav className="mt-8 space-y-1" aria-label="Main">
        {TABS.map((t) => item(t.href, t.label, t.Icon))}
      </nav>
      <p className="mt-8 px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/40">Tools</p>
      <nav className="mt-2 space-y-1" aria-label="Tools">
        {TOOLS.map((t) => item(t.href, t.label, t.Icon))}
        <button onClick={() => window.VoiceAgent?.start()} className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-[14px] font-semibold text-paper/65 transition hover:bg-paper/10 hover:text-paper">
          <Mic size={17} strokeWidth={1.8} /> Talk (voice)
        </button>
      </nav>

      <Link href="/profile" className="mt-auto block rounded-[22px] border border-paper/15 p-4 transition hover:border-paper/40">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/50">Arrival pass</span>
          <span className="font-mono text-[11px] text-paper/70">{cityCode[dest.id]}</span>
        </div>
        <p className="mt-3 font-serif text-[22px] leading-none">{profile.name}</p>
        <p className="mt-1 text-[12px] text-paper/55">
          {dest.city} · {prog.pct}% ready
        </p>
        <div className="mt-3">
          <Segments total={prog.total} done={prog.done} dark />
        </div>
      </Link>
    </aside>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { ready, profile, startPersona } = useApp();
  const isPublic = PUBLIC.includes(path);

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
      {showNav && <Sidebar path={path} />}
      <div className={showNav ? "lg:pl-[272px]" : ""}>
        <div className={`mx-auto min-h-dvh ${fullBleed ? "max-w-[1200px]" : "max-w-[440px] lg:max-w-[1120px] lg:px-6"} ${showNav ? "pb-32 lg:pb-16" : ""}`}>
          {ready ? children : <div className="eyebrow p-10 text-center">Loading…</div>}
        </div>
      </div>
      {showNav && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[min(408px,calc(100%-32px))] lg:hidden">
          <ul className="flex items-center justify-between rounded-full bg-ink p-1.5 shadow-[0_18px_40px_-12px_rgba(11,15,92,0.55)]">
            {TABS.map(({ href, label, Icon }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[12px] font-semibold transition ${active ? "bg-paper text-ink" : "text-paper/60 hover:text-paper"}`}
                  >
                    <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                    <span className={active ? "" : "sr-only"}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
