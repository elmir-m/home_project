-- =====================================================================
-- Migracija 0021: Prava izmjene — autor ili vlasnik domaćinstva
-- Pokreni u Supabase: SQL Editor -> New query -> Run. Idempotentno.
-- =====================================================================
-- Pravilo: stavku može uređivati/brisati SAMO njen autor (created_by),
-- ILI vlasnik ('owner') domaćinstva kojem stavka pripada. Članovi mogu
-- mijenjati samo ono što su sami dodali; vlasnik ima puno pravo nad
-- cijelim domaćinstvom. Pregled (SELECT) i dodavanje (INSERT) ostaju
-- nepromijenjeni (cijelo domaćinstvo vidi i svako dodaje u svoje ime).

do $$
declare
  rec text[];
  -- (tabela, prefiks_politike)
  tables text[][] := array[
    ['tasks','tasks'],
    ['calendar_events','events'],
    ['notes','notes'],
    ['links','links'],
    ['transactions','transactions'],
    ['bills','bills'],
    ['budgets','budgets'],
    ['reminders','reminders'],
    ['records','records'],
    ['contacts','contacts'],
    ['lists','lists'],
    ['list_items','list_items'],
    ['shopping_items','shopping']
  ];
  tbl text;
  pfx text;
  cond text;
begin
  foreach rec slice 1 in array tables loop
    tbl := rec[1];
    pfx := rec[2];
    -- Preskoči tabele koje (još) ne postoje.
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;
    cond := format(
      '(created_by = auth.uid() or public.is_owner_of(household_id))'
    );

    execute format('drop policy if exists "%s_update" on public.%s', pfx, tbl);
    execute format(
      'create policy "%s_update" on public.%s for update to authenticated using %s with check %s',
      pfx, tbl, cond, cond
    );

    execute format('drop policy if exists "%s_delete" on public.%s', pfx, tbl);
    execute format(
      'create policy "%s_delete" on public.%s for delete to authenticated using %s',
      pfx, tbl, cond
    );
  end loop;
end $$;
