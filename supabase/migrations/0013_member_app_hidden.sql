-- =====================================================================
-- Home OS — Migracija 0013: Dozvole po članu (sakrivanje aplikacija po članu)
-- =====================================================================
-- Vlasnik (owner) domaćinstva može sakriti pojedine aplikacije određenom članu.
-- Efektivno skriveno = (household deinstalirano) ILI (skriveno baš tom članu).
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

create table if not exists public.member_app_hidden (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  slug         text not null,
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id, slug)
);

alter table public.member_app_hidden enable row level security;

-- Vidi: vlasnik domaćinstva (za upravljanje) ili sam član (za svoj meni).
drop policy if exists "mah_select" on public.member_app_hidden;
create policy "mah_select" on public.member_app_hidden for select to authenticated
  using (user_id = auth.uid() or public.is_owner_of(household_id));

-- Mijenja samo vlasnik domaćinstva.
drop policy if exists "mah_insert" on public.member_app_hidden;
create policy "mah_insert" on public.member_app_hidden for insert to authenticated
  with check (public.is_owner_of(household_id));

drop policy if exists "mah_delete" on public.member_app_hidden;
create policy "mah_delete" on public.member_app_hidden for delete to authenticated
  using (public.is_owner_of(household_id));
