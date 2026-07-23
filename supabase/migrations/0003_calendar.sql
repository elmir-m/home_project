-- =====================================================================
-- Home OS — Migracija 0003: Calendar events (događaji)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

create table if not exists public.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title        text not null,
  description  text,
  event_date   date not null,
  start_time   time,
  end_time     time,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_events_household on public.calendar_events(household_id);
create index if not exists idx_events_date on public.calendar_events(event_date);

alter table public.calendar_events enable row level security;

drop policy if exists "events_select" on public.calendar_events;
create policy "events_select" on public.calendar_events for select to authenticated
  using (household_id in (select public.my_household_ids()));

drop policy if exists "events_insert" on public.calendar_events;
create policy "events_insert" on public.calendar_events for insert to authenticated
  with check (household_id in (select public.my_household_ids()) and created_by = auth.uid());

drop policy if exists "events_update" on public.calendar_events;
create policy "events_update" on public.calendar_events for update to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));

drop policy if exists "events_delete" on public.calendar_events;
create policy "events_delete" on public.calendar_events for delete to authenticated
  using (household_id in (select public.my_household_ids()));
