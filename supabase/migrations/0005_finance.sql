-- =====================================================================
-- Home OS — Migracija 0005: Finance (transakcije, računi, budžeti)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

-- Transakcije: troškovi i prihodi.
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind         text not null check (kind in ('expense','income')),
  amount       numeric(12,2) not null check (amount >= 0),
  category     text,
  description  text,
  occurred_on  date not null default current_date,
  paid_by      uuid references public.profiles(id) on delete set null,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_tx_household on public.transactions(household_id);
create index if not exists idx_tx_date on public.transactions(occurred_on);

-- Računi / pretplate s rokom dospijeća.
create table if not exists public.bills (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  amount       numeric(12,2) not null check (amount >= 0),
  due_date     date not null,
  recurrence   text not null default 'monthly' check (recurrence in ('none','monthly','yearly')),
  category     text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_bills_household on public.bills(household_id);

-- Budžeti po kategoriji (mjesečni limit).
create table if not exists public.budgets (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  category      text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (household_id, category)
);

-- RLS (isti obrazac za sve tri).
alter table public.transactions enable row level security;
alter table public.bills        enable row level security;
alter table public.budgets      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['transactions','bills','budgets'] loop
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
