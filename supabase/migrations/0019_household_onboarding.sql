-- =====================================================================
-- Migracija 0019: Onboarding domaćinstva
-- Novi korisnik VIŠE NE dobija automatski svoje domaćinstvo pri registraciji.
-- Sam bira: napraviti svoje ili sačekati pozivnicu.
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.
-- =====================================================================

-- 1) Trigger sada kreira SAMO profil (bez domaćinstva/članstva).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2) Funkcija za kreiranje domaćinstva na zahtjev (security definer -> bez RLS zavrzlama).
--    Kreira domaćinstvo + upisuje trenutnog korisnika kao vlasnika i vraća id.
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare new_hh uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.households (name, created_by)
  values (coalesce(nullif(trim(p_name), ''), 'Moje domaćinstvo'), auth.uid())
  returning id into new_hh;

  insert into public.household_members (household_id, user_id, role)
  values (new_hh, auth.uid(), 'owner');

  return new_hh;
end;
$$;

grant execute on function public.create_household(text) to authenticated;
