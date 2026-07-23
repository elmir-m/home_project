-- =====================================================================
-- Home OS — Migracija 0008: Life admin (evidencija, kontakti, liste)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

-- Evidencija: dokumenti, garancije, obnove (s rokom isteka).
create table if not exists public.records (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title        text not null,
  category     text not null default 'document'
               check (category in ('document','warranty','renewal','other')),
  expiry_date  date,
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_records_household on public.records(household_id);

-- Važni kontakti.
create table if not exists public.contacts (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  role         text,
  phone        text,
  email        text,
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_contacts_household on public.contacts(household_id);

-- Dijeljene liste (kupovina, kućni poslovi…).
create table if not exists public.lists (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_lists_household on public.lists(household_id);

create table if not exists public.list_items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  list_id      uuid not null references public.lists(id) on delete cascade,
  text         text not null,
  done         boolean not null default false,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_list_items_list on public.list_items(list_id);

-- RLS (isti obrazac keyan na my_household_ids()).
do $$
declare t text;
begin
  foreach t in array array['records','contacts','lists','list_items'] loop
    execute format('alter table public.%s enable row level security', t);
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format('create policy "%1$s_select" on public.%1$s for select to authenticated using (household_id in (select public.my_household_ids()))', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format('create policy "%1$s_insert" on public.%1$s for insert to authenticated with check (household_id in (select public.my_household_ids()) and created_by = auth.uid())', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format('create policy "%1$s_update" on public.%1$s for update to authenticated using (household_id in (select public.my_household_ids())) with check (household_id in (select public.my_household_ids()))', t);
    execute format('drop policy if exists "%1$s_delete" on public.%1$s', t);
    execute format('create policy "%1$s_delete" on public.%1$s for delete to authenticated using (household_id in (select public.my_household_ids()))', t);
  end loop;
end $$;
