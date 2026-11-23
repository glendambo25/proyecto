# Nomad — metrics plan (PostHog EU)

Analytics run on PostHog **EU cloud** (`https://eu.i.posthog.com`), enabled only when `NEXT_PUBLIC_POSTHOG_KEY` is set. `lib/analytics.ts` sends event names plus a whitelist of small, non-identifying properties (no names, emails, passports or free text). Signed-in users are identified by an opaque Supabase user id and grouped by institution (`group: institution`). Every event is also stored in the `app_events` table (EU Postgres) as a backup.

| KPI (pilot question) | Event(s) | Properties | Definition |
|---|---|---|---|
| Activation | `onboarding_completed` | `destination`, `persona` (demo) | % of new users who finish onboarding |
| Progress / tasks completed | `task_status` | `taskId`, `status` | completed steps per student per week; % of critical steps done before deadline |
| Assistant with source | `assistant_question`, `assistant_answer` | `channel` (text/voice), `covered`, `offline` | share of answers with a verified source (`covered=true`); target 100% of shown facts |
| Assistant without source | `assistant_answer` with `covered=false` | — | how often we say "no verified source yet"; drives content backlog |
| Answer quality | `assistant_feedback` | `value` (up/down) | thumbs-up rate |
| Partner referrals ("Do it for me") | `done_for_you_request`, `done_for_you_interest` | `taskId`, `plan` | referrals per 100 students; validates partner commission hypothesis |
| Premium conversion | `premium_interest` | `plan` | free → premium interest rate (price hypothesis 19–39 €) |
| Voice usage | `voice_call_start`, `voice_call_end`, `voice_accent` | `accent`, `language` | share of users trying voice (feature-flagged) |
| Documents readiness | `document_toggle` | `ready` | documents ready before arrival |
| Satisfaction | `satisfaction` | `score` 1–5 | average score |
| Calendar adoption | `calendar_export` | `events` | users exporting deadlines |
| Sign-in | `login_link_requested` | `ok` | magic-link funnel |

Rules: every new feature ships with its event from day one; add new property names to the whitelist in `lib/analytics.ts` only if they cannot identify a person.
