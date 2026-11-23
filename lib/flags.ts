"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "./supabase/client";

/**
 * Feature flags. Defaults are OFF for features not ready for the pilot:
 * - voice_agent: OpenAI Realtime voice assistant
 * - people_chat: chats with real people (mentors, office, partners)
 * Resolution order: demo mode (on, so demos keep working) → NEXT_PUBLIC_FLAG_<KEY>=1|0 → institution
 * flags in the database (feature_flags table) → global defaults.
 */
export type FlagKey = "voice_agent" | "people_chat";
const DEFAULTS: Record<FlagKey, boolean> = { voice_agent: false, people_chat: false };

const ENV: Partial<Record<FlagKey, string | undefined>> = {
  voice_agent: process.env.NEXT_PUBLIC_FLAG_VOICE_AGENT,
  people_chat: process.env.NEXT_PUBLIC_FLAG_PEOPLE_CHAT,
};

function demoMode(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem("arrival-demo-v1") || "{}");
    return Boolean(s?.profile?.personaId) || /[?&]demo=/.test(window.location.search);
  } catch {
    return false;
  }
}

export function flagSync(key: FlagKey): boolean {
  if (typeof window !== "undefined" && demoMode()) return true;
  const env = ENV[key];
  if (env === "1" || env === "true") return true;
  if (env === "0" || env === "false") return false;
  return DEFAULTS[key];
}

/** React hook: starts from env/defaults, then applies the institution's database flags when signed in. */
export function useFlag(key: FlagKey): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    setOn(flagSync(key));
    const sb = getBrowserSupabase();
    if (sb && !demoMode() && ENV[key] == null) {
      sb.from("feature_flags")
        .select("enabled, org_id")
        .eq("key", key)
        .then(({ data }) => {
          if (!alive || !data?.length) return;
          const org = data.find((r) => r.org_id);
          setOn(Boolean((org ?? data[0]).enabled));
        });
    }
    return () => {
      alive = false;
    };
  }, [key]);
  return on;
}
