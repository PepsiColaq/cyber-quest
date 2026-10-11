(function () {
  const KEY = () => window.AppConfig.storageKey;

  function read() {
    try {
      const raw = localStorage.getItem(KEY());
      if (!raw) return { attempts: [], leaders: [] };
      const data = JSON.parse(raw);
      return {
        attempts: Array.isArray(data.attempts) ? data.attempts : [],
        leaders: Array.isArray(data.leaders) ? data.leaders : [],
      };
    } catch {
      return { attempts: [], leaders: [] };
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY(), JSON.stringify(data));
    } catch {
      /* ignore quota / file:// quirks */
    }
  }

  function saveAttempt(attempt) {
    const Guard = window.GameGuard;
    const nick = Guard
      ? Guard.sanitizeNick(attempt.nick) || String(attempt.nick || "").slice(0, 14)
      : attempt.nick;
    const score = Guard ? Guard.clampTotal(attempt.score) : Math.max(0, Number(attempt.score) || 0);
    const clean = Object.assign({}, attempt, { nick, score });
    const data = read();
    data.attempts.unshift(clean);
    data.attempts = data.attempts.slice(0, 200);

    const existing = data.leaders.find(
      (l) => l.nick.toLowerCase() === clean.nick.toLowerCase()
    );
    if (!existing || clean.score > existing.score) {
      data.leaders = data.leaders.filter(
        (l) => l.nick.toLowerCase() !== clean.nick.toLowerCase()
      );
      data.leaders.push({
        nick: clean.nick,
        score: clean.score,
        rank: clean.rank,
        at: clean.at,
      });
    }
    data.leaders.sort((a, b) => b.score - a.score);
    data.leaders = data.leaders.slice(0, 10);
    write(data);
    return data;
  }

  function clearDay() {
    write({ attempts: [], leaders: [] });
  }

  function toCsv() {
    const data = read();
    const rows = [
      ["time", "nick", "score", "rank", "games", "details"].join(";"),
    ];
    data.attempts.forEach((a) => {
      rows.push(
        [
          a.at || "",
          a.nick || "",
          a.score ?? "",
          a.rank || "",
          (a.games || []).join("|"),
          JSON.stringify(a.details || {}).replace(/;/g, ","),
        ].join(";")
      );
    });
    return rows.join("\n");
  }

  window.Store = { read, saveAttempt, clearDay, toCsv };
})();
