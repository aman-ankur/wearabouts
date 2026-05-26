create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('source-images', 'source-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('closet-assets', 'closet-assets', false, 10485760, array['image/png'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.upload_batches (
  id uuid primary key default gen_random_uuid(),
  household_id text not null default 'demo-household',
  profile_id text not null default 'profile-aankur',
  source_type text not null check (source_type in ('item_photo', 'outfit_photo', 'batch_upload')),
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.source_images (
  id uuid primary key default gen_random_uuid(),
  household_id text not null default 'demo-household',
  profile_id text not null default 'profile-aankur',
  upload_batch_id uuid not null references public.upload_batches(id) on delete cascade,
  bucket text not null default 'source-images' check (bucket = 'source-images'),
  storage_path text not null,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  original_filename text not null,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table if not exists public.prettify_jobs (
  id uuid primary key default gen_random_uuid(),
  household_id text not null default 'demo-household',
  profile_id text not null default 'profile-aankur',
  upload_batch_id uuid not null references public.upload_batches(id) on delete cascade,
  source_image_id uuid not null references public.source_images(id) on delete cascade,
  status text not null check (status in ('queued', 'analyzing', 'prettifying', 'validating', 'ready', 'failed')),
  error_message text,
  detected_garment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.detected_garments (
  id uuid primary key default gen_random_uuid(),
  household_id text not null default 'demo-household',
  upload_batch_id uuid not null references public.upload_batches(id) on delete cascade,
  proposed_name text not null,
  brand text not null default '',
  category text not null check (category in ('tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'combo')),
  owner_profile_id text not null default 'profile-aankur',
  source_type text not null check (source_type in ('item_photo', 'outfit_photo', 'batch_upload')),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  prettify_status text not null check (prettify_status in ('not_started', 'processing', 'ready', 'needs_review', 'failed')),
  is_layered boolean not null default false,
  ready_for_mixer boolean not null default false,
  asset_id text not null,
  asset_label text not null,
  asset_bucket text not null check (asset_bucket = 'closet-assets'),
  asset_storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  household_id text not null default 'demo-household',
  source_detected_garment_id uuid not null,
  name text not null,
  brand text not null default '',
  category text not null check (category in ('tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'combo')),
  owner_profile_id text not null default 'profile-aankur',
  asset_id text not null,
  asset_label text not null,
  asset_bucket text not null check (asset_bucket = 'closet-assets'),
  asset_storage_path text not null,
  added_at timestamptz not null default now(),
  ready_for_mixer boolean not null default false
);

alter table public.prettify_jobs
  add constraint prettify_jobs_detected_garment_id_fkey
  foreign key (detected_garment_id)
  references public.detected_garments(id)
  on delete set null;

create index if not exists upload_batches_household_created_idx
  on public.upload_batches (household_id, created_at desc);

create index if not exists source_images_batch_idx
  on public.source_images (upload_batch_id);

create index if not exists prettify_jobs_batch_idx
  on public.prettify_jobs (upload_batch_id);

create index if not exists prettify_jobs_source_idx
  on public.prettify_jobs (source_image_id);

create index if not exists detected_garments_batch_idx
  on public.detected_garments (upload_batch_id, created_at);

create index if not exists wardrobe_items_household_added_idx
  on public.wardrobe_items (household_id, added_at);

create or replace function public.touch_prettify_job_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prettify_jobs_touch_updated_at on public.prettify_jobs;

create trigger prettify_jobs_touch_updated_at
before update on public.prettify_jobs
for each row execute function public.touch_prettify_job_updated_at();

alter table public.upload_batches disable row level security;
alter table public.source_images disable row level security;
alter table public.prettify_jobs disable row level security;
alter table public.detected_garments disable row level security;
alter table public.wardrobe_items disable row level security;
