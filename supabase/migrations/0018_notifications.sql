-- =====================================================================
-- Migracija 0018: Notifikacije u aplikaciji (zvono)
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.
-- =====================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade, -- primalac
  type       text not null default 'generic',   -- 'invite' | 'generic' | ...
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb, -- npr. { token, household_id }
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user
  on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

-- Korisnik vidi/mijenja/briše SAMO svoje notifikacije.
-- Notifikacije za DRUGE korisnike kreira server preko admin klijenta (zaobilazi RLS).
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- Realtime (zvono se osvježava uživo).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
