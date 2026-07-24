-- =====================================================================
-- Home OS — Migracija 0011: Realtime (promjene uživo kod svih članova)
-- =====================================================================
-- Dodaje tabele u supabase_realtime publikaciju da klijent prima izmjene.
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

do $$
declare
  t text;
  tables text[] := array[
    'tasks','calendar_events','transactions','bills','notes','reminders',
    'lists','list_items','records','contacts','app_events','household_members'
  ];
begin
  foreach t in array tables loop
    -- preskoči tabele koje ne postoje (npr. ako neka migracija nije pokrenuta)
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
