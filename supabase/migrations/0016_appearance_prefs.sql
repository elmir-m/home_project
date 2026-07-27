-- =====================================================================
-- Migracija 0016: postavke izgleda po korisniku (veličina fonta, akcent)
-- Pokreni u Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Idempotentno je.
-- =====================================================================

alter table public.profiles
  add column if not exists font_size text not null default 'md'
    check (font_size in ('sm', 'md', 'lg'));

alter table public.profiles
  add column if not exists accent text not null default 'indigo'
    check (accent in ('indigo', 'blue', 'violet', 'emerald', 'teal', 'rose', 'amber'));

-- RLS: korisnik već smije mijenjati vlastiti profil (politika iz 0001),
-- pa nove kolone ne traže dodatna pravila.
