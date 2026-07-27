-- =====================================================================
-- Migracija 0020: Jezik korisnika (lokalizacija bs/en)
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.
-- =====================================================================

alter table public.profiles
  add column if not exists locale text not null default 'bs'
    check (locale in ('bs', 'en'));
