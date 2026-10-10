/* Админка: Supabase RPC admin_api (основной путь) или Edge Function (если задан adminFn). */
(function () {
  const cfg = () => window.CloudConfig || {};
  const $ = (s) => document.querySelector(s);
  const TITLES = {};
  (window.AppConfig?.games || []).forEach((g) => {
    TITLES[g.id] = g.title;
  });

  let password = sessionStorage.getItem("cq_admin_pass") || "";
  let pollTimer = null;
  let sb = null;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function fmtDur(ms) {
    if (ms == null || !isFinite(ms)) return "—";
    const s = Math.round(ms / 1000);
    if (s < 60) return s + " с";
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + " мин " + r + " с";
  }

  function ago(iso) {
    if (!iso) return "—";
    const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (sec < 5) return "сейчас";
    if (sec < 60) return sec + " с назад";
    return Math.floor(sec / 60) + " мин назад";
  }

  function sessionAge(iso) {
    if (!iso) return "—";
    return fmtDur(Date.now() - new Date(iso).getTime());
  }

  function ensureClient() {
    const c = cfg();
    if (!c.enabled || !c.url || !c.anonKey) return null;
    if (!window.supabase) return null;
    if (!sb) {
      sb = window.supabase.createClient(c.url, c.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return sb;
  }

  async function fetchJson(url, opts, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms || 12000);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    } catch (e) {
      if (e && (e.name === "AbortError" || String(e).includes("abort"))) {
        throw new Error("timeout");
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  async function api(action, extra) {
    const c = cfg();
    const day = (extra && extra.day) || $("#dayPick")?.value || today();

    // 1) Edge Function, если явно задана
    if (c.adminFn) {
      const { res, data } = await fetchJson(
        c.adminFn,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, password, day }),
        },
        12000
      );
      if (!res.ok) throw new Error(data.error || "http_" + res.status);
      if (data.error) throw new Error(data.error);
      return data;
    }

    // 2) Прямой REST RPC — надёжнее, чем зависающий supabase-js в части сетей
    if (!c.url || !c.anonKey) throw new Error("Заполни url и anonKey в js/cloud-config.js");
    const endpoint = c.url.replace(/\/$/, "") + "/rest/v1/rpc/admin_api";
    const { res, data } = await fetchJson(
      endpoint,
      {
        method: "POST",
        headers: {
          apikey: c.anonKey,
          Authorization: "Bearer " + c.anonKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          p_password: password,
          p_action: action,
          p_day: day || null,
        }),
      },
      12000
    );
    if (!res.ok) {
      throw new Error(data.message || data.error || "http_" + res.status);
    }
    if (data && data.error) throw new Error(data.error);
    return data || {};
  }

  function showDash() {
    $("#loginView").hidden = true;
    $("#dashView").hidden = false;
    $("#dayPick").value = today();
    $("#dayLabel").textContent = "День: " + $("#dayPick").value;
    refreshAll();
    clearInterval(pollTimer);
    pollTimer = setInterval(refreshLive, 8000);
  }

  function showLogin() {
    $("#loginView").hidden = false;
    $("#dashView").hidden = true;
    clearInterval(pollTimer);
  }

  function friendlyErr(e) {
    const msg = String((e && e.message) || e || "");
    if (msg === "unauthorized") return "Неверный пароль";
    if (msg === "timeout")
      return "Облако не отвечает (таймаут 12 с). Открой swdwpsfnvqlivpxwxwwj.supabase.co — если не грузится, сеть/антивирус режет Supabase.";
    if (/Failed to fetch|NetworkError|fetch/i.test(msg))
      return "Нет связи с Supabase из браузера (DNS/файрвол/антивирус). Сайт GitHub открывается, а *.supabase.co — нет.";
    if (/crypt does not exist/i.test(msg))
      return "В базе не включён pgcrypto — выполни supabase/fix-pgcrypto.sql";
    return msg || "Не удалось войти";
  }

  async function doLogin() {
    const err = $("#loginErr");
    const btn = $("#loginBtn");
    err.textContent = "";
    password = ($("#adminPass").value || "").trim();
    const c = cfg();
    if (!c.enabled || !c.url || !c.anonKey) {
      err.textContent = "Облако выключено. Заполни js/cloud-config.js (см. supabase/SETUP.md).";
      return;
    }
    if (!password) {
      err.textContent = "Введи пароль";
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Входим…";
    }
    try {
      const data = await api("login");
      if (!data || data.ok !== true) {
        throw new Error((data && data.error) || "login_failed");
      }
      sessionStorage.setItem("cq_admin_pass", password);
      showDash();
    } catch (e) {
      err.textContent = friendlyErr(e);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Войти";
      }
    }
  }

  async function refreshLive() {
    try {
      const data = await api("live");
      const rows = data.sessions || [];
      $("#liveCount").textContent = rows.length + " online";
      const tb = $("#liveTable tbody");
      if (!rows.length) {
        tb.innerHTML =
          '<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-faint)">Никого онлайн</td></tr>';
        return;
      }
      tb.innerHTML = rows
        .map((s) => {
          const stale = Date.now() - new Date(s.last_seen).getTime() > 25000;
          const game = s.current_game ? TITLES[s.current_game] || s.current_game : "—";
          return `<tr>
            <td><b>${esc(s.nick)}</b></td>
            <td>${esc(s.status)}</td>
            <td>${esc(game)}</td>
            <td class="score">${s.total_score ?? 0}</td>
            <td>${sessionAge(s.started_at)}</td>
            <td class="${stale ? "live-warn" : "live-ok"}">${ago(s.last_seen)}${stale ? " · завис?" : ""}</td>
          </tr>`;
        })
        .join("");
    } catch (e) {
      console.warn(e);
    }
  }

  async function refreshJournal() {
    const data = await api("journal");
    const attempts = data.attempts || [];
    const runs = data.runs || [];
    const runsByNick = {};
    runs.forEach((r) => {
      const k = (r.nick || "").toLowerCase();
      if (!runsByNick[k]) runsByNick[k] = [];
      runsByNick[k].push(r);
    });

    const jt = $("#journalTable tbody");
    if (!attempts.length) {
      jt.innerHTML =
        '<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-faint)">Пока пусто</td></tr>';
    } else {
      jt.innerHTML = attempts
        .map((a) => {
          const list = runsByNick[(a.nick || "").toLowerCase()] || [];
          const detail = list
            .map(
              (r) =>
                `${TITLES[r.game_id] || r.game_id}: ${r.score ?? 0} (${fmtDur(r.duration_ms)})`
            )
            .join("<br>");
          const t = a.finished_at ? new Date(a.finished_at).toLocaleString("ru-RU") : "";
          return `<tr>
            <td>${esc(t)}</td>
            <td><b>${esc(a.nick)}</b></td>
            <td class="score">${a.score ?? 0}</td>
            <td>${esc(a.rank || "")}</td>
            <td>${esc((a.games || []).map((g) => TITLES[g] || g).join(", "))}</td>
            <td><details><summary class="muted">миссии</summary><div class="muted">${detail || "—"}</div></details></td>
          </tr>`;
        })
        .join("");
    }

    const rt = $("#runsTable tbody");
    if (!runs.length) {
      rt.innerHTML =
        '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text-faint)">Нет миссий</td></tr>';
    } else {
      rt.innerHTML = runs
        .slice(0, 300)
        .map((r) => {
          const t = r.started_at ? new Date(r.started_at).toLocaleString("ru-RU") : "";
          return `<tr>
            <td>${esc(t)}</td>
            <td>${esc(r.nick)}</td>
            <td>${esc(TITLES[r.game_id] || r.game_id)}</td>
            <td class="score">${r.score ?? 0}</td>
            <td>${fmtDur(r.duration_ms)}${r.detail && r.detail.aborted ? ' <span class="muted">(выход)</span>' : ""}</td>
          </tr>`;
        })
        .join("");
    }
  }

  async function refreshSummary() {
    const data = await api("summary");
    $("#dayLabel").textContent = "День: " + (data.day || today());
    $("#summaryCards").innerHTML = `
      <div class="admin-stat"><b>${data.total || 0}</b><span>попыток</span></div>
      <div class="admin-stat"><b>${data.avg || 0}</b><span>средний балл</span></div>
      <div class="admin-stat"><b>${data.best || 0}</b><span>рекорд</span></div>
      <div class="admin-stat"><b>${data.uniquePlayers || 0}</b><span>игроков</span></div>`;
  }

  async function refreshAll() {
    try {
      await Promise.all([refreshSummary(), refreshLive(), refreshJournal()]);
    } catch (e) {
      alert("Ошибка: " + (e.message || e));
      if (String(e.message).includes("unauthorized")) {
        sessionStorage.removeItem("cq_admin_pass");
        password = "";
        showLogin();
      }
    }
  }

  function bind() {
    $("#loginBtn").addEventListener("click", doLogin);
    $("#adminPass").addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
    $("#btnLogout").addEventListener("click", () => {
      sessionStorage.removeItem("cq_admin_pass");
      password = "";
      showLogin();
    });
    $("#btnRefresh").addEventListener("click", refreshAll);
    $("#dayPick").addEventListener("change", refreshAll);
    $("#btnCsv").addEventListener("click", async () => {
      try {
        const data = await api("csv");
        const blob = new Blob([data.csv || ""], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "cyberquest-cloud-" + (data.day || today()) + ".csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        alert(e.message || e);
      }
    });
    $("#btnReset").addEventListener("click", async () => {
      if (!confirm("Удалить все облачные данные за выбранный день?")) return;
      try {
        await api("reset_day");
        refreshAll();
      } catch (e) {
        alert(e.message || e);
      }
    });

    if (password && cfg().enabled && cfg().url && cfg().anonKey) {
      api("login")
        .then(showDash)
        .catch(() => {
          sessionStorage.removeItem("cq_admin_pass");
          password = "";
          showLogin();
        });
    } else {
      showLogin();
    }
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
