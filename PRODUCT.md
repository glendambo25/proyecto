# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a non-EU student arriving in Spain (Madrid first) for a degree or exchange, often on a weaker passport, who must get visa, residence card (TIE), padrón, insurance and a bank account done in the right order and on time. Outgoing Spanish Erasmus students use it free as a channel. Later: interns and posted employees.

Buyers (B2B): admissions and international offices of private universities, later HR teams. Not the user of these screens, but they must trust what students see.

## Product Purpose

Replace ~10 scattered procedures with one personalised checklist for the student's country of arrival, nationality and reason for moving, ordered by dependencies, where every step and every assistant answer shows its official source and the date it was last verified. Success: the student arrives on time with nothing missing, and an international office can rely on the information.

## Positioning

A verified, monitored rules engine for arrival paperwork: each requirement is tied to an official government source with a last-verified date, and the order of steps (what unlocks what) is explicit. Generic AI answers and university PDFs give neither.

## Operating Context

Students use it on their phone before and after arriving, often stressed and in a second language. It is demoed to universities' international offices on a laptop. The app UI is in English (12 languages planned, Spanish canonical); official procedure names stay in the original language with an English explanation (e.g. "Empadronamiento (address registration)").

## Capabilities and Constraints

- Personalised checklist with dependencies (dependsOn / unlocks), phases (before, first days, settling in, going home), deadlines, documents, official source + lastVerified + verificationStatus per step.
- Assistant (text and voice) that answers only from verified content and says when it has no source.
- Document wallet, deadlines calendar (.ics), city guide, chats, "Do it for me" partner hand-off (no payments taken).
- Next.js + PWA, mobile-first with a desktop layout. No native app yet.
- Never invent data: unverifiable items are marked "TODO: verify". No real personal data until the founder confirms the DPIA; demo users are fictional.
- Never automate booking official appointments (cita previa); information and preparation only.

## Brand Commitments

None binding. Name "Arrival" is provisional; the presentation's navy/indigo palette is not mandatory. Tagline in use: "You move. We handle the paperwork."

## Evidence on Hand

- Verified official sources (checked 2026-11-16) in `content/*.json` for the demo cities; unverified ones marked TODO.
- Six user interviews (summarised in the original brief): ordering mistakes are costly, university PDFs are generic, generic AI is not trusted without source and date, housing scams are the main stress.
- No customers, prices, metrics or testimonials exist yet. Prices are hypotheses; do not fabricate any of these.

## Product Principles

1. Source and date on everything, or say "no verified source yet".
2. Order before content: show what unlocks what.
3. Calm and fast to understand under stress.
4. Trustworthy enough for an international office to recommend.
5. Never lose a capability when redesigning.
