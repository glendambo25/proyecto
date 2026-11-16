"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
}

interface State {
  profile: UserProfile | null;
  statuses: Record<string, TaskStatus>;
  completedOn: Record<string, string>;
  events: AppEvent[];
  assistant: ChatMsg[];
  highlighted: string[];
  satisfaction?: number;
}

const KEY = "arrival-demo-v1";
const empty: State = { profile: null, statuses: {}, completedOn: {}, events: [], assistant: [], highlighted: [] };

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

  const log = useCallback((type: string, data?: Record<string, unknown>) => {
    setState((s) => ({ ...s, events: [...s.events.slice(-499), { type, ts: new Date().toISOString(), data }] }));
  }, []);

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

  const startCustom = useCallback((profile: UserProfile) => {
    setState({ ...empty, profile, events: [{ type: "onboarding_completed", ts: new Date().toISOString(), data: { destination: profile.destinationId } }] });
  }, []);

  const setStatus = useCallback((taskId: string, st: TaskStatus) => {
    setState((s) => ({
      ...s,
      statuses: { ...s.statuses, [taskId]: st },
      completedOn: st === "completed" ? { ...s.completedOn, [taskId]: new Date().toISOString().slice(0, 10) } : s.completedOn,
      highlighted: s.highlighted.filter((h) => h !== taskId),
      events: [...s.events, { type: "task_status", ts: new Date().toISOString(), data: { taskId, status: st } }],
    }));
  }, []);

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

  const value: Ctx = { ...state, ready, checklist, startPersona, startCustom, setStatus, log, addAssistant, setHighlighted, rate, reset };
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
