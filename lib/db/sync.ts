"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskStatus, UserProfile } from "@/lib/types";

/**
 * Persistence adapter between the client store and Postgres (Supabase, EU).
 * Row-level security limits every query to the signed-in user's own rows in their institution.
 */
export interface Session {
  userId: string;
  orgId: string;
  role: "student" | "coordinator" | "partner" | "admin";
}

export async function getSession(sb: SupabaseClient): Promise<Session | null> {
  const { data: auth } = await sb.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;
  const { data } = await sb.from("memberships").select("org_id, role").eq("user_id", userId).limit(1).maybeSingle();
  if (!data) return null;
  return { userId, orgId: data.org_id, role: data.role };
}

export interface RemoteState {
  profile: UserProfile | null;
  statuses: Record<string, TaskStatus>;
  completedOn: Record<string, string>;
  docs: string[];
}

export async function loadState(sb: SupabaseClient, s: Session): Promise<RemoteState> {
  const [p, tp, dc] = await Promise.all([
    sb.from("student_profiles").select("*").eq("org_id", s.orgId).eq("user_id", s.userId).maybeSingle(),
    sb.from("task_progress").select("task_id, status, completed_on").eq("org_id", s.orgId).eq("user_id", s.userId),
    sb.from("document_checklist").select("document, ready").eq("org_id", s.orgId).eq("user_id", s.userId),
  ]);
  const r = p.data;
  const profile: UserProfile | null = r
    ? {
        name: r.display_name ?? "",
        nationality: r.nationality,
        nationalityLabel: r.nationality_label ?? "",
        passport: "",
        phone: "",
        email: "",
        destinationId: r.destination_id,
        purpose: r.purpose,
        institution: r.institution ?? "",
        arrivalDate: r.arrival_date ?? "",
        duration: r.duration ?? "",
        neighbourhood: r.neighbourhood ?? "—",
        accommodation: r.accommodation ?? "",
      }
    : null;
  const statuses: Record<string, TaskStatus> = {};
  const completedOn: Record<string, string> = {};
  for (const row of tp.data ?? []) {
    statuses[row.task_id] = row.status;
    if (row.completed_on) completedOn[row.task_id] = row.completed_on;
  }
  return { profile, statuses, completedOn, docs: (dc.data ?? []).filter((d) => d.ready).map((d) => d.document) };
}

export async function saveProfile(sb: SupabaseClient, s: Session, p: UserProfile) {
  await sb.from("student_profiles").upsert(
    {
      org_id: s.orgId,
      user_id: s.userId,
      display_name: p.name,
      nationality: p.nationality,
      nationality_label: p.nationalityLabel,
      destination_id: p.destinationId,
      purpose: p.purpose,
      institution: p.institution,
      arrival_date: p.arrivalDate || null,
      duration: p.duration,
      neighbourhood: p.neighbourhood,
      accommodation: p.accommodation,
    },
    { onConflict: "org_id,user_id" },
  );
}

export async function saveStatus(sb: SupabaseClient, s: Session, taskId: string, status: TaskStatus) {
  await sb.from("task_progress").upsert(
    { org_id: s.orgId, user_id: s.userId, task_id: taskId, status, completed_on: status === "completed" ? new Date().toISOString().slice(0, 10) : null },
    { onConflict: "org_id,user_id,task_id" },
  );
}

export async function saveDoc(sb: SupabaseClient, s: Session, document: string, ready: boolean) {
  await sb.from("document_checklist").upsert({ org_id: s.orgId, user_id: s.userId, document, ready }, { onConflict: "org_id,user_id,document" });
}

export async function saveEvent(sb: SupabaseClient, s: Session, type: string, data?: Record<string, unknown>) {
  await sb.from("app_events").insert({ org_id: s.orgId, user_id: s.userId, type, data: data ?? {} });
}
