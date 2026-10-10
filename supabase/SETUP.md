# Настройка Supabase (5 минут, без CLI)

GitHub Pages уже настроен:  
**Игра:** https://pepsicolaq.github.io/cyber-quest/  
**Админка:** https://pepsicolaq.github.io/cyber-quest/admin/

## 1. Создай бесплатный проект

1. Открой https://supabase.com/dashboard → **New project**  
2. Имя любое (например `cyber-quest`), регион ближайший, пароль БД запомни.

## 2. Выполни SQL

**SQL Editor → New query** → вставь весь файл [`schema.sql`](schema.sql) → **Run**.

Если админка пустая, а игроки уже ходят — выполни ещё [`fix-grants.sql`](fix-grants.sql) (права `anon` на таблицы).

Пароль админки по умолчанию: `cyberquest-admin`  
Сразу смени:

```sql
update public.admin_secrets
set password_hash = crypt('ТВОЙ_НАДЁЖНЫЙ_ПАРОЛЬ', gen_salt('bf'))
where id = 1;
```

## 3. Ключи API

**Project Settings → API Keys**

Нужны **два** значения (не secret!):

1. **Project URL** — сверху страницы, вида `https://abcdefgh.supabase.co`  
2. **Legacy anon key** — вкладка **«Legacy anon, service_role API keys»** → ключ `anon` `public`  
   (начинается с `eyJ...`)

Не бери:
- `sb_publishable_...` — новый формат, наша библиотека его плохо принимает  
- `sb_secret_...` / `service_role` — **никогда** в сайт, только на сервере  

Открой локально `js/cloud-config.js` и поставь:

```js
window.CloudConfig = {
  enabled: true,
  url: "https://XXXX.supabase.co",
  anonKey: "eyJ....",
  adminFn: "",          // можно пусто — админка идёт через RPC
  heartbeatMs: 9000,
};
```

Закоммить и запушь:

```bash
cd D:\чистилка\dod-cyber-quest
git add js/cloud-config.js
git commit -m "Включить облако Supabase"
git push
```

Через 1–2 минуты Pages обновится — игра начнёт писать в облако, админка откроется по паролю.

## 4. Проверка

1. Открой игру онлайн → ник → любая миссия.  
2. Открой `/admin/` → пароль → в «Сейчас играют» должен появиться ник.

## Edge Function (необязательно)

CLI нужен только если хочешь `adminFn` вместо RPC. Для ДОД достаточно шагов 1–3.
