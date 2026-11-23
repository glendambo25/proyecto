"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { identify, track } from "./analytics";
import { getSession, loadState, saveDoc, saveEvent, saveProfile, saveStatus, type Session } from "./db/sync";
import { getBrowserSupabase } from "./supabase/client";
import { buildChecklist, personas } from "./content";
import type { Task, TaskStatus, UserProfile } from "./types";

export interface AppEvent {
  type: string;
  ts: string;
  data?: Record<string, unknown>;
}

export interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  sources?: { taskId: string; name: string; url: string | null; lastVerified: string | null; verificationStatus: string }[];
  covered?: boolean;
  offline?: boolean;
  missingTaskIds?: string[];
  feedback?: "up" | "down";
  ts?: string;
}

interface State {
  profile: UserProfile | null;
  statuses: Record<string, TaskStatus>;
  completedOn: Record<string, string>;
  events: AppEvent[];
  assistant: ChatMsg[];
  highlighted: string[];
  satisfaction?: number;
  docs: string[];
}

const KEY = "arrival-demo-v1";
const empty: State = { profile: null, statuses: {}, completedOn: {}, events: [], assistant: [], highlighted: [], docs: [] };

interface Ctx extends State {
  ready: boolean;
  checklist: Task[];
  startPersona: (id: string) => void;
  startCustom: (p: UserProfile) => void;
  setStatus: (taskId: string, s: TaskStatus) => void;
  log: (type: string, data?: Record<string, unknown>) => void;
  addAssistant: (m: ChatMsg) => void;
  setHighlighted: (ids: string[]) => void;
  rate: (n: number) => void;
  reset: () => void;
  toggleDoc: (doc: string) => void;
  setFeedback: (index: number, f: "up" | "down") => void;
  clearAssistant: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...empty, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  // Database (Supabase EU): when signed in, the server copy wins; local storage stays as offline cache.
  const session = useRef<Session | null>(null);
  useEffect(() => {
    if (!ready) return;
    const sb = getBrowserSupabase();
    if (!sb) return;
    let alive = true;
    (async () => {
      const s = await getSession(sb);
      if (!alive || !s) return;
      session.current = s;
      identify(s.userId, s.orgId);
      const remote = await loadState(sb, s);
      if (!alive) return;
      setState((cur) => ({
        ...cur,
        profile: remote.profile ?? cur.profile,
        statuses: remote.profile ? remote.statuses : cur.statuses,
        completedOn: remote.profile ? remote.completedOn : cur.completedOn,
        docs: remote.profile ? remote.docs : cur.docs,
      }));
    })();
    return () => {
      alive = false;
    };
  }, [ready]);
  const remote = useCallback(<A extends unknown[]>(fn: (sb: NonNullable<ReturnType<typeof getBrowserSupabase>>, s: Session, ...a: A) => Promise<unknown>, ...a: A) => {
    const sb = getBrowserSupabase();
    if (sb && session.current) fn(sb, session.current, ...a).catch(() => {});
  }, []);

  const log = useCallback(
    (type: string, data?: Record<string, unknown>) => {
      setState((s) => ({ ...s, events: [...s.events.slice(-499), { type, ts: new Date().toISOString(), data }] }));
      track(type, data);
      remote(saveEvent, type, data);
    },
    [remote],
  );

  const startPersona = useCallback((id: string) => {
    const p = personas.find((x) => x.id === id);
    if (!p) return;
    setState({
      ...empty,
      profile: {
        personaId: p.id,
        name: p.name,
        age: p.age,
        nationality: p.nationality,
        nationalityLabel: p.nationalityLabel,
        passport: p.passport,
        phone: p.phone,
        email: p.email,
        destinationId: p.destinationId,
        purpose: p.purpose,
        institution: p.institution,
        arrivalDate: p.arrivalDate,
        duration: p.duration,
        neighbourhood: p.neighbourhood,
        accommodation: p.accommodation,
      },
      statuses: { ...p.initialStatus },
      completedOn: { ...(p.completedOn ?? {}) },
      events: [{ type: "onboarding_completed", ts: new Date().toISOString(), data: { persona: p.id } }],
    });
  }, []);

  const startCustom = useCallback(
    (profile: UserProfile) => {
      setState({ ...empty, profile, events: [{ type: "onboarding_completed", ts: new Date().toISOString(), data: { destination: profile.destinationId } }] });
      track("onboarding_completed", { destination: profile.destinationId });
      remote(saveProfile, profile);
    },
    [remote],
  );

  const setStatus = useCallback((taskId: string, st: TaskStatus) => {
    track("task_status", { taskId, status: st });
    remote(saveStatus, taskId, st);
    setState((s) => ({
      ...s,
      statuses: { ...s.statuses, [taskId]: st },
      completedOn: st === "completed" ? { ...s.completedOn, [taskId]: new Date().toISOString().slice(0, 10) } : s.completedOn,
      highlighted: s.highlighted.filter((h) => h !== taskId),
      events: [...s.events, { type: "task_status", ts: new Date().toISOString(), data: { taskId, status: st } }],
    }));
  }, [remote]);

  const addAssistant = useCallback((m: ChatMsg) => setState((s) => ({ ...s, assistant: [...s.assistant.slice(-60), m] })), []);
  const setHighlighted = useCallback((ids: string[]) => setState((s) => ({ ...s, highlighted: ids })), []);
  const rate = useCallback((n: number) => setState((s) => ({ ...s, satisfaction: n, events: [...s.events, { type: "satisfaction", ts: new Date().toISOString(), data: { score: n } }] })), []);
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setState(empty);
  }, []);

  const checklist = useMemo(
    () => (state.profile ? buildChecklist(state.profile.destinationId, state.profile.nationality, state.profile.purpose) : []),
    [state.profile],
  );

  const toggleDoc = useCallback(
    (doc: string) =>
      setState((s) => {
        const ready = !s.docs.includes(doc);
        remote(saveDoc, doc, ready);
        return { ...s, docs: ready ? [...s.docs, doc] : s.docs.filter((d) => d !== doc) };
      }),
    [remote],
  );
  const setFeedback = useCallback(
    (index: number, f: "up" | "down") =>
      setState((s) => ({
        ...s,
        assistant: s.assistant.map((m, i) => (i === index ? { ...m, feedback: f } : m)),
        events: [...s.events, { type: "assistant_feedback", ts: new Date().toISOString(), data: { value: f } }],
      })),
    [],
  );
  const clearAssistant = useCallback(() => setState((s) => ({ ...s, assistant: [] })), []);

  const value: Ctx = { ...state, docs: state.docs ?? [], ready, checklist, startPersona, startCustom, setStatus, log, addAssistant, setHighlighted, rate, reset, toggleDoc, setFeedback, clearAssistant };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}

export function statusOf(statuses: Record<string, TaskStatus>, id: string): TaskStatus {
  return statuses[id] ?? "pending";
}
