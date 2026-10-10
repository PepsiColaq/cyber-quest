/* 03 — Охотник в логах. Отметь подозрительные входы. */
window.GameModules.logs = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "logs",
      title: "Охотник в логах",
      kicker: "SOC · журнал входов",
      goal: "Отметь только подозрительные входы — как аналитик в журнале безопасности.",
      rules: [
        { ic: "flag", tone: "bad", t: "Кликай строки-угрозы: <b>ночь</b>, <b>внешний IP</b>, серии <b>FAIL</b>, вход под admin/root." },
        { ic: "check", tone: "ok", t: "Обычный дневной вход из внутренней сети не трогай. Ложная метка: <b>−25</b>, верная: <b>+50</b>." },
        { ic: "clock", tone: "gold", t: "Отметил — жми <b>Передать отчёт</b>. На разбор — <b>35 секунд</b>." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const lines = window.Banks.makeLogs(8);

  const stage = E.buildStage(root, {
    id: "logs",
    title: "Охотник в логах",
    kicker: "SOC · журнал входов",
    rounds: 0,
    timed: true,
  });

  const flagged = new Set();

  stage.body.innerHTML = "";
  stage.body.appendChild(
    E.el(
      `<div><div class="q-prompt">Отметь подозрительные входы</div>
       <div class="q-sub">Ночь, внешние IP, серии ошибок и привилегированные аккаунты — твои маячки</div></div>`
    )
  );

  const table = E.el('<div class="logs" style="margin:4px 0 18px"></div>');
  lines.forEach((l, i) => {
    const row = E.el(`
      <div class="log-line">
        <span class="ltime">${l.t}</span>
        <span>${l.u} <span class="lip" style="color:var(--text-faint)">· ${l.ip}</span></span>
        <span style="color:${l.st.includes("FAIL") ? "var(--danger)" : "var(--ok)"}">${l.st}</span>
        <span class="lflag">${E.Icons.flag}</span>
      </div>`);
    row.addEventListener("click", () => {
      if (row.classList.contains("done")) return;
      if (flagged.has(i)) {
        flagged.delete(i);
        row.classList.remove("flagged");
      } else {
        flagged.add(i);
        row.classList.add("flagged");
      }
    });
    table.appendChild(row);
  });
  stage.body.appendChild(table);

  const foot = E.el(`
    <div class="stage-foot">
      <span class="chip"><span class="dot"></span> Отмечено: <b id="flagCount" class="mono">&nbsp;0</b></span>
      <button class="btn btn-primary" id="logsDone">Передать отчёт <span class="i-arrow"></span></button>
    </div>`);
  stage.body.appendChild(foot);
  window.hydrateIcons(stage.body);

  const counter = foot.querySelector("#flagCount");
  table.addEventListener("click", () => {
    counter.textContent = " " + flagged.size;
  });

  function finish() {
    stage.timer.stop();
    let score = 0,
      hits = 0;
    const rows = [...table.querySelectorAll(".log-line")];
    lines.forEach((l, i) => {
      rows[i].classList.add("done", "locked");
      const picked = flagged.has(i);
      if (l.bad && picked) {
        score += 50;
        hits++;
        rows[i].style.boxShadow = "inset 3px 0 0 var(--ok)";
      } else if (l.bad && !picked) {
        rows[i].classList.add("flagged");
      } else if (!l.bad && picked) {
        score -= 25;
      }
    });
    const totalBad = lines.filter((l) => l.bad).length;
    stage.feedback(hits === totalBad, `Найдено ${hits} из ${totalBad}`, "Угрозы подсвечены");
    foot.querySelector("#logsDone").disabled = true;
    E.later(
      () => ctx.done({ score: Math.max(0, score), detail: { hits, total: totalBad } }),
      1500
    );
  }

  foot.querySelector("#logsDone").addEventListener("click", finish);
  stage.timer.start(35, finish);
  }
};
