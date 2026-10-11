/* ============================================================
   App — контроллер приложения (после «Начать»):
   ник → штаб → игры → итоги, рейтинг, режим преподавателя.
   ============================================================ */
window.App = (function () {
  const cfg = window.AppConfig;
  const Icons = window.Icons;
  const $ = (s) => document.querySelector(s);
  const on = (sel, ev, fn) => {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (el) el.addEventListener(ev, fn);
  };

  const state = {
    nick: "",
    score: 0,
    gameScores: {},
    details: {},
    played: new Set(),
    mode: "hub", // 'hub' | 'quick'
    queue: [],
    activeGameId: null,
  };

  const Cloud = () => window.Cloud;

  function rankFor(score) {
    let r = cfg.ranks[0].title;
    cfg.ranks.forEach((x) => {
      if (score >= x.min) r = x.title;
    });
    return r;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Навигация ---------- */
  function activeScreen() {
    const s = document.querySelector(".screen.active");
    return s ? s.id : "";
  }

  function syncBackBtn() {
    const btn = $("#btnBack");
    if (!btn) return;
    const id = activeScreen();
    const showBack = ["scrGame", "scrLeaders", "scrAbout", "scrResult"].includes(id);
    btn.hidden = !showBack;
  }

  function goBack() {
    if (!document.body.classList.contains("app-open")) return;
    if ($("#pinModal")?.classList.contains("show")) return;
    if ($("#teacherModal")?.classList.contains("show")) return;
    const id = activeScreen();
    if (id === "scrGame") {
      if (window.Engine && window.Engine.clearAll) window.Engine.clearAll();
      const gid = state.activeGameId;
      state.activeGameId = null;
      state.mode = "hub";
      state.queue = [];
      if (gid && Cloud()) {
        Cloud().endGame(state.nick, gid, state.gameScores[gid] || 0, { aborted: true });
      } else if (Cloud()) {
        Cloud().setStatus("hub", null, state.score);
      }
      renderHub();
      show("scrHub");
      return;
    }
    if (id === "scrLeaders" || id === "scrAbout" || id === "scrResult") {
      if (Cloud()) Cloud().setStatus("hub", null, state.score);
      renderHub();
      show("scrHub");
    }
  }

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = $("#" + id);
    if (el) el.classList.add("active");
    $("#app").scrollTop = 0;
    window.Motion && window.Motion.bindAll(el || document);
    syncBackBtn();
    armIdle();
  }

  function enter() {
    document.body.classList.add("app-open");
    $("#app").classList.add("show");
    resetSession();
    show("scrNick");
    const input = $("#nickInput");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 300);
    }
    armIdle();
  }

  function resetSession() {
    if (Cloud()) Cloud().leave();
    state.nick = "";
    state.score = 0;
    state.gameScores = {};
    state.details = {};
    state.played = new Set();
    state.mode = "hub";
    state.queue = [];
    state.activeGameId = null;
    setHud();
  }

  function exitToLanding() {
    if (window.Engine && window.Engine.clearAll) window.Engine.clearAll();
    document.body.classList.remove("app-open");
    $("#app").classList.remove("show");
    document.body.classList.add("snap");
    window.scrollTo({ top: 0, behavior: "auto" });
    resetSession();
  }

  /* ---------- HUD ---------- */
  function setHud() {
    const hud = $("#hud");
    if (!hud) return;
    if (!state.nick) {
      hud.innerHTML = "";
      return;
    }
    hud.innerHTML = `
      <span class="hud-chip"><span class="i-user"></span> ${escapeHtml(state.nick)}</span>
      <span class="hud-chip">Очки <b>${state.score}</b></span>
      <span class="hud-chip rank">Ранг <b>${rankFor(state.score)}</b></span>`;
    window.hydrateIcons(hud);
  }

  /* ---------- Экран ника ---------- */
  function initNick() {
    on("#nickGo", "click", submitNick);
    on("#nickInput", "keydown", (e) => {
      if (e.key === "Enter") submitNick();
    });
  }
  async function submitNick() {
    const Guard = window.GameGuard;
    const raw = ($("#nickInput").value || "").trim();
    const v = Guard ? Guard.sanitizeNick(raw) : raw;
    if (raw && !v) {
      const input = $("#nickInput");
      if (input) {
        input.value = "";
        input.focus();
      }
      return;
    }
    state.nick = v || "Аноним" + Math.floor(Math.random() * 900 + 100);
    setHud();
    renderHub();
    show("scrHub");
    // облако — тихо, без надписей для абитуриентов
    if (Cloud() && Cloud().enabled()) {
      Cloud().init();
      Cloud().startSession(state.nick).catch(() => {});
    }
  }

  /* ---------- Хаб ---------- */
  function renderHub() {
    const grid = $("#hubGrid");
    if (!grid) return;
    grid.innerHTML = "";
    cfg.games.forEach((g) => {
      const played = state.played.has(g.id);
      const card = document.createElement("button");
      card.className = "hub-card" + (played ? " played" : "");
      card.setAttribute("data-reveal", "");
      card.setAttribute("data-tilt", "6");
      card.innerHTML = `
        <div class="hc-done"><span class="i-check"></span> ${state.gameScores[g.id] || 0}</div>
        <div class="hc-top">
          <div class="hc-ic">${Icons[g.id] || Icons.shield}</div>
          <div class="hc-num">${g.num}</div>
        </div>
        <h3>${g.title}</h3>
        <p>${g.blurb}</p>`;
      card.addEventListener("click", () => {
        if (window.openGameInfo) {
          window.openGameInfo(g, {
            startLabel: "Начать миссию",
            onStart: () => startGame(g.id, "hub"),
          });
        } else {
          startGame(g.id, "hub");
        }
      });
      grid.appendChild(card);
    });
    window.hydrateIcons(grid);
    window.Motion && window.Motion.bindAll($("#scrHub"));

    // кнопка «итоги» в шапке, если что-то сыграно
    const head = $(".hub-head .row");
    let res = $("#toResult");
    if (state.played.size > 0 && !res) {
      res = document.createElement("button");
      res.id = "toResult";
      res.className = "btn btn-primary btn-sm";
      res.innerHTML = 'Мои итоги <span class="i-arrow"></span>';
      res.addEventListener("click", openResults);
      head.appendChild(res);
      window.hydrateIcons(res);
    }
    const sub = $("#hubSub");
    if (sub)
      sub.textContent =
        state.played.size === 0
          ? "Выбирай миссию. Можно в любом порядке."
          : `Пройдено ${state.played.size} из ${cfg.games.length}. Так держать!`;
  }

  /* ---------- Запуск игры ---------- */
  function startGame(id, mode) {
    state.mode = mode;
    state.activeGameId = id;
    show("scrGame");
    mountGame(id);
  }

  function mountGame(id) {
    const root = $("#gameStage");
    if (window.Engine && window.Engine.clearAll) window.Engine.clearAll();
    root.innerHTML = "";
    const mod = window.GameModules[id];
    if (!mod) {
      root.innerHTML = '<div class="stage-body panel">Игра не найдена</div>';
      return;
    }
    if (Cloud()) {
      // важно дождаться создания game_runs, иначе очки в админке останутся 0
      Cloud().beginGame(state.nick, id);
    }
    const ctx = {
      nick: state.nick,
      done: (res) => onGameDone(id, res || {}),
    };
    try {
      mod(root, ctx);
    } catch (e) {
      console.error(e);
      root.innerHTML = '<div class="stage-body panel">Ошибка игры: ' + escapeHtml(e.message) + "</div>";
    }
    armIdle();
  }

  function onGameDone(id, res) {
    // игнорируем «догоняющие» вызовы после выхода/смены экрана (стенд, idle-reset)
    if (!document.body.classList.contains("app-open")) return;
    if (!$("#scrGame").classList.contains("active")) return;
    if (state.activeGameId && state.activeGameId !== id) return;
    const Guard = window.GameGuard;
    let score = Math.max(0, Math.round(res.score || 0));
    if (Guard) score = Guard.clampGameScore(id, score, res.durationMs);
    const prev = state.gameScores[id] || 0;
    if (state.played.has(id)) state.score += score - prev;
    else state.score += score;
    if (Guard) state.score = Guard.clampTotal(state.score);
    state.gameScores[id] = Math.max(prev, score);
    state.details[id] = res.detail || {};
    state.played.add(id);
    state.activeGameId = null;
    setHud();
    if (Cloud()) {
      Promise.resolve(Cloud().endGame(state.nick, id, score, res.detail || {}))
        .then(() =>
          Cloud().syncProgress({
            nick: state.nick,
            score: state.score,
            rank: rankFor(state.score),
            games: [...state.played],
            details: state.details,
            status: "hub",
            current_game: null,
          })
        )
        .catch((e) => console.warn("[Cloud] endGame", e));
    }

    if (state.mode === "quick") {
      if (state.queue.length) {
        const next = state.queue.shift();
        setTimeout(() => startGame(next, "quick"), 200);
      } else {
        openResults();
      }
      return;
    }
    // режим хаба: вернуться в штаб (или итоги, если всё пройдено)
    if (state.played.size >= cfg.games.length) openResults();
    else {
      renderHub();
      show("scrHub");
    }
  }

  function startQuick() {
    const Guard = window.GameGuard;
    const allIds = cfg.games.map((g) => g.id);
    state.queue = Guard
      ? Guard.pickQuickFour(allIds)
      : allIds.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    const first = state.queue.shift();
    startGame(first, "quick");
  }

  /* ---------- Итоги ---------- */
  function openResults() {
    const rank = rankFor(state.score);
    const at = new Date();
    const stamp =
      at.toLocaleDateString("ru-RU") + " " + at.toLocaleTimeString("ru-RU").slice(0, 5);
    const Guard = window.GameGuard;
    const attempt = {
      nick: Guard ? Guard.sanitizeNick(state.nick) || state.nick : state.nick,
      score: Guard ? Guard.clampTotal(state.score) : state.score,
      rank,
      at: stamp,
      games: [...state.played],
      details: state.details,
    };
    window.Store.saveAttempt(attempt);
    if (Cloud()) Cloud().finishAttempt(attempt);

    const wrap = $("#resultWrap");
    const breakdown = cfg.games
      .filter((g) => state.played.has(g.id))
      .map(
        (g) =>
          `<div class="rb"><span>${g.title}</span><b>${state.gameScores[g.id] || 0}</b></div>`
      )
      .join("");

    wrap.innerHTML = `
      <div class="result-badge">${Icons.trophy}</div>
      <h2>Отличная работа, ${escapeHtml(state.nick)}!</h2>
      <div class="result-rank">Ранг: ${rank}</div>
      <div class="result-score" id="rScore">0</div>
      <div class="result-breakdown">${breakdown || '<div class="rb"><span>Игр не сыграно</span><b>0</b></div>'}</div>
      <div class="hint" style="justify-content:center;text-align:left">
        <span class="i-sparkle"></span>
        <span>Хочешь прокачать такие навыки по-настоящему? Направление «${cfg.directionName}» ждёт тебя.</span>
      </div>
      <div class="admissions">
        <a href="tel:${cfg.phone.replace(/[^\d+]/g, "")}"><span class="i-phone"></span>${cfg.phone}</a>
        <a href="mailto:${cfg.email}"><span class="i-mail"></span>${cfg.email}</a>
      </div>
      <div class="result-cta">
        <button class="btn btn-ghost" id="rHub"><span class="i-back"></span> В штаб</button>
        <button class="btn btn-ghost" id="rLeaders"><span class="i-trophy"></span> Лидеры</button>
        <button class="btn btn-primary" id="rNew">Новый игрок <span class="i-arrow"></span></button>
      </div>`;
    window.hydrateIcons(wrap);
    show("scrResult");
    const sc = $("#rScore");
    window.Motion && window.Motion.countUp(sc, state.score, { dur: 1200 });

    on("#rHub", "click", () => {
      renderHub();
      show("scrHub");
    });
    on("#rLeaders", "click", () => renderLeaders(true));
    on("#rNew", "click", exitToLanding);
  }

  /* ---------- Рейтинг ---------- */
  function renderLeaders(fromResult) {
    const list = $("#leadersList");
    const data = window.Store.read();
    const leaders = data.leaders || [];
    if (!leaders.length) {
      list.innerHTML = '<div class="leaders-empty">Пока нет результатов. Стань первым!</div>';
    } else {
      list.innerHTML = leaders
        .map((l, i) => {
          const cls =
            (i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : "") +
            (l.nick.toLowerCase() === state.nick.toLowerCase() ? " me" : "");
          return `
            <div class="lrow ${cls}">
              <div class="pos">${i + 1}</div>
              <div><div class="lnick">${escapeHtml(l.nick)}</div><div class="lrank">${l.rank || ""}</div></div>
              <div class="lscore">${l.score}</div>
              <div>${i === 0 ? Icons.trophy : ""}</div>
            </div>`;
        })
        .join("");
    }
    window.hydrateIcons(list);
    on("#leadersBack", "click", () => {
      renderHub();
      show("scrHub");
    });
    show("scrLeaders");
  }

  /* ---------- Режим преподавателя ---------- */
  function bindTeacherTrigger() {
    const brand = $("#tbHome");
    let timer = null;
    const start = () => {
      timer = setTimeout(openPin, 1200);
    };
    const cancel = () => clearTimeout(timer);
    if (brand) {
      brand.addEventListener("pointerdown", start);
      brand.addEventListener("pointerup", cancel);
      brand.addEventListener("pointerleave", cancel);
      // короткий клик по бренду — в штаб
      brand.addEventListener("click", () => {
        if (!state.nick) return;
        renderHub();
        show("scrHub");
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "T" || e.key === "t" || e.key === "Е" || e.key === "е")) {
        e.preventDefault();
        openPin();
      }
    });
  }
  function openPin() {
    $("#pinInput").value = "";
    $("#pinErr").textContent = "";
    $("#pinModal").classList.add("show");
    setTimeout(() => $("#pinInput").focus(), 200);
  }
  function closePin() {
    $("#pinModal").classList.remove("show");
  }
  function checkPin() {
    if ($("#pinInput").value === String(cfg.teacherPin)) {
      closePin();
      openTeacher();
    } else {
      $("#pinErr").textContent = "Неверный PIN";
    }
  }
  function openTeacher() {
    const data = window.Store.read();
    const attempts = data.attempts || [];
    const total = attempts.length;
    const avg = total ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / total) : 0;
    const best = attempts.reduce((m, a) => Math.max(m, a.score || 0), 0);

    $("#teacherStats").innerHTML = `
      <div class="ts"><b>${total}</b><span>попыток за день</span></div>
      <div class="ts"><b>${avg}</b><span>средний балл</span></div>
      <div class="ts"><b>${best}</b><span>рекорд дня</span></div>
      <div class="ts"><b>${(data.leaders || []).length}</b><span>уникальных игроков</span></div>`;

    const rows = attempts
      .map(
        (a) => `
        <tr>
          <td>${escapeHtml(a.at || "")}</td>
          <td>${escapeHtml(a.nick || "")}</td>
          <td class="score">${a.score ?? ""}</td>
          <td>${escapeHtml(a.rank || "")}</td>
          <td>${(a.games || []).length}</td>
        </tr>`
      )
      .join("");
    $("#teacherTable").innerHTML = `
      <thead><tr><th>Время</th><th>Позывной</th><th>Очки</th><th>Ранг</th><th>Игр</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--text-faint)">Пока пусто</td></tr>'}</tbody>`;
    const cloudHint = $("#teacherCloudLink");
    if (cloudHint) {
      const on = window.CloudConfig && window.CloudConfig.enabled;
      cloudHint.hidden = !on;
    }
    $("#teacherModal").classList.add("show");
  }
  function closeTeacher() {
    $("#teacherModal").classList.remove("show");
  }
  function downloadCsv() {
    const blob = new Blob([window.Store.toCsv()], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cyberquest-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- Idle-reset (для стенда) ---------- */
  let idleT = null;
  function armIdle() {
    clearTimeout(idleT);
    if (!document.body.classList.contains("app-open")) return;
    // во время игры / мини-обучения не сбрасываем — игрок может читать без мыши
    if (activeScreen() === "scrGame") return;
    idleT = setTimeout(() => {
      if ($("#teacherModal")?.classList.contains("show") || $("#pinModal")?.classList.contains("show")) {
        armIdle();
        return;
      }
      if (activeScreen() === "scrGame") return;
      exitToLanding();
    }, cfg.idleResetMs || 120000);
  }
  ["pointerdown", "keydown", "pointermove"].forEach((ev) =>
    document.addEventListener(ev, () => {
      if (document.body.classList.contains("app-open")) armIdle();
    })
  );

  /* ---------- init ---------- */
  function init() {
    initNick();
    bindTeacherTrigger();
    on("#btnBack", "click", goBack);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if ($("#pinModal")?.classList.contains("show") || $("#teacherModal")?.classList.contains("show"))
        return;
      if (!document.body.classList.contains("app-open")) return;
      const id = activeScreen();
      if (["scrGame", "scrLeaders", "scrAbout", "scrResult"].includes(id)) {
        e.preventDefault();
        goBack();
      }
    });
    on("#quickStart", "click", startQuick);
    on("#toLeaders", "click", () => renderLeaders(false));
    on("#toAbout", "click", () => show("scrAbout"));
    on("#aboutBack", "click", () => {
      renderHub();
      show("scrHub");
    });
    on("#pinGo", "click", checkPin);
    on("#pinCancel", "click", closePin);
    on("#pinInput", "keydown", (e) => {
      if (e.key === "Enter") checkPin();
    });
    on("#teacherClose", "click", closeTeacher);
    on("#teacherCsv", "click", downloadCsv);
    on("#teacherReset", "click", () => {
      if (confirm("Сбросить все результаты дня?")) {
        window.Store.clearDay();
        openTeacher();
      }
    });
    syncBackBtn();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { enter };
})();
