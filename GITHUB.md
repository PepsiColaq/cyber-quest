# Публикация на GitHub Pages

Репозиторий уже создан: https://github.com/PepsiColaq/cyber-quest  
Локальный git готов (`main`, коммит есть). Если `git push` с этой машины рвёт соединение — выполни у себя в терминале:

```bash
cd D:\чистилка\dod-cyber-quest
git push -u origin main
```

## Включить Pages

1. Открой https://github.com/PepsiColaq/cyber-quest/settings/pages  
2. **Source:** Deploy from a branch  
3. Branch: `main` / folder: `/ (root)` → Save  

Через 1–2 минуты:

- Игра: https://PepsiColaq.github.io/cyber-quest/  
- Админка: https://PepsiColaq.github.io/cyber-quest/admin/

Или через CLI после успешного push:

```bash
gh api -X POST repos/PepsiColaq/cyber-quest/pages -f build_type=legacy -f source[branch]=main -f source[path]=/
```

## После Pages — облако

См. [`supabase/SETUP.md`](supabase/SETUP.md), затем включи `js/cloud-config.js` (`enabled: true`) и закоммить/запушь снова.
