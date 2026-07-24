-- =====================================================================
-- Home OS — Migracija 0010: Notification preferences (email postavke po članu)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

create table if not exists public.notification_prefs (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  email_reminders boolean not null default true,  -- podsjetnici
  email_tasks     boolean not null default true,  -- zadatak dodijeljen tebi
  email_bills     boolean not null default true,  -- račun uskoro dospijeva
  email_shared    boolean not null default true,  -- nešto podijeljeno s tobom
  digest          text    not null default 'none' check (digest in ('none','daily','weekly')),
  updated_at      timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

-- Svako vidi i mijenja samo svoje postavke.
drop policy if exists "np_select" on public.notification_prefs;
create policy "np_select" on public.notification_prefs for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "np_insert" on public.notification_prefs;
create policy "np_insert" on public.notification_prefs for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "np_update" on public.notification_prefs;
create policy "np_update" on public.notification_prefs for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
