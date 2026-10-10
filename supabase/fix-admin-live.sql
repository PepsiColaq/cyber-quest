-- Расширить «Сейчас играют» до 3 минут (вместо 45 секунд).
-- Выполни, если уже накатывал schema.sql раньше.

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
      where last_seen >= now() - interval '3 minutes'
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
    -- сводка по attempts; если пусто — по завершённым миссиям
    select count(*), coalesce(avg(score), 0), coalesce(max(score), 0),
           count(distinct lower(nick))
      into total, avg_score, best, uniq
    from public.attempts
    where finished_at >= from_ts and finished_at < to_ts;

    if coalesce(total, 0) = 0 then
      select count(*), coalesce(avg(score), 0), coalesce(max(score), 0),
             count(distinct lower(nick))
        into total, avg_score, best, uniq
      from public.game_runs
      where started_at >= from_ts and started_at < to_ts
        and finished_at is not null;
    end if;

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
