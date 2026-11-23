"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_SCENES, isDemoMode, setDemoMode } from "@/lib/demo";
import { useApp } from "@/lib/store";

/**
 * Presenter dock, visible ONLY in demo mode (?demo=priya). Jump to any scene of docs/demo-script.md,
 * reset the demo to a clean start with one click, or leave demo mode.
 */
export default function DemoDock() {
  const router = useRouter();
  const { reset } = useApp();
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const read = () => {
      const demo = isDemoMode();
      setOn(demo);
      // CSS hook: in demo mode the idle voice button stays visible on mobile (see globals.css).
      if (demo) document.body.dataset.demo = "1";
      else delete document.body.dataset.demo;
    };
    read();
    window.addEventListener("arrival-demo-change", read);
    return () => window.removeEventListener("arrival-demo-change", read);
  }, []);

  if (!on) return null;

  function resetDemo() {
    try {
      window.VoiceAgent?.stop();
    } catch {}
    reset();
    // Full reload: clears the voice panel transcript and any in-flight request.
    window.location.assign("/onboarding");
  }

  function go(href: string) {
    setOpen(false);
    if (href.endsWith("#voice")) {
      router.push("/home");
      setTimeout(() => window.VoiceAgent?.start(), 400);
      return;
    }
    router.push(href);
  }

  return (
    <div className="fixed left-0 top-1/2 z-[60] flex -translate-y-1/2 items-center font-mono text-[11px]" data-demo-dock>
      <div className="flex flex-col items-center gap-1 rounded-r-xl border border-l-0 border-line bg-card/95 py-1.5 pl-0.5 pr-1 shadow-sm backdrop-blur">
        <button onClick={() => setOpen((o) => !o)} className="grid h-7 w-7 place-items-center rounded-full text-ink-2 hover:bg-paper-2 hover:text-ink" aria-expanded={open} aria-label="Demo scenes" title="Demo scenes">
          <span className="h-2 w-2 rounded-full bg-stamp" />
        </button>
        <button onClick={resetDemo} className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[13px] text-paper hover:bg-accent" aria-label="Reset demo" title="Reset demo">
          ↺
        </button>
      </div>
      {open && (
        <ol className="ml-1 w-56 overflow-hidden rounded-2xl border border-line bg-card shadow-lg">
          {DEMO_SCENES.map((s) => (
            <li key={s.n}>
              <button onClick={() => go(s.href)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-paper-2">
                <span className="w-4 text-ink-3">{s.n}</span> {s.label}
              </button>
            </li>
          ))}
          <li className="border-t border-line">
            <button
              onClick={() => {
                setDemoMode(false);
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-ink-3 hover:bg-paper-2"
            >
              Exit demo mode
            </button>
          </li>
        </ol>
      )}
    </div>
  );
}
