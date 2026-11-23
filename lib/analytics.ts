"use client";

import posthog from "posthog-js";

/**
 * Product analytics (PostHog, EU region). No-op until NEXT_PUBLIC_POSTHOG_KEY is set.
 * Never send personal data: only event names and small, non-identifying properties.
 * Event plan and KPI mapping: docs/metrics-plan.md
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
let started = false;

function start() {
  if (started) return true;
  if (!KEY || typeof window === "undefined") return false;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: true,
    disable_session_recording: true,
    persistence: "localStorage",
  });
  started = true;
  return started;
}

/** Properties allowed to leave the device (no names, emails, passports, free text). */
const ALLOWED = new Set(["taskId", "status", "channel", "covered", "offline", "plan", "destination", "persona", "value", "ready", "events", "ok", "flag", "thread", "partner", "accent", "language", "city", "score", "name"]);

export function track(event: string, props: Record<string, unknown> = {}) {
  if (!start()) return;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) if (ALLOWED.has(k) && (typeof v !== "string" || v.length <= 64)) safe[k] = v;
  posthog.capture(event, safe);
}

/** Link analytics to the signed-in user by an opaque id and their institution (group analytics). */
export function identify(userId: string, orgId?: string) {
  if (!start()) return;
  posthog.identify(userId);
  if (orgId) posthog.group("institution", orgId);
}
