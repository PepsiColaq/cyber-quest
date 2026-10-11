-- Опционально: отсечь нереальные очки на стороне БД (после клиентского Guard).
-- Запусти в SQL Editor Supabase, если хочешь жёсткий потолок.

alter table public.game_runs
  drop constraint if exists game_runs_score_cap;
alter table public.game_runs
  add constraint game_runs_score_cap check (score >= 0 and score <= 1000);

alter table public.attempts
  drop constraint if exists attempts_score_cap;
alter table public.attempts
  add constraint attempts_score_cap check (score >= 0 and score <= 6000);

alter table public.sessions
  drop constraint if exists sessions_score_cap;
alter table public.sessions
  add constraint sessions_score_cap check (total_score >= 0 and total_score <= 6000);
