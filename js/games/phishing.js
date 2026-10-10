/* 01 — Фишинговый ящик · «Лупа инспектора».
   Открой письмо и кликни по всем подозрительным местам (красным флагам). */
window.GameModules.phishing = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "phishing",
      title: "Фишинговый ящик",
      kicker: "Инспекция · найди красные флаги",
      goal: "Открой письмо и кликай по подозрительным местам — это «красные флаги» мошенников.",
      rules: [
        { ic: "flag", tone: "bad", t: "<b>Кликай подозрительное</b>: чужой домен, срочность, карта, код из SMS, левая ссылка. Верный флаг: <b>+40</b>." },
        { ic: "check", tone: "ok", t: "Подсказки пунктиром нет — смотри смыслом. Обычная подпись или нормальный текст кликать не надо (−15)." },
        { ic: "clock", tone: "gold", t: "На письмо — <b>28 секунд</b>. Когда найдёшь все флаги — само перейдёт дальше." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const emails = E.pick(window.Banks.phishing, 3);

  const stage = E.buildStage(root, {
    id: "phishing",
    title: "Фишинговый ящик",
    kicker: "Инспекция · найди красные флаги",
    rounds: emails.length,
    timed: true,
  });

  let idx = 0,
    score = 0,
    totalFound = 0,
    totalBad = emails.reduce((s, e) => s + e.bad, 0);

  function render() {
    stage.setActive(idx);
    const m = emails[idx];
    let found = 0;

    stage.body.innerHTML = "";
    stage.body.appendChild(
      E.el(
        `<div><div class="q-prompt">Разбери письмо под лупой</div>
         <div class="q-sub">Кликни по всем подозрительным местам. Нашёл флаг <b class="mono" id="phFound">0/${m.bad}</b></div></div>`
      )
    );
    const mail = E.el(`
      <div class="mail magnify" style="margin:4px 0 16px">
        <div class="mail-head">
          <div class="mail-row"><b>От:</b><span>${m.from}</span></div>
          <div class="mail-row"><b>Тема:</b><span>${m.subj}</span></div>
        </div>
        <div class="mail-body">${m.body}</div>
      </div>`);
    stage.body.appendChild(mail);

    const foot = E.el(`
      <div class="stage-foot">
        <span class="chip"><span class="dot"></span> Письмо ${idx + 1} из ${emails.length}</span>
        <button class="btn btn-ghost" id="phNext">Дальше <span class="i-arrow"></span></button>
      </div>`);
    stage.body.appendChild(foot);
    window.hydrateIcons(stage.body);

    const foundLabel = stage.body.querySelector("#phFound");

    mail.querySelectorAll(".zone").forEach((z) => {
      z.addEventListener("click", () => {
        if (z.classList.contains("done")) return;
        z.classList.add("done");
        const bad = z.dataset.bad === "1";
        if (bad) {
          z.classList.add("flag");
          found++;
          totalFound++;
          score += 40;
          foundLabel.textContent = found + "/" + m.bad;
          stage.feedback(true, "Флаг найден!", z.dataset.why || "");
          stage.fly(40, z);
          if (found >= m.bad) {
            stage.dot(idx, "ok");
            E.later(next, 900);
          }
        } else {
          z.classList.add("miss");
          score = Math.max(0, score - 15);
          stage.feedback(false, "Это норма", z.dataset.why || "Здесь нет угрозы");
        }
      });
    });

    foot.querySelector("#phNext").addEventListener("click", () => {
      if (found < m.bad) stage.dot(idx, found > 0 ? "ok" : "bad");
      next();
    });

    stage.timer.start(28, () => {
      stage.dot(idx, found >= m.bad ? "ok" : "bad");
      next();
    });
  }

  let advancing = false;
  function next() {
    if (advancing) return;
    advancing = true;
    stage.timer.stop();
    idx++;
    E.later(() => {
      advancing = false;
      if (idx >= emails.length)
        ctx.done({ score, detail: { found: totalFound, total: totalBad } });
      else render();
    }, 400);
  }

  render();
  }
};
