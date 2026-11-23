/** Roles per institution (mirrors the app_role enum in supabase/migrations). */
export type Role = "student" | "coordinator" | "partner" | "admin";

export type Action =
  | "read:own-progress"
  | "write:own-progress"
  | "read:cohort" // all students of the institution (office console, Sprint 4)
  | "manage:cohort" // CSV import, institution steps
  | "read:referrals" // partner hand-offs (Sprint 6)
  | "manage:institution"; // members, flags, SSO

const MATRIX: Record<Role, Action[]> = {
  student: ["read:own-progress", "write:own-progress"],
  coordinator: ["read:own-progress", "write:own-progress", "read:cohort", "manage:cohort"],
  partner: ["read:referrals"],
  admin: ["read:own-progress", "write:own-progress", "read:cohort", "manage:cohort", "read:referrals", "manage:institution"],
};

/** UI-level check only; the database enforces the same rules with row-level security. */
export function can(role: Role | null | undefined, action: Action): boolean {
  return !!role && MATRIX[role].includes(action);
}
