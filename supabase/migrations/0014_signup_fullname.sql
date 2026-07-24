-- =====================================================================
-- Home OS — Migracija 0014: koristi ime i prezime iz registracije za profil
-- =====================================================================
-- Ažurira handle_new_user da display_name uzme iz metapodataka (full_name),
-- a ako ga nema, koristi dio emaila. Pokreni u Supabase SQL Editor. Idempotentno.

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare new_hh uuid;
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

  insert into public.households (name, created_by)
  values ('Moje domaćinstvo', new.id)
  returning id into new_hh;

  insert into public.household_members (household_id, user_id, role)
  values (new_hh, new.id, 'owner');

  return new;
end;
$$;
