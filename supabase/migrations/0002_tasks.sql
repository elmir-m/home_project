-- =====================================================================
-- Home OS — Migracija 0002: Tasks (zadaci)
-- =====================================================================
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title        text not null,
  notes        text,
  status       text not null default 'todo'    check (status in ('todo','doing','done')),
  priority     text not null default 'medium'  check (priority in ('low','medium','high')),
  due_date     date,
  assignee_id  uuid references public.profiles(id) on delete set null,
  created_by   uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_tasks_household on public.tasks(household_id);
create index if not exists idx_tasks_assignee  on public.tasks(assignee_id);

-- updated_at se osvježava automatski pri svakom UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- RLS: samo članovi domaćinstva vide i mijenjaju njegove zadatke.
alter table public.tasks enable row level security;

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks for select to authenticated
  using (household_id in (select public.my_household_ids()));

drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks for insert to authenticated
  with check (household_id in (select public.my_household_ids()) and created_by = auth.uid());

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks for update to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks for delete to authenticated
  using (household_id in (select public.my_household_ids()));
