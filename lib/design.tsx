"use client";

import { useEffect, useState } from "react";

export type DesignVariant = "chart" | "minimal";
const KEY = "arrival-design";
const EVT = "arrival-design-change";

/** Which of the two redesign directions is shown on onboarding, checklist and step detail. */
export function useDesign(): [DesignVariant, (v: DesignVariant) => void] {
  const [v, setV] = useState<DesignVariant>("chart");
  useEffect(() => {
    const read = () => {
      try {
        const s = localStorage.getItem(KEY);
        if (s === "chart" || s === "minimal") setV(s);
      } catch {}
    };
    read();
    window.addEventListener(EVT, read);
    return () => window.removeEventListener(EVT, read);
  }, []);
  const set = (next: DesignVariant) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    setV(next);
    window.dispatchEvent(new Event(EVT));
  };
  return [v, set];
}

/** Small switch to compare the two directions. */
export function DesignSwitch({ className = "" }: { className?: string }) {
  const [v, set] = useDesign();
  return (
    <div role="radiogroup" aria-label="Design direction" className={`inline-flex rounded-full border border-line bg-card p-0.5 text-[12px] font-semibold ${className}`}>
      {(
        [
          ["chart", "Chart"],
          ["minimal", "Minimal"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          role="radio"
          aria-checked={v === id}
          onClick={() => set(id)}
          className={`rounded-full px-3 py-1.5 transition-colors duration-150 ${v === id ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
