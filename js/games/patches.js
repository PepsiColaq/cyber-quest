/* 09 — Гонка патчей. Успей закрыть уязвимости, не трогая исправные узлы. */
window.GameModules.patches = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "patches",
      title: "Гонка патчей",
      kicker: "Реальное время · 30 секунд",
      goal: "Уязвимости всплывают сами. Успей закрыть опасные — и не трогай исправные.",
      rules: [
        { ic: "bolt", tone: "bad", t: "<b>Красные</b> чипы — дыры. Тапай, чтобы поставить патч. <b>+35</b>." },
        { ic: "check", tone: "ok", t: "<b>Зелёные</b> («всё ок») не трогай — штраф <b>−20</b>." },
        { ic: "clock", tone: "warn", t: "Чип живёт пару секунд. Пропустил красный — он уйдёт в «пропущено». Раунд: <b>30 сек</b>." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const vulns = [
    "SQL-инъекция",
    "XSS-уязвимость",
    "Открытый порт 445",
    "Слабый пароль",
    "Устаревший TLS",
    "RCE в сервисе",
    "Нет 2FA",
    "CSRF-дыра",
    "Открытый Redis",
    "Default credentials",
    "Path traversal",
  ];
  const safes = ["Патч установлен", "Антивирус в норме", "Бэкап готов", "WAF активен", "2FA включена"];

  const stage = E.buildStage(root, {
    id: "patches",
    title: "Гонка патчей",
    kicker: "Реальное время · 30 секунд",
    rounds: 0,
    timed: true,
  });

  stage.body.innerHTML = "";
  stage.body.appendChild(
    E.el(
      `<div><div class="q-prompt">Закрывай уязвимости на лету</div>
       <div class="q-sub">Красные — патчи ставим. Зелёные (всё ок) не трогаем — за них штраф!</div></div>`
    )
  );
  const hud = E.el(
    `<div class="patch-hud"><span>Закрыто: <b id="pPatched">0</b></span><span>Пропущено: <b id="pMiss" style="color:var(--danger)">0</b></span></div>`
  );
  stage.body.appendChild(hud);
  const field = E.el('<div class="patch-field"></div>');
  stage.body.appendChild(field);
  window.hydrateIcons(stage.body);

  let score = 0,
    patched = 0,
    missed = 0,
    running = true;
  const timers = new Set();
  const pPatched = hud.querySelector("#pPatched");
  const pMiss = hud.querySelector("#pMiss");

  function spawn() {
    if (!running) return;
    const isSafe = Math.random() < 0.28;
    const label = isSafe
      ? safes[Math.floor(Math.random() * safes.length)]
      : vulns[Math.floor(Math.random() * vulns.length)];
    const chip = E.el(
      `<div class="vuln-chip ${isSafe ? "safe" : ""}"><span class="vc-ic">${
        isSafe ? E.Icons.check : E.Icons.bolt
      }</span>${label}</div>`
    );
    const x = 6 + Math.random() * 74;
    const y = 12 + Math.random() * 70;
    chip.style.left = x + "%";
    chip.style.top = y + "%";
    field.appendChild(chip);

    const life = E.later(() => {
      if (!chip.isConnected) return;
      if (!isSafe) {
        missed++;
        pMiss.textContent = missed;
      }
      chip.remove();
    }, 2200);
    timers.add(life);

    chip.addEventListener("click", () => {
      if (!running) return;
      if (isSafe) {
        score -= 20;
        stage.fly(-20, chip);
        chip.style.borderColor = "var(--danger)";
      } else {
        score += 35;
        patched++;
        pPatched.textContent = patched;
        stage.fly(35, chip);
      }
      chip.remove();
    });
  }

  const spawner = E.every(spawn, 900);
  spawn();

  function finish() {
    if (!running) return;
    running = false;
    clearInterval(spawner);
    timers.forEach((t) => clearTimeout(t));
    stage.timer.stop();
    field.querySelectorAll(".vuln-chip").forEach((c) => c.remove());
    stage.feedback(patched >= 6, `Закрыто ${patched} уязвимостей`, `Пропущено: ${missed}`);
    E.later(
      () => ctx.done({ score: Math.max(0, score), detail: { patched, missed } }),
      1400
    );
  }

  stage.timer.start(30, finish);
  }
};
