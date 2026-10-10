/* ============================================================
   Облако Supabase: сессии, game_runs, attempts.
   Миссии пишутся ТОЛЬКО по завершении (очки + длительность).
   «Сейчас играют» — из sessions (heartbeat).
   ============================================================ */
window.Cloud = (function () {
  const cfg = () => window.CloudConfig || {};
  let client = null;
  let sessionId = null;
  let activeGameId = null;
  let runStarted = 0;
  let beatTimer = null;
  let ready = false;
  let attemptId = null;
  let lastErr = "";

  function enabled() {
    const c = cfg();
    return !!(c.enabled && c.url && c.anonKey && window.supabase);
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0;
      const v = ch === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function init() {
    if (!enabled()) {
      ready = false;
      return false;
    }
    try {
      client = window.supabase.createClient(cfg().url, cfg().anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      ready = true;
      return true;
    } catch (e) {
      console.warn("[Cloud] init failed", e);
      ready = false;
      return false;
    }
  }

  function stopBeat() {
    if (beatTimer) {
      clearInterval(beatTimer);
      beatTimer = null;
    }
  }

  function startBeat() {
    stopBeat();
    if (!ready || !sessionId) return;
    const ms = cfg().heartbeatMs || 9000;
    beatTimer = setInterval(() => {
      heartbeat();
    }, ms);
  }

  function notify(msg) {
    lastErr = msg || "";
    try {
      window.dispatchEvent(
        new CustomEvent("cq-cloud", { detail: { ok: !msg, message: msg || "" } })
      );
    } catch (_) {
      /* ignore */
    }
  }

  async function safe(fn) {
    if (!ready || !client) return null;
    try {
      const result = await fn();
      if (result && result.error) {
        console.warn("[Cloud]", result.error);
        notify(result.error.message || "cloud_error");
      } else if (result && !result.error) {
        notify("");
      }
      return result;
    } catch (e) {
      console.warn("[Cloud]", e);
      notify(String((e && e.message) || e));
      return null;
    }
  }

  async function startSession(nick) {
    if (!ready && !init()) return null;
    stopBeat();
    sessionId = null;
    activeGameId = null;
    runStarted = 0;
    attemptId = null;
    const id = uuid();
    const result = await safe(() =>
      client.from("sessions").insert({
        id,
        nick,
        status: "hub",
        current_game: null,
        total_score: 0,
        last_seen: new Date().toISOString(),
      })
    );
    if (!result || result.error) return null;
    sessionId = id;
    startBeat();
    return sessionId;
  }

  async function heartbeat(extra) {
    if (!ready || !sessionId) return;
    const patch = Object.assign(
      { last_seen: new Date().toISOString() },
      extra || {}
    );
    await safe(() => client.from("sessions").update(patch).eq("id", sessionId));
  }

  async function setStatus(status, currentGame, totalScore) {
    const patch = { status };
    if (currentGame !== undefined) patch.current_game = currentGame;
    if (typeof totalScore === "number") patch.total_score = totalScore;
    await heartbeat(patch);
  }

  /** Старт миссии: только статус сессии. Строка в game_runs — после финиша. */
  async function beginGame(nick, gameId) {
    if (!ready || !sessionId) return null;
    activeGameId = gameId;
    runStarted = Date.now();
    await setStatus("playing", gameId);
    return gameId;
  }

  /** Финиш: одна полная запись с очками и длительностью. */
  async function endGame(nick, gameId, score, detail) {
    if (!ready || !sessionId) return;
    const gid = gameId || activeGameId;
    const duration = runStarted ? Math.max(0, Date.now() - runStarted) : null;
    const points = Math.max(0, Math.round(Number(score) || 0));

    if (gid) {
      await safe(() =>
        client.from("game_runs").insert({
          id: uuid(),
          session_id: sessionId,
          nick,
          game_id: gid,
          score: points,
          started_at: new Date(Date.now() - (duration || 0)).toISOString(),
          finished_at: new Date().toISOString(),
          duration_ms: duration,
          detail: detail || {},
        })
      );
    }

    activeGameId = null;
    runStarted = 0;
  }

  async function syncProgress(snapshot) {
    if (!ready || !sessionId) return;
    const row = {
      session_id: sessionId,
      nick: snapshot.nick,
      score: snapshot.score || 0,
      rank: snapshot.rank || "",
      finished_at: new Date().toISOString(),
      games: snapshot.games || [],
      details: snapshot.details || {},
    };
    if (attemptId) {
      const r = await safe(() =>
        client.from("attempts").update(row).eq("id", attemptId)
      );
      if (r && r.error) {
        // если UPDATE недоступен — пишем новую строку
        attemptId = uuid();
        await safe(() =>
          client.from("attempts").insert({ id: attemptId, ...row })
        );
      }
    } else {
      attemptId = uuid();
      const r = await safe(() =>
        client.from("attempts").insert({ id: attemptId, ...row })
      );
      if (!r || r.error) attemptId = null;
    }
    await setStatus(
      snapshot.status || "hub",
      snapshot.current_game ?? null,
      snapshot.score || 0
    );
  }

  async function finishAttempt(attempt) {
    if (!ready || !sessionId) return;
    await syncProgress({
      nick: attempt.nick,
      score: attempt.score || 0,
      rank: attempt.rank || "",
      games: attempt.games || [],
      details: attempt.details || {},
      status: "done",
      current_game: null,
    });
  }

  async function leave() {
    stopBeat();
    if (ready && sessionId) {
      await heartbeat({ status: "left", current_game: null });
    }
    sessionId = null;
    activeGameId = null;
    runStarted = 0;
    attemptId = null;
  }

  function isOnline() {
    return ready && !!sessionId;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      if (!ready || !sessionId || !client) return;
      try {
        client
          .from("sessions")
          .update({
            status: "left",
            last_seen: new Date().toISOString(),
            current_game: null,
          })
          .eq("id", sessionId);
      } catch (_) {
        /* ignore */
      }
    });
  }

  return {
    init,
    enabled,
    isOnline,
    startSession,
    setStatus,
    beginGame,
    endGame,
    finishAttempt,
    syncProgress,
    leave,
    heartbeat,
    lastError: () => lastErr,
  };
})();
