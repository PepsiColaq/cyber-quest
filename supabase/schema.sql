-- КиберКвест · схема Supabase
-- Выполнить в SQL Editor проекта Supabase (один раз).

create extension if not exists "pgcrypto";

-- ---------- sessions (живые игроки) ----------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  nick text not null,
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  current_game text,
  status text not null default 'hub'
    check (status in ('nick', 'hub', 'playing', 'done', 'left')),
  total_score integer not null default 0
);

create index if not exists sessions_last_seen_idx on public.sessions (last_seen desc);
create index if not exists sessions_status_idx on public.sessions (status);

-- ---------- attempts (итоги сессии) ----------
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions (id) on delete set null,
  nick text not null,
  score integer not null default 0,
  rank text,
  finished_at timestamptz not null default now(),
  games text[] not null default '{}',
  details jsonb not null default '{}'::jsonb
);

create index if not exists attempts_finished_idx on public.attempts (finished_at desc);

-- ---------- game_runs (одна миссия) ----------
create table if not exists public.game_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions (id) on delete set null,
  nick text not null,
  game_id text not null,
  score integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  detail jsonb not null default '{}'::jsonb
);

create index if not exists game_runs_session_idx on public.game_runs (session_id);
create index if not exists game_runs_finished_idx on public.game_runs (finished_at desc);

-- ---------- RLS ----------
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.game_runs enable row level security;

-- Анонимный клиент игры: может создавать и обновлять свои строки.
-- Чтение всех строк — только через Edge Function (service role).

drop policy if exists sessions_insert_anon on public.sessions;
create policy sessions_insert_anon on public.sessions
  for insert to anon
  with check (true);

drop policy if exists sessions_update_anon on public.sessions;
create policy sessions_update_anon on public.sessions
  for update to anon
  using (true)
  with check (true);

drop policy if exists attempts_insert_anon on public.attempts;
create policy attempts_insert_anon on public.attempts
  for insert to anon
  with check (true);

drop policy if exists game_runs_insert_anon on public.game_runs;
create policy game_runs_insert_anon on public.game_runs
  for insert to anon
  with check (true);

drop policy if exists game_runs_update_anon on public.game_runs;
create policy game_runs_update_anon on public.game_runs
  for update to anon
  using (true)
  with check (true);

-- Нет SELECT/DELETE для anon — админка ходит через service role в Edge Function.
