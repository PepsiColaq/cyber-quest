/* Админка преподавателя → Supabase Edge Function admin-api */
(function () {
  const cfg = () => window.CloudConfig || {};
  const $ = (s) => document.querySelector(s);
  const TITLES = {};
  (window.AppConfig?.games || []).forEach((g) => {
    TITLES[g.id] = g.title;
  });

  let password = sessionStorage.getItem("cq_admin_pass") || "";
  let pollTimer = null;

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

  async function api(action, extra) {
    const c = cfg();
    if (!c.adminFn) throw new Error("adminFn не задан в cloud-config.js");
    const res = await fetch(c.adminFn, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ action, password, day: $("#dayPick")?.value || today() }, extra || {})),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "http_" + res.status);
    return data;
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

  async function doLogin() {
    const err = $("#loginErr");
    err.textContent = "";
    password = $("#adminPass").value || "";
    if (!cfg().enabled || !cfg().adminFn) {
      err.textContent = "Облако выключено. Заполни js/cloud-config.js (см. supabase/SETUP.md).";
      return;
    }
    try {
      await api("login");
      sessionStorage.setItem("cq_admin_pass", password);
      showDash();
    } catch (e) {
      err.textContent = e.message === "unauthorized" ? "Неверный пароль" : String(e.message || e);
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

    if (password && cfg().enabled && cfg().adminFn) {
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
