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

  function enabled() {
    const c = cfg();
    return !!(c.enabled && c.url && c.anonKey && window.supabase);
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

  async function safe(fn) {
    if (!ready || !client) return null;
    try {
      return await fn();
    } catch (e) {
      console.warn("[Cloud]", e);
      return null;
    }
  }

  async function startSession(nick) {
    if (!ready && !init()) return null;
    stopBeat();
    sessionId = null;
    runId = null;
    const result = await safe(() =>
      client
        .from("sessions")
        .insert({
          nick,
          status: "hub",
          current_game: null,
          total_score: 0,
          last_seen: new Date().toISOString(),
        })
        .select("id")
        .single()
    );
    if (!result || result.error || !result.data) return null;
    sessionId = result.data.id;
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
    await setStatus("playing", gameId);
    const { data } = (await safe(() =>
      client
        .from("game_runs")
        .insert({
          session_id: sessionId,
          nick,
          game_id: gameId,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single()
    )) || { data: null };
    if (data) runId = data.id;
    return runId;
  }

  async function endGame(nick, gameId, score, detail) {
    if (!ready || !sessionId) return;
    const duration = runStarted ? Date.now() - runStarted : null;
    if (runId) {
      await safe(() =>
        client
          .from("game_runs")
          .update({
            score: score || 0,
            finished_at: new Date().toISOString(),
            duration_ms: duration,
            detail: detail || {},
          })
          .eq("id", runId)
      );
    } else {
      await safe(() =>
        client.from("game_runs").insert({
          session_id: sessionId,
          nick,
          game_id: gameId,
          score: score || 0,
          started_at: new Date(Date.now() - (duration || 0)).toISOString(),
          finished_at: new Date().toISOString(),
          duration_ms: duration,
          detail: detail || {},
        })
      );
    }
    runId = null;
    runStarted = 0;
    await setStatus("hub", null);
  }

  async function finishAttempt(attempt) {
    if (!ready || !sessionId) return;
    await safe(() =>
      client.from("attempts").insert({
        session_id: sessionId,
        nick: attempt.nick,
        score: attempt.score || 0,
        rank: attempt.rank || "",
        finished_at: new Date().toISOString(),
        games: attempt.games || [],
        details: attempt.details || {},
      })
    );
    await setStatus("done", null, attempt.score || 0);
  }

  async function leave() {
    stopBeat();
    if (ready && sessionId) {
      await heartbeat({ status: "left", current_game: null });
    }
    sessionId = null;
    runId = null;
    runStarted = 0;
  }

  function isOnline() {
    return ready && !!sessionId;
  }

  // init lazily; also bind unload
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      if (!ready || !sessionId || !client) return;
      try {
        // best-effort beacon-style update
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
    leave,
    heartbeat,
  };
})();
