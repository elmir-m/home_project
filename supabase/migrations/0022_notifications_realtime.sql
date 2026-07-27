-- =====================================================================
-- Migracija 0022: Realtime za notifikacije (zvono uživo)
-- Chat radi uživo, a notifikacije ne — tabela `notifications` nije bila
-- (u potpunosti) u supabase_realtime publikaciji na živoj bazi. Ovo to
-- garantovano ispravlja i dodaje REPLICA IDENTITY FULL da i UPDATE
-- (označi pročitano) i DELETE (ukloni) stižu uživo na sve uređaje/tabove.
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.
-- =====================================================================

-- Puni stari red u WAL-u (potrebno za UPDATE/DELETE realtime + RLS filter).
alter table public.notifications replica identity full;

-- Osiguraj članstvo u publikaciji (ADD baca grešku ako već postoji -> guard).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Provjera (opciono, pogledaj rezultat): treba vratiti 1 red.
-- select * from pg_publication_tables
-- where pubname='supabase_realtime' and tablename='notifications';
