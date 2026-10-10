/* ============================================================
   Облако Supabase: сессии, game_runs, attempts.
   Если конфиг выключен / нет сети — тихий no-op (остаётся localStorage).
   ============================================================ */
window.Cloud = (function () {
  const cfg = () => window.CloudConfig || {};
  let client = null;
  let sessionId = null;
  let runId = null;
  let runStarted = 0;
  let beatTimer = null;
  let ready = false;
  let beginPromise = null;
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
    runId = null;
    beginPromise = null;
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
    notify("");
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

  async function beginGame(nick, gameId) {
    if (!ready || !sessionId) return null;
    runStarted = Date.now();
    runId = null;
    const id = uuid();
    beginPromise = (async () => {
      await setStatus("playing", gameId);
      const result = await safe(() =>
        client.from("game_runs").insert({
          id,
          session_id: sessionId,
          nick,
          game_id: gameId,
          score: 0,
          started_at: new Date().toISOString(),
        })
      );
      if (!result || result.error) {
        runId = null;
        return null;
      }
      runId = id;
      return id;
    })();
    return beginPromise;
  }

  async function endGame(nick, gameId, score, detail) {
    if (!ready || !sessionId) return;
    if (beginPromise) {
      try {
        await beginPromise;
      } catch (_) {
        /* ignore */
      }
    }
    const duration = runStarted ? Math.max(0, Date.now() - runStarted) : null;
    const payload = {
      score: Math.max(0, Math.round(score || 0)),
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      detail: detail || {},
    };

    let ok = false;
    if (runId) {
      const r = await safe(() =>
        client.from("game_runs").update(payload).eq("id", runId)
      );
      ok = !!(r && !r.error);
    }
    if (!ok) {
      // догоняем незакрытую миссию этой сессии
      const r2 = await safe(() =>
        client
          .from("game_runs")
          .update(payload)
          .eq("session_id", sessionId)
          .eq("game_id", gameId)
          .is("finished_at", null)
      );
      ok = !!(r2 && !r2.error);
    }
    if (!ok) {
      await safe(() =>
        client.from("game_runs").insert({
          id: uuid(),
          session_id: sessionId,
          nick,
          game_id: gameId,
          started_at: new Date(Date.now() - (duration || 0)).toISOString(),
          ...payload,
        })
      );
    }

    runId = null;
    runStarted = 0;
    beginPromise = null;
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

  /** Снимок прогресса в attempts после каждой миссии — журнал и сводка не пустые. */
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
      await safe(() => client.from("attempts").update(row).eq("id", attemptId));
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

  async function leave() {
    stopBeat();
    if (ready && sessionId) {
      await heartbeat({ status: "left", current_game: null });
    }
    sessionId = null;
    runId = null;
    runStarted = 0;
    beginPromise = null;
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
