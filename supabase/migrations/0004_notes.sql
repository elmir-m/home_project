-- =====================================================================
-- Home OS — Migracija 0004: Notes (bilješke) + generička veza (links)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

-- Bilješke. kind = 'note' (obična) ili 'journal' (dnevnik).
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind         text not null default 'note' check (kind in ('note','journal')),
  title        text,
  body         text,
  tags         text[] not null default '{}',
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_notes_household on public.notes(household_id);

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- Generička veza između bilo koja dva objekta ("connected web").
-- Npr. note -> task, note -> event. Osnova za buduće module i proširivost.
create table if not exists public.links (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  source_type  text not null,
  source_id    uuid not null,
  target_type  text not null,
  target_id    uuid not null,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (source_type, source_id, target_type, target_id)
);
create index if not exists idx_links_source on public.links(source_type, source_id);
create index if not exists idx_links_target on public.links(target_type, target_id);

-- RLS
alter table public.notes enable row level security;
alter table public.links enable row level security;

drop policy if exists "notes_select" on public.notes;
create policy "notes_select" on public.notes for select to authenticated
  using (household_id in (select public.my_household_ids()));
drop policy if exists "notes_insert" on public.notes;
create policy "notes_insert" on public.notes for insert to authenticated
  with check (household_id in (select public.my_household_ids()) and created_by = auth.uid());
drop policy if exists "notes_update" on public.notes;
create policy "notes_update" on public.notes for update to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));
drop policy if exists "notes_delete" on public.notes;
create policy "notes_delete" on public.notes for delete to authenticated
  using (household_id in (select public.my_household_ids()));

drop policy if exists "links_select" on public.links;
create policy "links_select" on public.links for select to authenticated
  using (household_id in (select public.my_household_ids()));
drop policy if exists "links_insert" on public.links;
create policy "links_insert" on public.links for insert to authenticated
  with check (household_id in (select public.my_household_ids()) and created_by = auth.uid());
drop policy if exists "links_delete" on public.links;
create policy "links_delete" on public.links for delete to authenticated
  using (household_id in (select public.my_household_ids()));
