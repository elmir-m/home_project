-- =====================================================================
-- Home OS — Migracija 0012: Shopping (Kupovina) — primjer NOVE aplikacije
-- =====================================================================
-- Nova aplikacija: svoja tabela, svoj RLS, ne dira nijedan postojeći modul.
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

create table if not exists public.shopping_items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  text         text not null,
  quantity     text,
  done         boolean not null default false,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_shopping_household on public.shopping_items(household_id);

alter table public.shopping_items enable row level security;

drop policy if exists "shopping_select" on public.shopping_items;
create policy "shopping_select" on public.shopping_items for select to authenticated
  using (household_id in (select public.my_household_ids()));
drop policy if exists "shopping_insert" on public.shopping_items;
create policy "shopping_insert" on public.shopping_items for insert to authenticated
  with check (household_id in (select public.my_household_ids()) and created_by = auth.uid());
drop policy if exists "shopping_update" on public.shopping_items;
create policy "shopping_update" on public.shopping_items for update to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));
drop policy if exists "shopping_delete" on public.shopping_items;
create policy "shopping_delete" on public.shopping_items for delete to authenticated
  using (household_id in (select public.my_household_ids()));

-- Realtime za novu tabelu (da promjene idu uživo, kao i ostali moduli).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='shopping_items'
  ) then
    alter publication supabase_realtime add table public.shopping_items;
  end if;
end $$;
