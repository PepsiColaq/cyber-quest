-- Если вход в админку падает с ошибкой про crypt — выполни в SQL Editor один раз.

create extension if not exists pgcrypto with schema extensions;

alter function public.admin_api(text, text, text)
  set search_path = public, extensions;

-- На всякий случай перезапишем пароль по умолчанию
insert into public.admin_secrets (id, password_hash)
values (1, extensions.crypt('cyberquest-admin', extensions.gen_salt('bf')))
on conflict (id) do update
set password_hash = excluded.password_hash;
