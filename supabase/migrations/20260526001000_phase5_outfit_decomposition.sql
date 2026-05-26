alter table public.prettify_jobs
  add column if not exists job_kind text not null default 'single_item',
  add column if not exists parent_job_id uuid references public.prettify_jobs(id) on delete cascade,
  add column if not exists garment_candidate_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prettify_jobs_job_kind_check'
  ) then
    alter table public.prettify_jobs
      add constraint prettify_jobs_job_kind_check
      check (job_kind in ('single_item', 'outfit_parent', 'outfit_candidate'));
  end if;
end;
$$;

create table if not exists public.garment_candidates (
  id uuid primary key default gen_random_uuid(),
  household_id text not null default 'demo-household',
  upload_batch_id uuid not null references public.upload_batches(id) on delete cascade,
  source_image_id uuid not null references public.source_images(id) on delete cascade,
  parent_job_id uuid not null references public.prettify_jobs(id) on delete cascade,
  proposed_name text not null,
  category text not null check (category in ('tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'combo')),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  visibility_state text not null check (visibility_state in ('visible', 'occluded', 'needs_review')),
  bounding_box jsonb not null,
  crop_prompt text not null default '',
  should_prettify boolean not null default false,
  status text not null check (status in ('detected', 'skipped', 'prettifying', 'ready', 'failed')),
  error_message text,
  detected_garment_id uuid references public.detected_garments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prettify_jobs_garment_candidate_id_fkey'
  ) then
    alter table public.prettify_jobs
      add constraint prettify_jobs_garment_candidate_id_fkey
      foreign key (garment_candidate_id)
      references public.garment_candidates(id)
      on delete set null;
  end if;
end;
$$;

alter table public.detected_garments
  add column if not exists source_image_id uuid references public.source_images(id) on delete set null,
  add column if not exists garment_candidate_id uuid references public.garment_candidates(id) on delete set null,
  add column if not exists visibility_state text check (visibility_state in ('visible', 'occluded', 'needs_review')),
  add column if not exists source_bounding_box jsonb;

create index if not exists prettify_jobs_parent_idx
  on public.prettify_jobs (parent_job_id);

create index if not exists prettify_jobs_candidate_idx
  on public.prettify_jobs (garment_candidate_id);

create index if not exists garment_candidates_batch_idx
  on public.garment_candidates (upload_batch_id, created_at);

create index if not exists garment_candidates_parent_job_idx
  on public.garment_candidates (parent_job_id);

create or replace function public.touch_garment_candidate_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists garment_candidates_touch_updated_at on public.garment_candidates;

create trigger garment_candidates_touch_updated_at
before update on public.garment_candidates
for each row execute function public.touch_garment_candidate_updated_at();

alter table public.garment_candidates disable row level security;
