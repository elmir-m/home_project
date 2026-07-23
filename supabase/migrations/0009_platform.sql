-- =====================================================================
-- Home OS — Migracija 0009: Platforma (event bus, automatizacije, registar app-ova)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

-- Event bus: aplikacije objavljuju "šta se desilo".
create table if not exists public.app_events (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type         text not null,               -- npr. 'task.completed'
  payload      jsonb not null default '{}',
  actor        uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_app_events_household on public.app_events(household_id, created_at desc);

-- Automatizacije: "kad se desi trigger -> izvrši akciju".
create table if not exists public.automations (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  trigger_type  text not null,              -- event type iz app_events
  action_type   text not null,              -- 'create_reminder' | 'create_task' | 'send_email'
  config        jsonb not null default '{}',
  enabled       boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_automations_trigger on public.automations(household_id, trigger_type) where enabled;

-- Registar: koje su aplikacije "instalirane" u domaćinstvu.
create table if not exists public.app_installs (
  household_id uuid not null references public.households(id) on delete cascade,
  slug         text not null,
  enabled      boolean not null default true,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  primary key (household_id, slug)
);

-- RLS (isti obrazac).
alter table public.app_events enable row level security;
alter table public.automations enable row level security;
alter table public.app_installs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['app_events','automations','app_installs'] loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format('create policy "%1$s_select" on public.%1$s for select to authenticated using (household_id in (select public.my_household_ids()))', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format('create policy "%1$s_insert" on public.%1$s for insert to authenticated with check (household_id in (select public.my_household_ids()))', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format('create policy "%1$s_update" on public.%1$s for update to authenticated using (household_id in (select public.my_household_ids())) with check (household_id in (select public.my_household_ids()))', t);
    execute format('drop policy if exists "%1$s_delete" on public.%1$s', t);
    execute format('create policy "%1$s_delete" on public.%1$s for delete to authenticated using (household_id in (select public.my_household_ids()))', t);
  end loop;
end $$;
