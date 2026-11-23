/**
 * DEMO MODE ONLY (server side). Rehearsal cache for the assistant.
 *
 * Every LIVE Claude answer given in demo mode is saved to .demo-cache/assistant.json (git-ignored).
 * If, during the real demo, the live call fails or is slower than DEMO_ASSISTANT_TIMEOUT_MS, the route
 * replays the cached answer for the same question (flagged `cached: true`, shown as "Cached answer" in the UI)
 * and, if there is none, the offline answer built from the verified content. Nothing here is invented:
 * a cached answer is a real answer from a rehearsal, with the same official sources.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AssistantRequest, AssistantResponse } from "./assistant";

const DIR = join(process.cwd(), ".demo-cache");
const FILE = join(DIR, "assistant.json");

export const DEMO_ASSISTANT_TIMEOUT_MS = Number(process.env.DEMO_ASSISTANT_TIMEOUT_MS) || 12000;

export function isDemoRequest(req: Request): boolean {
  return /(?:^|;\s*)arrival-demo=1(?:;|$)/.test(req.headers.get("cookie") ?? "");
}

function keyOf(r: AssistantRequest): string {
  const q = r.question.toLowerCase().replace(/^🎙️\s*/u, "").replace(/[^a-z0-9à-ÿ]+/g, " ").trim();
  return `${r.destinationId}|${r.nationality}|${r.purpose}|${q}`;
}

function readAll(): Record<string, AssistantResponse> {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export function getCached(r: AssistantRequest): AssistantResponse | null {
  return readAll()[keyOf(r)] ?? null;
}

export function saveCached(r: AssistantRequest, a: AssistantResponse) {
  if (a.offline) return;
  try {
    mkdirSync(DIR, { recursive: true });
    const all = readAll();
    all[keyOf(r)] = a;
    writeFileSync(FILE, JSON.stringify(all, null, 2));
  } catch (e) {
    console.warn("[demo-cache] could not write", e);
  }
}

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms} ms`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}
