-- КиберКвест · схема Supabase
-- Выполнить в SQL Editor проекта Supabase (один раз).
-- После выполнения смени пароль админки (см. ниже).

create extension if not exists pgcrypto with schema extensions;

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

-- ---------- admin password (хэш, не plaintext) ----------
create table if not exists public.admin_secrets (
  id int primary key default 1 check (id = 1),
  password_hash text not null
);

-- Пароль по умолчанию: cyberquest-admin (СМЕНИ сразу после установки!)
insert into public.admin_secrets (id, password_hash)
values (1, extensions.crypt('cyberquest-admin', extensions.gen_salt('bf')))
on conflict (id) do nothing;

-- Сменить пароль позже:
-- update public.admin_secrets set password_hash = extensions.crypt('НОВЫЙ_ПАРОЛЬ', extensions.gen_salt('bf')) where id = 1;

-- ---------- RLS ----------
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.game_runs enable row level security;
alter table public.admin_secrets enable row level security;

-- Анонимный клиент игры: insert/update. SELECT/DELETE — через RPC админки.
drop policy if exists sessions_insert_anon on public.sessions;
create policy sessions_insert_anon on public.sessions
  for insert to anon with check (true);

drop policy if exists sessions_update_anon on public.sessions;
create policy sessions_update_anon on public.sessions
  for update to anon using (true) with check (true);

drop policy if exists attempts_insert_anon on public.attempts;
create policy attempts_insert_anon on public.attempts
  for insert to anon with check (true);

drop policy if exists game_runs_insert_anon on public.game_runs;
create policy game_runs_insert_anon on public.game_runs
  for insert to anon with check (true);

drop policy if exists game_runs_update_anon on public.game_runs;
create policy game_runs_update_anon on public.game_runs
  for update to anon using (true) with check (true);

-- admin_secrets: нет политик для anon → читать нельзя напрямую

-- ---------- RPC админки (без Edge Function / CLI) ----------
create or replace function public.admin_api(
  p_password text,
  p_action text,
  p_day text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ok boolean;
  d date;
  from_ts timestamptz;
  to_ts timestamptz;
  result jsonb;
  total int;
  avg_score numeric;
  best int;
  uniq int;
begin
  select (password_hash = extensions.crypt(p_password, password_hash)) into ok
  from public.admin_secrets where id = 1;

  if coalesce(ok, false) is not true then
    return jsonb_build_object('error', 'unauthorized');
  end if;

  d := coalesce(nullif(p_day, '')::date, (now() at time zone 'utc')::date);
  from_ts := d::timestamptz;
  to_ts := (d + 1)::timestamptz;

  if p_action = 'login' then
    return jsonb_build_object('ok', true);
  end if;

  if p_action = 'live' then
    select coalesce(jsonb_agg(to_jsonb(s) order by s.last_seen desc), '[]'::jsonb)
      into result
    from (
      select * from public.sessions
      where last_seen >= now() - interval '45 seconds'
        and status <> 'left'
      order by last_seen desc
      limit 200
    ) s;
    return jsonb_build_object('sessions', result);
  end if;

  if p_action = 'journal' then
    return jsonb_build_object(
      'day', d::text,
      'attempts', coalesce((
        select jsonb_agg(to_jsonb(a) order by a.finished_at desc)
        from (
          select * from public.attempts
          where finished_at >= from_ts and finished_at < to_ts
          order by finished_at desc limit 500
        ) a
      ), '[]'::jsonb),
      'runs', coalesce((
        select jsonb_agg(to_jsonb(r) order by r.started_at desc)
        from (
          select * from public.game_runs
          where started_at >= from_ts and started_at < to_ts
          order by started_at desc limit 2000
        ) r
      ), '[]'::jsonb)
    );
  end if;

  if p_action = 'summary' then
    select count(*), coalesce(avg(score), 0), coalesce(max(score), 0),
           count(distinct lower(nick))
      into total, avg_score, best, uniq
    from public.attempts
    where finished_at >= from_ts and finished_at < to_ts;

    return jsonb_build_object(
      'day', d::text,
      'total', total,
      'avg', round(avg_score)::int,
      'best', best,
      'uniquePlayers', uniq,
      'gameCount', coalesce((
        select jsonb_object_agg(g, cnt)
        from (
          select unnest(games) as g, count(*)::int as cnt
          from public.attempts
          where finished_at >= from_ts and finished_at < to_ts
          group by 1
        ) t
      ), '{}'::jsonb)
    );
  end if;

  if p_action = 'csv' then
    return jsonb_build_object(
      'day', d::text,
      'csv', (
        select coalesce(
          E'\uFEFF' || 'time;nick;score;rank;games;details' || E'\n' ||
          string_agg(
            coalesce(finished_at::text, '') || ';' ||
            coalesce(replace(nick, ';', ','), '') || ';' ||
            coalesce(score::text, '') || ';' ||
            coalesce(replace(rank, ';', ','), '') || ';' ||
            coalesce(array_to_string(games, '|'), '') || ';' ||
            coalesce(replace(details::text, ';', ','), ''),
            E'\n'
            order by finished_at desc
          ),
          E'\uFEFF' || 'time;nick;score;rank;games;details'
        )
        from public.attempts
        where finished_at >= from_ts and finished_at < to_ts
      )
    );
  end if;

  if p_action = 'reset_day' then
    delete from public.game_runs where started_at >= from_ts and started_at < to_ts;
    delete from public.attempts where finished_at >= from_ts and finished_at < to_ts;
    delete from public.sessions where started_at >= from_ts and started_at < to_ts;
    return jsonb_build_object('ok', true, 'day', d::text);
  end if;

  return jsonb_build_object('error', 'unknown_action');
end;
$$;

grant execute on function public.admin_api(text, text, text) to anon, authenticated;
