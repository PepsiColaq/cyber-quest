/* 08 — Цифровой детектив. Восстанови цепочку утечки по порядку. */
window.GameModules.detective = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "detective",
      title: "Цифровой детектив",
      kicker: "Расследование · хронология",
      goal: "Собери цепочку утечки: нажимай улики в том порядке, в котором всё происходило.",
      rules: [
        { ic: "detective", tone: "gold", t: "Пять карточек вразброс. Кликай от <b>первого события</b> к последнему." },
        { ic: "flag", tone: "ok", t: "На карточке появится номер шага. Ошибся порядком — жми <b>Сбросить</b> и собери заново." },
        { ic: "clock", tone: "warn", t: "На расследование — <b>40 секунд</b>. Каждая улика на своём месте: <b>+60</b>." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const chain = E.pick(window.Banks.detective, 1)[0];

  const stage = E.buildStage(root, {
    id: "detective",
    title: "Цифровой детектив",
    kicker: "Расследование · хронология",
    rounds: 0,
    timed: true,
  });

  stage.body.innerHTML = "";
  stage.body.appendChild(
    E.el(
      `<div><div class="q-prompt">Собери цепочку утечки</div>
       <div class="q-sub">Нажимай улики в том порядке, в котором происходили события</div></div>`
    )
  );

  const grid = E.el('<div class="clues" style="margin:6px 0 16px"></div>');
  const order = [];
  const shuffled = E.shuffle(chain.map((text, truth) => ({ text, truth })));
  const cards = [];

  shuffled.forEach((c) => {
    const card = E.el(
      `<div class="clue"><span class="cstep"></span><span>${c.text}</span></div>`
    );
    card.addEventListener("click", () => {
      if (card.classList.contains("picked") || card.classList.contains("locked")) return;
      card.classList.add("picked");
      order.push(c);
      card.querySelector(".cstep").textContent = order.length;
      if (order.length === chain.length) check();
    });
    cards.push(card);
    grid.appendChild(card);
  });
  stage.body.appendChild(grid);

  const foot = E.el(`
    <div class="stage-foot">
      <button class="btn btn-ghost btn-sm" id="detReset">Сбросить</button>
      <span class="chip"><span class="dot"></span> Нажми 5 улик по порядку</span>
    </div>`);
  stage.body.appendChild(foot);
  window.hydrateIcons(stage.body);

  foot.querySelector("#detReset").addEventListener("click", () => {
    if (cards[0].classList.contains("locked")) return;
    order.length = 0;
    cards.forEach((c) => {
      c.classList.remove("picked");
      c.querySelector(".cstep").textContent = "";
    });
  });

  function check() {
    stage.timer.stop();
    cards.forEach((c) => c.classList.add("locked"));
    let score = 0,
      right = 0;
    order.forEach((c, i) => {
      if (c.truth === i) {
        score += 60;
        right++;
      }
    });
    stage.feedback(right === chain.length, `Верно ${right} из ${chain.length}`, right === chain.length ? "Дело раскрыто!" : "Хронология неточна");
    E.later(
      () => ctx.done({ score, detail: { right, total: chain.length } }),
      1500
    );
  }

  stage.timer.start(40, () => {
    if (order.length < chain.length) {
      cards.forEach((c) => c.classList.add("locked"));
      stage.feedback(false, "Время!", "Цепочка не собрана");
      E.later(() => ctx.done({ score: 0, detail: { right: 0, total: chain.length } }), 1400);
    }
  });
  }
};
