-- =====================================================================
-- Home OS — Migracija 0007: Invitations (pozivanje članova u domaćinstvo)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

create table if not exists public.invitations (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email        text not null,
  token        text not null unique,
  invited_by   uuid references public.profiles(id) on delete set null,
  status       text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at   timestamptz not null default now()
);
create index if not exists idx_invitations_household on public.invitations(household_id);
create index if not exists idx_invitations_token on public.invitations(token);

alter table public.invitations enable row level security;

-- Članovi domaćinstva vide i upravljaju svojim pozivnicama.
-- (Prihvatanje pozivnice ide preko admin klijenta na serveru, pa mu RLS ne smeta.)
drop policy if exists "invitations_select" on public.invitations;
create policy "invitations_select" on public.invitations for select to authenticated
  using (household_id in (select public.my_household_ids()));
drop policy if exists "invitations_insert" on public.invitations;
create policy "invitations_insert" on public.invitations for insert to authenticated
  with check (household_id in (select public.my_household_ids()) and invited_by = auth.uid());
drop policy if exists "invitations_update" on public.invitations;
create policy "invitations_update" on public.invitations for update to authenticated
  using (household_id in (select public.my_household_ids()));
drop policy if exists "invitations_delete" on public.invitations;
create policy "invitations_delete" on public.invitations for delete to authenticated
  using (household_id in (select public.my_household_ids()));
