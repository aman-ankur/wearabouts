alter table public.upload_batches
  add column if not exists extraction_mode text not null default 'pick_after_scan',
  add column if not exists skip_existing_items boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'upload_batches_extraction_mode_check'
  ) then
    alter table public.upload_batches
      add constraint upload_batches_extraction_mode_check
      check (extraction_mode in ('single_item', 'pick_after_scan', 'new_tops', 'new_bottoms', 'core_outfit'));
  end if;
end;
$$;

alter table public.garment_candidates
  add column if not exists selection_status text not null default 'primary',
  add column if not exists selection_reason text not null default '',
  add column if not exists duplicate_hint boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'garment_candidates_selection_status_check'
  ) then
    alter table public.garment_candidates
      add constraint garment_candidates_selection_status_check
      check (selection_status in ('primary', 'optional', 'skipped_existing', 'not_recommended', 'selected'));
  end if;
end;
$$;
