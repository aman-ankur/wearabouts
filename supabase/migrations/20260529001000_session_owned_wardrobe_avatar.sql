alter table public.garment_candidates
  add column if not exists profile_id text not null default 'profile-aankur';

create index if not exists garment_candidates_household_profile_batch_idx
  on public.garment_candidates (household_id, profile_id, upload_batch_id);

create index if not exists upload_batches_household_profile_created_idx
  on public.upload_batches (household_id, profile_id, created_at desc);

create index if not exists wardrobe_items_household_profile_added_idx
  on public.wardrobe_items (household_id, owner_profile_id, added_at desc);

create index if not exists detected_garments_household_profile_batch_idx
  on public.detected_garments (household_id, owner_profile_id, upload_batch_id);

create or replace function public.is_circle_member(circle_id_text text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_members
    where circle_members.circle_id::text = circle_id_text
      and circle_members.user_id = auth.uid()
  );
$$;

alter table public.source_images
  drop constraint if exists source_images_storage_path_owner_prefix,
  add constraint source_images_storage_path_owner_prefix
  check (storage_path ~ ('^' || household_id || '/' || profile_id || '/[^/]+\.(jpg|jpeg|png|webp)$')) not valid;

alter table public.detected_garments
  drop constraint if exists detected_garments_asset_path_owner_prefix,
  add constraint detected_garments_asset_path_owner_prefix
  check (asset_storage_path ~ ('^' || household_id || '/' || owner_profile_id || '/[^/]+\.png$')) not valid;

alter table public.wardrobe_items
  drop constraint if exists wardrobe_items_asset_path_owner_prefix,
  add constraint wardrobe_items_asset_path_owner_prefix
  check (asset_storage_path ~ ('^' || household_id || '/' || owner_profile_id || '/[^/]+\.png$')) not valid;

alter table public.generated_garment_cache
  drop constraint if exists generated_garment_cache_asset_path_owner_prefix,
  add constraint generated_garment_cache_asset_path_owner_prefix
  check (asset_storage_path ~ ('^' || household_id || '/' || profile_id || '/[^/]+\.png$')) not valid;

alter table public.avatar_profiles
  drop constraint if exists avatar_profiles_face_path_owner_prefix,
  add constraint avatar_profiles_face_path_owner_prefix
  check (face_storage_path ~ ('^' || household_id || '/' || profile_id || '/avatar-face-[^/]+\.(jpg|jpeg|png|webp)$')) not valid,
  drop constraint if exists avatar_profiles_body_path_owner_prefix,
  add constraint avatar_profiles_body_path_owner_prefix
  check (body_storage_path ~ ('^' || household_id || '/' || profile_id || '/avatar-body-[^/]+\.(jpg|jpeg|png|webp)$')) not valid;

alter table public.avatar_renders
  drop constraint if exists avatar_renders_image_path_owner_prefix,
  add constraint avatar_renders_image_path_owner_prefix
  check (
    image_storage_path is null
    or image_storage_path ~ ('^' || household_id || '/' || profile_id || '/avatar-render-[^/]+\.(jpg|jpeg|png|webp)$')
  ) not valid;

alter table public.upload_batches enable row level security;
alter table public.source_images enable row level security;
alter table public.prettify_jobs enable row level security;
alter table public.garment_candidates enable row level security;
alter table public.detected_garments enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.generated_garment_cache enable row level security;
alter table public.avatar_profiles enable row level security;
alter table public.avatar_renders enable row level security;

drop policy if exists "Circle members can read upload batches" on public.upload_batches;
create policy "Circle members can read upload batches"
on public.upload_batches
for select
using (public.is_circle_member(household_id));

drop policy if exists "Circle members can read source images" on public.source_images;
create policy "Circle members can read source images"
on public.source_images
for select
using (public.is_circle_member(household_id));

drop policy if exists "Circle members can read prettify jobs" on public.prettify_jobs;
create policy "Circle members can read prettify jobs"
on public.prettify_jobs
for select
using (public.is_circle_member(household_id));

drop policy if exists "Circle members can read garment candidates" on public.garment_candidates;
create policy "Circle members can read garment candidates"
on public.garment_candidates
for select
using (public.is_circle_member(household_id));

drop policy if exists "Circle members can read detected garments" on public.detected_garments;
create policy "Circle members can read detected garments"
on public.detected_garments
for select
using (public.is_circle_member(household_id));

drop policy if exists "Circle members can read wardrobe items" on public.wardrobe_items;
create policy "Circle members can read wardrobe items"
on public.wardrobe_items
for select
using (public.is_circle_member(household_id));

drop policy if exists "Circle members can read generated garment cache" on public.generated_garment_cache;
create policy "Circle members can read generated garment cache"
on public.generated_garment_cache
for select
using (public.is_circle_member(household_id));

drop policy if exists "Circle members can read avatar profiles" on public.avatar_profiles;
create policy "Circle members can read avatar profiles"
on public.avatar_profiles
for select
using (public.is_circle_member(household_id));

drop policy if exists "Circle members can read avatar renders" on public.avatar_renders;
create policy "Circle members can read avatar renders"
on public.avatar_renders
for select
using (public.is_circle_member(household_id));
