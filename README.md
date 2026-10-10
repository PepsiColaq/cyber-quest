# КиберКвест — тренажёр для ДОД

Офлайн/онлайн веб-игра для Дня открытых дверей  
**Колледж им. Маршала В.И. Чуйкова**  
направление *Обеспечение информационной безопасности автоматизированных систем*.

Премиальный тёмный интерфейс, 11 мини-игр с банками заданий, таблица
лидеров, локальный журнал преподавателя и **облачная админка** (Supabase).

Личные данные не собираем — только игровой позывной.

## Запуск на стенде (офлайн)

1. Скопируйте папку на флешку или ПК аудитории.  
2. Запустите `Запуск.bat` или откройте `index.html`.  
3. Интернет не обязателен: без облака всё пишется в `localStorage` этого ПК.

> Локальный сервер для проверки: `node server.js` → http://127.0.0.1:5177

## Онлайн (GitHub Pages + Supabase)

Игра спокойно выдерживает **30–100 одновременных** вкладок на free GitHub Pages
(сайт статический и лёгкий). Общая статистика и live-сессии — через Supabase free.

### 1) Supabase

Пошагово: [`supabase/SETUP.md`](supabase/SETUP.md)

Кратко:

1. Создай проект на https://supabase.com  
2. Выполни SQL из [`supabase/schema.sql`](supabase/schema.sql)  
3. Задеплой Edge Function `admin-api`, задай secret `ADMIN_PASSWORD`  
4. Скопируй `js/cloud-config.example.js` → `js/cloud-config.js`, включи `enabled: true`, вставь `url`, `anonKey`, `adminFn`

### 2) GitHub Pages

```bash
cd dod-cyber-quest
git init
git add .
git commit -m "КиберКвест: игра + облачная админка"
gh auth login   # если токен протух
gh repo create cyber-quest --public --source=. --remote=origin --push
```

Затем: **Settings → Pages → Deploy from branch `main` / root (/**)`.

Ссылки после деплоя:

- Игра: `https://<user>.github.io/cyber-quest/`  
- Админка: `https://<user>.github.io/cyber-quest/admin/`

> Если репозиторий уже существует — просто `git push -u origin main`.

### 3) Админка преподавателя

- Отдельная страница `/admin/` (не в меню для абитуриентов).  
- Вход по паролю из Supabase Secret `ADMIN_PASSWORD` (не PIN из `config.js`).  
- Live: кто онлайн, на каком задании, очки, heartbeat.  
- Журнал дня, длительность миссий, CSV, сброс дня.  
- Локальный PIN-журнал в игре (долгое нажатие на лого / `Ctrl+Shift+T`) остаётся для стенда без интернета.

## Для абитуриента

- Лендинг → **Начать квест** → позывной → **Штаб** или **Быстрая смена**.  
- В каждой игре — мини-обучение.  
- **Назад** / `Esc` — выход в штаб.  
- Idle-сброс на лендинг ~2 мин на хабе; во время игры не сбрасывает.

## Контакты приёмной

- Тел.: 8 (495) 21 21 061  
- Почта: info@marshal-chuikov.ru  

Правки контента — `js/config.js`.

## Структура

```
index.html
admin/                 облачная админка преподавателя
supabase/
  schema.sql           таблицы + RLS
  functions/admin-api  Edge Function
  SETUP.md             инструкция
js/
  cloud-config.js      URL/ключи (enabled:false по умолчанию)
  cloud.js             клиент сессий / game_runs / attempts
  banks.js             банки заданий
  storage.js           localStorage fallback
  games/               11 мини-игр
assets/vendor/supabase.js
```
