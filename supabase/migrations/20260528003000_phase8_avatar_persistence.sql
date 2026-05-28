insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatar-assets', 'avatar-assets', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.avatar_profiles (
  id text primary key,
  household_id text not null default 'demo-household',
  profile_id text not null default 'profile-aankur',
  face_asset_id text not null,
  body_asset_id text not null,
  face_bucket text not null check (face_bucket = 'avatar-assets'),
  face_storage_path text not null,
  face_content_type text not null check (face_content_type in ('image/jpeg', 'image/png', 'image/webp')),
  body_bucket text not null check (body_bucket = 'avatar-assets'),
  body_storage_path text not null,
  body_content_type text not null check (body_content_type in ('image/jpeg', 'image/png', 'image/webp')),
  face_quality jsonb not null,
  body_quality jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, profile_id)
);

create table if not exists public.avatar_renders (
  id uuid primary key default gen_random_uuid(),
  household_id text not null default 'demo-household',
  profile_id text not null default 'profile-aankur',
  avatar_profile_id text not null,
  saved_outfit_id text not null,
  cache_key text not null,
  request jsonb not null,
  status text not null check (status in ('ready', 'failed', 'deleted')),
  image_asset_id text,
  image_bucket text check (image_bucket = 'avatar-assets'),
  image_storage_path text,
  image_content_type text check (image_content_type in ('image/png', 'image/jpeg', 'image/webp')),
  quality_notes text[] not null default '{}',
  provider_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists avatar_profiles_household_profile_idx
  on public.avatar_profiles (household_id, profile_id);

create index if not exists avatar_renders_cache_ready_idx
  on public.avatar_renders (household_id, cache_key, created_at desc)
  where status = 'ready';

create index if not exists avatar_renders_profile_created_idx
  on public.avatar_renders (household_id, profile_id, created_at desc);

create or replace function public.touch_avatar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists avatar_profiles_touch_updated_at on public.avatar_profiles;
create trigger avatar_profiles_touch_updated_at
before update on public.avatar_profiles
for each row execute function public.touch_avatar_updated_at();

drop trigger if exists avatar_renders_touch_updated_at on public.avatar_renders;
create trigger avatar_renders_touch_updated_at
before update on public.avatar_renders
for each row execute function public.touch_avatar_updated_at();

alter table public.avatar_profiles disable row level security;
alter table public.avatar_renders disable row level security;
