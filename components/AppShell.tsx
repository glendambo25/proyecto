"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/lib/store";

const TABS = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/city", label: "City", icon: "🗺️" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/profile", label: "Profile", icon: "👤" },
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

  const showNav = !isPublic && !!profile;
  const wide = path === "/office";

  return (
    <div className={`mx-auto min-h-dvh ${wide ? "max-w-5xl" : "max-w-[460px]"} bg-bg ${showNav ? "pb-24" : ""}`}>
      {ready ? children : <div className="p-8 text-center text-sm text-gray-500">Loading…</div>}
      {showNav && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[460px] border-t border-gray-200 bg-white/95 backdrop-blur">
          <ul className="grid grid-cols-5">
            {TABS.map((t) => {
              const active = path === t.href || path.startsWith(t.href + "/");
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-brand" : "text-gray-500"}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {t.icon}
                    </span>
                    {t.label}
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
