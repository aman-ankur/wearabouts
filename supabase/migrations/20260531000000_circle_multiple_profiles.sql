alter table public.wardrobe_profiles
  drop constraint if exists wardrobe_profiles_circle_id_owner_user_id_profile_type_key;

create index if not exists wardrobe_profiles_owner_idx
  on public.wardrobe_profiles (circle_id, owner_user_id, created_at);
