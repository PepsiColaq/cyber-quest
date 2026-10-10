-- Чтобы статус в админке менялся (hub → playing) и heartbeat не «зависал».
-- SQL Editor → Run один раз.

create or replace function public.player_touch(
  p_id uuid,
  p_status text default null,
  p_game text default null,
  p_score integer default null,
  p_clear_game boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sessions
  set
    last_seen = now(),
    status = coalesce(nullif(p_status, ''), status),
    current_game = case
      when p_clear_game then null
      when p_game is not null then p_game
      else current_game
    end,
    total_score = coalesce(p_score, total_score)
  where id = p_id;
end;
$$;

grant execute on function public.player_touch(uuid, text, text, integer, boolean) to anon, authenticated;

-- на всякий случай права UPDATE (если RPC недоступен — запасной путь)
grant select, insert, update on table public.sessions to anon, authenticated;
