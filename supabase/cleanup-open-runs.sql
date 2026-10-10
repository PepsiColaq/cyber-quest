-- Почистить старые «висящие» миссии без финиша (те самые «в игре…»).
-- SQL Editor → Run один раз (по желанию).

delete from public.game_runs
where finished_at is null
  and duration_ms is null;
