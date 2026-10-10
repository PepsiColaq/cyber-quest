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
    const data = read();
    data.attempts.unshift(attempt);
    data.attempts = data.attempts.slice(0, 200);

    const existing = data.leaders.find(
      (l) => l.nick.toLowerCase() === attempt.nick.toLowerCase()
    );
    if (!existing || attempt.score > existing.score) {
      data.leaders = data.leaders.filter(
        (l) => l.nick.toLowerCase() !== attempt.nick.toLowerCase()
      );
      data.leaders.push({
        nick: attempt.nick,
        score: attempt.score,
        rank: attempt.rank,
        at: attempt.at,
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
