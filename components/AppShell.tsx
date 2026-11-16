"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { House, ListChecks, Map, MessageCircle, UserRound } from "lucide-react";
import { useApp } from "@/lib/store";

const TABS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/tasks", label: "Tasks", Icon: ListChecks },
  { href: "/city", label: "City", Icon: Map },
  { href: "/chat", label: "Chat", Icon: MessageCircle },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

const PUBLIC = ["/", "/onboarding", "/office"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { ready, profile } = useApp();
  const isPublic = PUBLIC.includes(path);

  useEffect(() => {
    if (ready && !profile && !isPublic) router.replace("/onboarding");
  }, [ready, profile, isPublic, router]);

  // Conversation screens have their own composer + mic: hide the floating voice button there (and on onboarding).
  useEffect(() => {
    if (path.startsWith("/chat/") || isPublic) document.body.dataset.vaHidden = "1";
    else delete document.body.dataset.vaHidden;
  }, [path, isPublic]);

  const showNav = !isPublic && !!profile;
  const wide = path === "/office";

  return (
    <div className={`mx-auto min-h-dvh ${wide ? "max-w-5xl" : "max-w-[440px]"} ${showNav ? "pb-32" : ""}`}>
      {ready ? children : <div className="eyebrow p-10 text-center">Loading…</div>}
      {showNav && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[min(408px,calc(100%-32px))]">
          <ul className="flex items-center justify-between rounded-full bg-ink p-1.5 shadow-[0_18px_40px_-12px_rgba(11,15,92,0.55)]">
            {TABS.map(({ href, label, Icon }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[12px] font-semibold transition ${
                      active ? "bg-paper text-ink" : "text-paper/60 hover:text-paper"
                    }`}
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
    </div>
  );
}
