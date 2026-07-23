-- =====================================================================
-- Home OS — Migracija 0001: temelj (profiles, households, membership, RLS)
-- =====================================================================
-- Pokreni ovo u Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Idempotentno je (može se pokrenuti više puta bez greške).

-- ---------------------------------------------------------------------
-- 1) TABELE
-- ---------------------------------------------------------------------

-- Profil korisnika (ogledalo auth.users, zbog joinova i prikaza imena).
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Domaćinstvo.
create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Moje domaćinstvo',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Članstvo: koji korisnik pripada kojem domaćinstvu i s kojom ulogom.
create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner','member')),
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists idx_household_members_user on public.household_members(user_id);

-- ---------------------------------------------------------------------
-- 2) POMOĆNE FUNKCIJE (security definer -> ne ulaze u RLS rekurziju)
-- ---------------------------------------------------------------------

-- Domaćinstva kojima trenutni korisnik pripada.
create or replace function public.my_household_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select household_id from public.household_members where user_id = auth.uid()
$$;

-- Svi korisnici koji dijele bar jedno domaćinstvo s trenutnim korisnikom.
create or replace function public.my_comember_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select distinct user_id from public.household_members
  where household_id in (
    select household_id from public.household_members where user_id = auth.uid()
  )
$$;

-- Da li je trenutni korisnik "owner" datog domaćinstva.
create or replace function public.is_owner_of(hh uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hh and user_id = auth.uid() and role = 'owner'
  )
$$;

-- ---------------------------------------------------------------------
-- 3) AUTO-PROVISIONING: novi korisnik -> profil + domaćinstvo + owner
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare new_hh uuid;
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into public.households (name, created_by)
  values ('Moje domaćinstvo', new.id)
  returning id into new_hh;

  insert into public.household_members (household_id, user_id, role)
  values (new_hh, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4) RLS
-- ---------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.households         enable row level security;
alter table public.household_members  enable row level security;

-- profiles: vidiš sebe i članove svojih domaćinstava; mijenjaš samo sebe.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or id in (select public.my_comember_ids()));

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- households: vidiš/mijenjaš svoja domaćinstva; kreiraš kao svoj.
drop policy if exists "households_select" on public.households;
create policy "households_select" on public.households for select to authenticated
  using (id in (select public.my_household_ids()));

drop policy if exists "households_insert" on public.households;
create policy "households_insert" on public.households for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "households_update" on public.households;
create policy "households_update" on public.households for update to authenticated
  using (id in (select public.my_household_ids()));

-- household_members: vidiš članove svojih domaćinstava; owner dodaje/briše.
drop policy if exists "members_select" on public.household_members;
create policy "members_select" on public.household_members for select to authenticated
  using (household_id in (select public.my_household_ids()));

drop policy if exists "members_insert" on public.household_members;
create policy "members_insert" on public.household_members for insert to authenticated
  with check (public.is_owner_of(household_id));

drop policy if exists "members_delete" on public.household_members;
create policy "members_delete" on public.household_members for delete to authenticated
  using (public.is_owner_of(household_id));

-- ---------------------------------------------------------------------
-- 5) BACKFILL: postojeći korisnici (napravljeni prije ovog triggera)
-- ---------------------------------------------------------------------

do $$
declare u record; hh uuid;
begin
  for u in select id, email from auth.users loop
    insert into public.profiles (id, email, display_name)
    values (u.id, u.email, split_part(u.email, '@', 1))
    on conflict (id) do nothing;

    if not exists (select 1 from public.household_members where user_id = u.id) then
      insert into public.households (name, created_by)
      values ('Moje domaćinstvo', u.id) returning id into hh;
      insert into public.household_members (household_id, user_id, role)
      values (hh, u.id, 'owner');
    end if;
  end loop;
end $$;
