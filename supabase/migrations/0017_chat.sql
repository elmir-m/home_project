-- =====================================================================
-- Migracija 0017: Chat (poruke među članovima domaćinstva)
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.
-- =====================================================================

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete set null,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_messages_household
  on public.messages(household_id, created_at);

alter table public.messages enable row level security;

-- Vidiš poruke svog domaćinstva; šalješ samo u svoje ime i u svoje domaćinstvo;
-- brišeš/uređuješ samo svoje.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select to authenticated
  using (household_id in (select public.my_household_ids()));

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert to authenticated
  with check (household_id in (select public.my_household_ids()) and user_id = auth.uid());

drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete" on public.messages for delete to authenticated
  using (user_id = auth.uid());

-- Realtime (poruke stižu uživo, kao i ostali moduli).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
