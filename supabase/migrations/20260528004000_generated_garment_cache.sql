alter table public.source_images
  add column if not exists content_hash text;

create index if not exists source_images_content_hash_idx
  on public.source_images (household_id, profile_id, content_hash);

create table if not exists public.generated_garment_cache (
  id uuid primary key default gen_random_uuid(),
  household_id text not null default 'demo-household',
  profile_id text not null default 'profile-aankur',
  cache_key text not null,
  asset_id text not null,
  asset_label text not null,
  asset_bucket text not null check (asset_bucket = 'closet-assets'),
  asset_storage_path text not null,
  quality_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, profile_id, cache_key)
);

create index if not exists generated_garment_cache_key_idx
  on public.generated_garment_cache (household_id, profile_id, cache_key);

create or replace function public.touch_generated_garment_cache_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists generated_garment_cache_touch_updated_at on public.generated_garment_cache;

create trigger generated_garment_cache_touch_updated_at
before update on public.generated_garment_cache
for each row
execute function public.touch_generated_garment_cache_updated_at();

alter table public.generated_garment_cache disable row level security;
