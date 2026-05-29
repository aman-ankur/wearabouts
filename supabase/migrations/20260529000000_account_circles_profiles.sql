create extension if not exists pgcrypto;

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (circle_id, user_id)
);

create table if not exists public.wardrobe_profiles (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  gender_presentation text not null check (gender_presentation in ('men', 'women', 'unisex', 'prefer_not_to_say')),
  profile_type text not null check (profile_type in ('personal', 'shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (circle_id, owner_user_id, profile_type)
);

create index if not exists circles_created_by_user_idx
  on public.circles (created_by_user_id, created_at desc);

create index if not exists circle_members_user_idx
  on public.circle_members (user_id, created_at);

create index if not exists wardrobe_profiles_circle_idx
  on public.wardrobe_profiles (circle_id, created_at);

create or replace function public.touch_account_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists circles_touch_updated_at on public.circles;
create trigger circles_touch_updated_at
before update on public.circles
for each row execute function public.touch_account_updated_at();

drop trigger if exists wardrobe_profiles_touch_updated_at on public.wardrobe_profiles;
create trigger wardrobe_profiles_touch_updated_at
before update on public.wardrobe_profiles
for each row execute function public.touch_account_updated_at();

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.wardrobe_profiles enable row level security;

drop policy if exists "Members can read their circles" on public.circles;
create policy "Members can read their circles"
on public.circles
for select
to authenticated
using (
  exists (
    select 1
    from public.circle_members
    where circle_members.circle_id = circles.id
      and circle_members.user_id = auth.uid()
  )
);

drop policy if exists "Members can read circle members" on public.circle_members;
create policy "Members can read circle members"
on public.circle_members
for select
to authenticated
using (
  exists (
    select 1
    from public.circle_members viewer
    where viewer.circle_id = circle_members.circle_id
      and viewer.user_id = auth.uid()
  )
);

drop policy if exists "Members can read wardrobe profiles" on public.wardrobe_profiles;
create policy "Members can read wardrobe profiles"
on public.wardrobe_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.circle_members
    where circle_members.circle_id = wardrobe_profiles.circle_id
      and circle_members.user_id = auth.uid()
  )
);
