-- =====================================================================
-- Home OS — Migracija 0006: Reminders (podsjetnici)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

create table if not exists public.reminders (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  title          text not null,
  remind_at      timestamptz not null,
  recurrence     text not null default 'none'
                 check (recurrence in ('none','daily','weekly','monthly','yearly')),
  target_user_id uuid references public.profiles(id) on delete set null, -- null = cijelo domaćinstvo
  source_type    text,   -- npr. 'bill','task','event','manual' (povezanost)
  source_id      uuid,
  status         text not null default 'pending' check (status in ('pending','done')),
  notify_email   boolean not null default true,
  last_fired_at  timestamptz,      -- popunjava cron kad pošalje email
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_reminders_household on public.reminders(household_id);
create index if not exists idx_reminders_due on public.reminders(remind_at) where status = 'pending';

alter table public.reminders enable row level security;

drop policy if exists "reminders_select" on public.reminders;
create policy "reminders_select" on public.reminders for select to authenticated
  using (household_id in (select public.my_household_ids()));
drop policy if exists "reminders_insert" on public.reminders;
create policy "reminders_insert" on public.reminders for insert to authenticated
  with check (household_id in (select public.my_household_ids()) and created_by = auth.uid());
drop policy if exists "reminders_update" on public.reminders;
create policy "reminders_update" on public.reminders for update to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));
drop policy if exists "reminders_delete" on public.reminders;
create policy "reminders_delete" on public.reminders for delete to authenticated
  using (household_id in (select public.my_household_ids()));
