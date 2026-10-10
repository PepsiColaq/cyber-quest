# Настройка Supabase (один раз)

## 1. Создай проект

1. Зайди на https://supabase.com → New project  
2. Запомни регион, задай пароль БД.

## 2. SQL

В **SQL Editor** вставь и выполни файл [`schema.sql`](schema.sql).

## 3. Ключи

**Project Settings → API:**

- `Project URL` → в `js/cloud-config.js` как `url`
- `anon public` → в `js/cloud-config.js` как `anonKey`

Скопируй из [`js/cloud-config.example.js`](../js/cloud-config.example.js) в `js/cloud-config.js` и подставь значения.

`service_role` **никогда** не клади в git / фронт.

## 4. Edge Function (админка)

Установи [Supabase CLI](https://supabase.com/docs/guides/cli), залогинься, привяжи проект:

```bash
supabase login
supabase link --project-ref <твой_ref>
supabase secrets set ADMIN_PASSWORD="придумай_сложный_пароль"
supabase functions deploy admin-api --no-verify-jwt
```

URL функции будет вида:

`https://<ref>.supabase.co/functions/v1/admin-api`

Его тоже пропиши в `js/cloud-config.js` → `adminFn`.

## 5. Проверка

1. Открой игру онлайн → введи ник → сыграй одну миссию.  
2. Открой `/admin/` → пароль из `ADMIN_PASSWORD` → должны появиться live/журнал.
