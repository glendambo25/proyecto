-- Arrival — Sprint 1: multi-institution data model with row-level security.
-- Target: Supabase project in the EU (Frankfurt, eu-central-1). Postgres 15+.
-- Every row belongs to an organization (university / company). Students only see
-- their own rows; coordinators and admins see their own organization only.

-- gen_random_uuid() is built into Postgres 13+ (no extension needed).

-- ---------------------------------------------------------------- roles
do $$ begin
  create type public.app_role as enum ('student', 'coordinator', 'partner', 'admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- tables
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  -- Prepared for institutional SSO (SAML / OIDC), configured in Supabase Auth:
  -- { "provider": "saml" | "oidc", "domain": "uni.example", "metadata_url": "...", "sso_provider_id": "..." }
  sso jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  primary key (user_id, org_id)
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text,
  nationality text check (nationality in ('eu', 'non-eu')),
  nationality_label text,
  destination_id text,
  purpose text check (purpose in ('study', 'internship', 'work')),
  institution text,
  arrival_date date,
  duration text,
  neighbourhood text,
  accommodation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists public.task_progress (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  completed_on date,
  updated_at timestamptz not null default now(),
  primary key (org_id, user_id, task_id)
);

create table if not exists public.document_checklist (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  document text not null,
  ready boolean not null default false,
  primary key (org_id, user_id, document)
);

create table if not exists public.assistant_messages (
  id bigserial primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  sources jsonb,
  covered boolean,
  offline boolean,
  feedback text check (feedback in ('up', 'down')),
  created_at timestamptz not null default now()
);

-- Backup of analytics events (PostHog is primary). `data` must never hold personal data.
create table if not exists public.app_events (
  id bigserial primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- org_id null = global default; an org row overrides the global one.
create table if not exists public.feature_flags (
  org_id uuid references public.organizations (id) on delete cascade,
  key text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create unique index if not exists feature_flags_scope_key
  on public.feature_flags (coalesce(org_id, '00000000-0000-0000-0000-000000000000'::uuid), key);

-- ---------------------------------------------------------------- indexes
create index if not exists memberships_org_idx on public.memberships (org_id);
create index if not exists student_profiles_org_idx on public.student_profiles (org_id);
create index if not exists student_profiles_user_idx on public.student_profiles (user_id);
create index if not exists task_progress_user_idx on public.task_progress (user_id);
create index if not exists document_checklist_user_idx on public.document_checklist (user_id);
create index if not exists assistant_messages_org_user_idx on public.assistant_messages (org_id, user_id);
create index if not exists app_events_org_type_idx on public.app_events (org_id, type, created_at);

-- ---------------------------------------------------------------- helpers
-- security definer so policies can read memberships without recursive RLS.
create or replace function public.is_member(org uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.memberships m where m.org_id = org and m.user_id = auth.uid());
$$;

create or replace function public.has_role(org uuid, roles public.app_role[])
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = org and m.user_id = auth.uid() and m.role = any (roles)
  );
$$;

-- ---------------------------------------------------------------- RLS
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.student_profiles enable row level security;
alter table public.task_progress enable row level security;
alter table public.document_checklist enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.app_events enable row level security;
alter table public.feature_flags enable row level security;

-- organizations: members read; admins of the org update. Creating orgs is a service-role task.
create policy org_select on public.organizations for select to authenticated
  using (public.is_member(id));
create policy org_update on public.organizations for update to authenticated
  using (public.has_role(id, array['admin']::public.app_role[]))
  with check (public.has_role(id, array['admin']::public.app_role[]));

-- memberships: own rows; admins see and manage their org's.
create policy mem_select on public.memberships for select to authenticated
  using (user_id = auth.uid() or public.has_role(org_id, array['admin']::public.app_role[]));
create policy mem_insert on public.memberships for insert to authenticated
  with check (public.has_role(org_id, array['admin']::public.app_role[]));
create policy mem_update on public.memberships for update to authenticated
  using (public.has_role(org_id, array['admin']::public.app_role[]))
  with check (public.has_role(org_id, array['admin']::public.app_role[]));
create policy mem_delete on public.memberships for delete to authenticated
  using (public.has_role(org_id, array['admin']::public.app_role[]));

-- Student-owned tables: same four policies on each.
do $$
declare t text;
begin
  foreach t in array array['student_profiles', 'task_progress', 'document_checklist', 'assistant_messages', 'app_events'] loop
    execute format($p$
      create policy %1$s_select on public.%1$s for select to authenticated
        using (
          (user_id = auth.uid() and public.is_member(org_id))
          or public.has_role(org_id, array['coordinator','admin']::public.app_role[])
        );
      create policy %1$s_insert on public.%1$s for insert to authenticated
        with check (user_id = auth.uid() and public.is_member(org_id));
      create policy %1$s_update on public.%1$s for update to authenticated
        using (user_id = auth.uid() and public.is_member(org_id))
        with check (user_id = auth.uid() and public.is_member(org_id));
      create policy %1$s_delete on public.%1$s for delete to authenticated
        using (user_id = auth.uid() and public.is_member(org_id));
    $p$, t);
  end loop;
end $$;

-- feature_flags: global defaults readable by any signed-in user; org flags by members; admins write their org's.
create policy flags_select on public.feature_flags for select to authenticated
  using (org_id is null or public.is_member(org_id));
create policy flags_write on public.feature_flags for all to authenticated
  using (org_id is not null and public.has_role(org_id, array['admin']::public.app_role[]))
  with check (org_id is not null and public.has_role(org_id, array['admin']::public.app_role[]));

-- ---------------------------------------------------------------- grants (Supabase defaults, explicit for clarity)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.is_member(uuid), public.has_role(uuid, public.app_role[]) to authenticated;
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------- seed: global flags (off by default)
insert into public.feature_flags (org_id, key, enabled) values
  (null, 'voice_agent', false),
  (null, 'people_chat', false)
on conflict do nothing;
