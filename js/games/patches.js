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
  const active = new Set();
  const pPatched = hud.querySelector("#pPatched");
  const pMiss = hud.querySelector("#pMiss");
  const PAD = 10; // px gap between chips

  function chipRect(el) {
    const a = el.getBoundingClientRect();
    const f = field.getBoundingClientRect();
    return {
      left: a.left - f.left,
      top: a.top - f.top,
      right: a.right - f.left,
      bottom: a.bottom - f.top,
    };
  }

  function overlaps(a, b) {
    return !(
      a.right + PAD < b.left ||
      a.left > b.right + PAD ||
      a.bottom + PAD < b.top ||
      a.top > b.bottom + PAD
    );
  }

  function placeFree(chip) {
    const f = field.getBoundingClientRect();
    if (f.width < 40 || f.height < 40) return false;
    field.appendChild(chip);
    // measure natural size once (off-field left/top still layout)
    chip.style.visibility = "hidden";
    chip.style.left = "0";
    chip.style.top = "0";
    const w = chip.offsetWidth;
    const h = chip.offsetHeight;
    const maxX = Math.max(0, f.width - w - 8);
    const maxY = Math.max(0, f.height - h - 8);
    for (let attempt = 0; attempt < 36; attempt++) {
      const x = 4 + Math.random() * maxX;
      const y = 4 + Math.random() * maxY;
      chip.style.left = x + "px";
      chip.style.top = y + "px";
      const mine = chipRect(chip);
      let free = true;
      for (const other of active) {
        if (overlaps(mine, chipRect(other))) {
          free = false;
          break;
        }
      }
      if (free) {
        chip.style.visibility = "";
        return true;
      }
    }
    chip.remove();
    return false;
  }

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
    if (!placeFree(chip)) return;
    active.add(chip);

    const life = E.later(() => {
      if (!chip.isConnected) return;
      if (!isSafe) {
        missed++;
        pMiss.textContent = missed;
      }
      active.delete(chip);
      chip.remove();
    }, 2200);
    timers.add(life);

    chip.addEventListener("pointerdown", (e) => {
      if (e && e.cancelable) e.preventDefault();
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
      active.delete(chip);
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
