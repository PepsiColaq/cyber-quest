/* ============================================================
   Guard — защита от накрутки очков и мусора в позывных.
   Клиентский стенд: полного «антихака» нет, но отсекаем
   нереальные значения из консоли / localStorage / облака.
   ============================================================ */
window.GameGuard = (function () {
  /** Потолки за одну миссию (с запасом выше честного максимума). */
  const MAX_GAME = Object.freeze({
    phishing: 720,
    passwords: 320,
    logs: 280,
    incident: 520,
    cipher: 400,
    network: 420,
    social: 480,
    detective: 360,
    patches: 900,
    firewall: 950,
    attackmap: 900,
  });
  const MAX_TOTAL = 5500;
  const MIN_MS_FOR_HIGH = 2500; // быстрее 2.5с и «жирный» скор — подозрительно

  function sanitizeNick(raw) {
    let s = String(raw || "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/[<>{}[\]\\\/`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (s.length > 14) s = s.slice(0, 14);
    // не даём «встроить» скрипты/протоколы
    if (/javascript:|data:|onerror=/i.test(s)) s = "";
    return s;
  }

  function clampGameScore(gameId, score, durationMs) {
    let n = Math.max(0, Math.round(Number(score) || 0));
    const cap = MAX_GAME[gameId] || 600;
    if (n > cap) n = cap;
    if (
      typeof durationMs === "number" &&
      durationMs >= 0 &&
      durationMs < MIN_MS_FOR_HIGH &&
      n > 80
    ) {
      n = Math.min(n, 40);
    }
    return n;
  }

  function clampTotal(score) {
    return Math.min(MAX_TOTAL, Math.max(0, Math.round(Number(score) || 0)));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** 4 случайные разные миссии для «быстрой смены». */
  function pickQuickFour(gameIds) {
    const ids = (gameIds || []).filter(Boolean);
    if (ids.length <= 4) return shuffle(ids);
    return shuffle(ids).slice(0, 4);
  }

  return {
    MAX_GAME,
    MAX_TOTAL,
    sanitizeNick,
    clampGameScore,
    clampTotal,
    shuffle,
    pickQuickFour,
  };
})();
