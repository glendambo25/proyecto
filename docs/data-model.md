# Data model (Sprint 1)

Postgres on Supabase, **EU region (Frankfurt, `eu-central-1`)**. Every row belongs to an **organization** (university or company). Isolation between organizations is enforced in the database with row-level security (RLS), not only in the app.

Migration: [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) · Test: [`tests/rls.test.ts`](../tests/rls.test.ts) (`npm test`).

## Roles

| Role | Who | What they can see |
|---|---|---|
| `student` | Outgoing / incoming student | Only their own rows, only in organizations they belong to |
| `coordinator` | International office staff | All student rows of **their** organization, nothing of other organizations |
| `partner` | Advisor, insurer, housing… | No student rows yet (referrals come in Sprint 6) |
| `admin` | Institution admin | Like coordinator, plus manage memberships, org settings and org feature flags |

A user can belong to several organizations, with one role in each (`memberships`).

## Tables

| Table | Purpose | Key |
|---|---|---|
| `organizations` | Universities / companies; `sso` jsonb prepared for SAML/OIDC (`provider`, `domain`, `metadata_url`, `sso_provider_id`) | `id` |
| `memberships` | User ↔ organization with `role` | `(user_id, org_id)` |
| `student_profiles` | Onboarding answers (nationality eu/non-eu, destination, purpose, institution, arrival date…) | `id`, unique `(org_id, user_id)` |
| `task_progress` | Status per checklist step (`pending`, `in_progress`, `completed`) and completion date | `(org_id, user_id, task_id)` |
| `document_checklist` | Documents the student marked as ready | `(org_id, user_id, document)` |
| `assistant_messages` | Assistant conversation, cited sources, covered/offline flags, feedback | `id` |
| `app_events` | Backup of analytics events (PostHog is primary); **no personal data in `data`** | `id` |
| `feature_flags` | `org_id = null` → global default, org row overrides it. Seeded: `voice_agent = false`, `people_chat = false` | unique `(coalesce(org_id, 0-uuid), key)` |

Checklist content (steps, sources, dependencies) is **not** in these tables: it comes from the verified content files / rules engine (Sprint 2).

## Policy matrix

| Table | Student | Coordinator | Partner | Admin |
|---|---|---|---|---|
| `organizations` | read own orgs | read own orgs | read own orgs | read + update own org |
| `memberships` | read own | read own | read own | read / write own org |
| `student_profiles`, `task_progress`, `document_checklist`, `assistant_messages`, `app_events` | read / write **own rows** in own orgs | read **all rows of own org** (+ own rows) | own rows only (none) | read all rows of own org (+ own rows) |
| `feature_flags` | read global + own orgs | read global + own orgs | read global + own orgs | + write own org's flags |

Helpers `public.is_member(org)` and `public.has_role(org, roles[])` are `security definer` (so policies can read `memberships` without recursive RLS) and use `auth.uid()`. Creating organizations and the first admin is done with the **service role** (server only), never from the browser.

The test seeds two fictional universities ("Universidad Demo Norte", "Universidad Demo Sur"), a coordinator and two students in each, and a partner. It checks that a student sees only their rows, each coordinator sees only their university, nobody can write into another university or another student's rows, partners see no student data, and only admins can change flags. Current result: **10/10 passing**.

## Applying it to the real project (when the founder provides access)

1. Create a Supabase project in **EU Central (Frankfurt)**.
2. In the SQL editor (or `supabase db push` with the CLI linked to the project), run `supabase/migrations/0001_init.sql`.
3. Add to `.env.local` (never commit):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for the browser; RLS protects the data)
   - `SUPABASE_SERVICE_ROLE_KEY` — **server only** (API routes / scripts for org creation and seeding). Never in client code or `NEXT_PUBLIC_*`.
4. Create the first organization and its admin with the service role, then add coordinators and students through memberships.

## Authentication and SSO

- Students: email **magic link** (Supabase Auth, passwordless).
- Institutions: **SAML 2.0 SSO** configured per institution in Supabase Auth (SSO providers). The provider id and email domain are stored in `organizations.sso`, so a user signing in through an institution's IdP is mapped to that organization's membership.
- Real personal data (including passports) stays out until the founder confirms the DPIA and the data-processing agreement are signed. Until then, only fictional test data.
