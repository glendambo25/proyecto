-- Nomad pilot: every new sign-up joins an institution as a student.
-- If the sign-up carries an `org` slug in user metadata (institution invite link), it joins that one;
-- otherwise the default "nomad-pilot" institution. Roles above student are granted by an admin.

insert into public.organizations (name, slug) values ('Nomad Pilot', 'nomad-pilot')
on conflict (slug) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare target uuid;
begin
  select id into target from public.organizations
   where slug = coalesce(new.raw_user_meta_data ->> 'org', 'nomad-pilot');
  if target is null then
    select id into target from public.organizations where slug = 'nomad-pilot';
  end if;
  if target is not null then
    insert into public.memberships (user_id, org_id, role) values (new.id, target, 'student')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
