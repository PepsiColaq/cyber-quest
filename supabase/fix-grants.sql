-- Обязательно! Без этого игра не пишет в облако, админка пустая.
-- SQL Editor → Run один раз.

grant usage on schema public to anon, authenticated;

grant select, insert, update on table public.sessions to anon, authenticated;
grant insert on table public.attempts to anon, authenticated;
grant select, insert, update on table public.game_runs to anon, authenticated;

-- admin_secrets anon не даём — только через RPC admin_api
