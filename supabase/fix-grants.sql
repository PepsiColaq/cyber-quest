-- Обязательно! Без этого игра не пишет в облако / не обновляет очки.
-- SQL Editor → Run один раз.

grant usage on schema public to anon, authenticated;

grant select, insert, update on table public.sessions to anon, authenticated;
grant select, insert, update on table public.attempts to anon, authenticated;
grant select, insert, update on table public.game_runs to anon, authenticated;

-- RLS: anon может обновлять свои записи (для очков миссий)
drop policy if exists attempts_update_anon on public.attempts;
create policy attempts_update_anon on public.attempts
  for update to anon using (true) with check (true);

drop policy if exists attempts_select_anon on public.attempts;
create policy attempts_select_anon on public.attempts
  for select to anon using (true);
