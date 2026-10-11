-- ============================================================
-- Защита САЙТА / БД от злоупотреблений через anon-ключ.
-- Урезает лишние права, но INSERT игры сохраняет.
-- Если облако перестало писать очки — выполни fix-restore-inserts.sql
-- ============================================================

-- 0) Гарантируем, что игра МОЖЕТ писать (insert)
grant insert, update, select on table public.sessions to anon, authenticated;
grant insert on table public.attempts to anon, authenticated;
grant insert on table public.game_runs to anon, authenticated;

drop policy if exists sessions_insert_anon on public.sessions;
create policy sessions_insert_anon on public.sessions
  for insert to anon, authenticated
  with check (char_length(nick) between 1 and 32);

drop policy if exists attempts_insert_anon on public.attempts;
create policy attempts_insert_anon on public.attempts
  for insert to anon, authenticated
  with check (char_length(nick) between 1 and 32 and score >= 0 and score <= 8000);

drop policy if exists game_runs_insert_anon on public.game_runs;
create policy game_runs_insert_anon on public.game_runs
  for insert to anon, authenticated
  with check (char_length(nick) between 1 and 32 and score >= 0 and score <= 2000);

-- 1) Аноним НЕ должен читать все попытки игроков
drop policy if exists attempts_select_anon on public.attempts;

-- 2) Аноним НЕ должен править чужие game_runs
drop policy if exists game_runs_update_anon on public.game_runs;

-- 3) UPDATE attempts у анона убираем (игра только INSERT)
drop policy if exists attempts_update_anon on public.attempts;

-- 4) sessions: прямой UPDATE анону лучше не давать —
--    heartbeat идёт через RPC player_touch (security definer).
--    Оставляем запасной UPDATE только если RPC ещё не накатан —
--    тогда НЕ удаляй sessions_update_anon, пока не выполнишь fix-player-touch.sql.
--    Если player_touch уже есть — раскомментируй две строки ниже:
-- drop policy if exists sessions_update_anon on public.sessions;

-- 5) admin_secrets: убедиться, что anon не читает хеш пароля
revoke all on table public.admin_secrets from anon, authenticated;
-- RPC admin_api работает как security definer — пароль проверяется там

-- 6) Базовые ограничения длины/мусора (защита от мусорных INSERT)
alter table public.sessions
  drop constraint if exists sessions_nick_len;
alter table public.sessions
  add constraint sessions_nick_len check (char_length(nick) between 1 and 32);

alter table public.attempts
  drop constraint if exists attempts_nick_len;
alter table public.attempts
  add constraint attempts_nick_len check (char_length(nick) between 1 and 32);

alter table public.game_runs
  drop constraint if exists game_runs_nick_len;
alter table public.game_runs
  add constraint game_runs_nick_len check (char_length(nick) between 1 and 32);

alter table public.game_runs
  drop constraint if exists game_runs_score_range;
alter table public.game_runs
  add constraint game_runs_score_range check (score >= 0 and score <= 2000);

alter table public.attempts
  drop constraint if exists attempts_score_range;
alter table public.attempts
  add constraint attempts_score_range check (score >= 0 and score <= 8000);

alter table public.sessions
  drop constraint if exists sessions_score_range;
alter table public.sessions
  add constraint sessions_score_range check (total_score >= 0 and total_score <= 8000);

-- 7) Смени пароль админки, если ещё дефолтный:
-- update public.admin_secrets
-- set password_hash = extensions.crypt('ТВОЙ_СИЛЬНЫЙ_ПАРОЛЬ', extensions.gen_salt('bf'))
-- where id = 1;
