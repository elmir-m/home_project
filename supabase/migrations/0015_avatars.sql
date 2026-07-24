-- =====================================================================
-- Home OS — Migracija 0015: Profilna slika (avatar)
-- =====================================================================
-- Dodaje avatar_url u profiles + javni storage bucket "avatars" s politikama.
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

alter table public.profiles add column if not exists avatar_url text;

-- Javni bucket za avatare.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Politike na storage.objects za bucket 'avatars'.
-- Čitanje je javno (za prikaz), a upload/izmjena/brisanje samo svoje datoteke
-- (putanja počinje s <user_id>/...).
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
