/**
 * Sprint 1 "done when": two test universities cannot see each other's data.
 * Runs the real migration on an in-process Postgres (PGlite) with a stub of
 * Supabase's `auth` schema and roles, then queries as each user under RLS.
 * All people and organizations here are fictional.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATION = readFileSync(join(process.cwd(), "supabase", "migrations", "0001_init.sql"), "utf8");

const ORG = {
  norte: "00000000-0000-0000-0000-0000000000a1",
  sur: "00000000-0000-0000-0000-0000000000b1",
};
const U = {
  coordNorte: "11111111-0000-0000-0000-000000000001",
  ana: "11111111-0000-0000-0000-000000000002", // student, Norte
  bilal: "11111111-0000-0000-0000-000000000003", // student, Norte
  coordSur: "22222222-0000-0000-0000-000000000001",
  chen: "22222222-0000-0000-0000-000000000002", // student, Sur
  diya: "22222222-0000-0000-0000-000000000003", // student, Sur
  partner: "33333333-0000-0000-0000-000000000001", // partner in Norte
};

let db: PGlite;

/** Run `sql` as a signed-in user (role authenticated + JWT sub claim), like PostgREST does. */
async function as<T = Record<string, unknown>>(userId: string, sql: string, params: unknown[] = []) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec("set role authenticated");
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  db = new PGlite();
  // --- Supabase-like environment stub
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);
  await db.exec(MIGRATION);

  // --- seed as superuser (service role)
  for (const id of Object.values(U)) await db.query("insert into auth.users (id) values ($1)", [id]);
  await db.query("insert into organizations (id, name, slug) values ($1,'Universidad Demo Norte','demo-norte'),($2,'Universidad Demo Sur','demo-sur')", [ORG.norte, ORG.sur]);
  const members: [string, string, string][] = [
    [U.coordNorte, ORG.norte, "coordinator"],
    [U.ana, ORG.norte, "student"],
    [U.bilal, ORG.norte, "student"],
    [U.partner, ORG.norte, "partner"],
    [U.coordSur, ORG.sur, "coordinator"],
    [U.chen, ORG.sur, "student"],
    [U.diya, ORG.sur, "student"],
  ];
  for (const [u, o, r] of members) await db.query("insert into memberships (user_id, org_id, role) values ($1,$2,$3)", [u, o, r]);
  const progress: [string, string, string, string][] = [
    [ORG.norte, U.ana, "visa", "completed"],
    [ORG.norte, U.ana, "tie", "pending"],
    [ORG.norte, U.bilal, "visa", "in_progress"],
    [ORG.sur, U.chen, "visa", "completed"],
    [ORG.sur, U.diya, "padron", "pending"],
  ];
  for (const [o, u, t, s] of progress) await db.query("insert into task_progress (org_id, user_id, task_id, status) values ($1,$2,$3,$4)", [o, u, t, s]);
  await db.query("insert into student_profiles (org_id, user_id, display_name, nationality, destination_id, purpose) values ($1,$2,'Ana Demo','non-eu','madrid','study'),($3,$4,'Chen Demo','non-eu','madrid','study')", [ORG.norte, U.ana, ORG.sur, U.chen]);
});

afterAll(async () => {
  await db?.close();
});

describe("row-level security between institutions", () => {
  it("a student sees only their own progress", async () => {
    const rows = await as<{ user_id: string }>(U.ana, "select user_id from task_progress");
    expect(rows.length).toBe(2);
    expect(rows.every((r) => r.user_id === U.ana)).toBe(true);
  });

  it("Norte's coordinator sees all Norte students and zero Sur rows", async () => {
    const rows = await as<{ org_id: string }>(U.coordNorte, "select org_id from task_progress");
    expect(rows.length).toBe(3);
    expect(rows.every((r) => r.org_id === ORG.norte)).toBe(true);
    const sur = await as<{ n: number }>(U.coordNorte, "select count(*)::int as n from task_progress where org_id = $1", [ORG.sur]);
    expect(sur[0].n).toBe(0);
    const profiles = await as(U.coordNorte, "select * from student_profiles where org_id = $1", [ORG.sur]);
    expect(profiles.length).toBe(0);
  });

  it("Sur's coordinator sees all Sur students and zero Norte rows", async () => {
    const rows = await as<{ org_id: string }>(U.coordSur, "select org_id from task_progress");
    expect(rows.length).toBe(2);
    expect(rows.every((r) => r.org_id === ORG.sur)).toBe(true);
  });

  it("a coordinator cannot see the other university at all", async () => {
    const orgs = await as<{ id: string }>(U.coordNorte, "select id from organizations");
    expect(orgs.map((o) => o.id)).toEqual([ORG.norte]);
    const members = await as(U.coordNorte, "select * from memberships where org_id = $1", [ORG.sur]);
    expect(members.length).toBe(0);
  });

  it("a student cannot write progress into another university", async () => {
    await expect(as(U.ana, "insert into task_progress (org_id, user_id, task_id, status) values ($1,$2,'visa','completed')", [ORG.sur, U.ana])).rejects.toThrow(/row-level security/i);
  });

  it("a student cannot write progress for another student", async () => {
    await expect(as(U.ana, "insert into task_progress (org_id, user_id, task_id, status) values ($1,$2,'bank','completed')", [ORG.norte, U.bilal])).rejects.toThrow(/row-level security/i);
  });

  it("a student cannot change another student's progress", async () => {
    await as(U.ana, "update task_progress set status = 'completed' where user_id = $1", [U.bilal]);
    const rows = await db.query<{ status: string }>("select status from task_progress where user_id = $1 and task_id = 'visa'", [U.bilal]);
    expect(rows.rows[0].status).toBe("in_progress");
  });

  it("a partner sees no student rows", async () => {
    expect((await as(U.partner, "select * from task_progress")).length).toBe(0);
    expect((await as(U.partner, "select * from student_profiles")).length).toBe(0);
  });

  it("global feature flags are readable and off by default", async () => {
    const flags = await as<{ key: string; enabled: boolean }>(U.chen, "select key, enabled from feature_flags where org_id is null order by key");
    expect(flags).toEqual([
      { key: "people_chat", enabled: false },
      { key: "voice_agent", enabled: false },
    ]);
  });

  it("only admins can change flags", async () => {
    await expect(as(U.coordNorte, "insert into feature_flags (org_id, key, enabled) values ($1,'voice_agent',true)", [ORG.norte])).rejects.toThrow(/row-level security/i);
  });
});
