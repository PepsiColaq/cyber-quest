-- ============================================================
-- СРОЧНО: после harden пропали INSERT для игры.
-- Восстанавливает запись игрока, НЕ открывая дыры обратно.
-- Запусти в SQL Editor → Run.
--
-- Важно: SELECT на attempts/game_runs у anon нет — так и надо.
-- Клиент пишет с Prefer: return=minimal (без RETURNING).
-- ============================================================

-- Права на таблицы (без SELECT attempts / без UPDATE runs&attempts)
grant insert, update on table public.sessions to anon, authenticated;
grant select on table public.sessions to anon, authenticated;

grant insert on table public.attempts to anon, authenticated;
-- select/update attempts у anon НЕ даём (как в harden)

grant insert on table public.game_runs to anon, authenticated;
-- update/select game_runs у anon НЕ даём

-- Политики INSERT (игра)
drop policy if exists sessions_insert_anon on public.sessions;
create policy sessions_insert_anon on public.sessions
  for insert to anon, authenticated
  with check (
    char_length(nick) between 1 and 32
    and total_score >= 0 and total_score <= 8000
  );

-- UPDATE sessions нужен как запасной путь, если RPC недоступен
drop policy if exists sessions_update_anon on public.sessions;
create policy sessions_update_anon on public.sessions
  for update to anon, authenticated
  using (true)
  with check (
    char_length(nick) between 1 and 32
    and total_score >= 0 and total_score <= 8000
  );

drop policy if exists sessions_select_anon on public.sessions;
create policy sessions_select_anon on public.sessions
  for select to anon, authenticated
  using (true);

drop policy if exists attempts_insert_anon on public.attempts;
create policy attempts_insert_anon on public.attempts
  for insert to anon, authenticated
  with check (
    char_length(nick) between 1 and 32
    and score >= 0 and score <= 8000
  );

drop policy if exists game_runs_insert_anon on public.game_runs;
create policy game_runs_insert_anon on public.game_runs
  for insert to anon, authenticated
  with check (
    char_length(nick) between 1 and 32
    and score >= 0 and score <= 2000
  );

-- Явно держим закрытым то, что harden убрал
drop policy if exists attempts_select_anon on public.attempts;
drop policy if exists attempts_update_anon on public.attempts;
drop policy if exists game_runs_update_anon on public.game_runs;
drop policy if exists game_runs_select_anon on public.game_runs;

-- RPC heartbeat
grant execute on function public.player_touch(uuid, text, text, integer, boolean) to anon, authenticated;

-- admin_secrets по-прежнему закрыт
revoke all on table public.admin_secrets from anon, authenticated;
