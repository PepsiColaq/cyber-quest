/* 10 — Файрвол · мини tower-defense.
   Пакеты летят справа к ядру слева. Блокируй вредоносные (красные),
   пропускай легитимные (зелёные). Красный дошёл до ядра — минус HP. */
window.GameModules.firewall = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "firewall",
      title: "Файрвол",
      kicker: "Защита периметра · 35 секунд",
      goal: "Пакеты летят справа налево к ядру. Сбивай атаки, пропускай свой трафик.",
      rules: [
        { ic: "bolt", tone: "bad", t: "<b>Красный</b> — атака. Тапни, чтобы сбить. <b>+35</b>." },
        { ic: "check", tone: "ok", t: "<b>Зелёный</b> — свой трафик. Не трогай. Ошибка: <b>−20</b>." },
        { ic: "server", tone: "gold", t: "Пропустишь красный до ядра — минус HP (их 5). Раунд: <b>35 сек</b>." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const LANES = 3;

  const stage = E.buildStage(root, {
    id: "firewall",
    title: "Файрвол",
    kicker: "Защита периметра · 35 секунд",
    rounds: 0,
    timed: true,
  });

  stage.body.innerHTML = "";
  stage.body.appendChild(
    E.el(
      `<div><div class="q-prompt">Защити ядро сети</div>
       <div class="q-sub">Тапай <b style="color:var(--danger)">красные</b> пакеты (атаки). <b style="color:var(--ok)">Зелёные</b> не трогай — это свои.</div></div>`
    )
  );
  const hud = E.el(`
    <div class="patch-hud">
      <span>Ядро: <b id="fwHp" style="color:var(--ok)">●●●●●</b></span>
      <span>Заблокировано: <b id="fwBlk">0</b></span>
      <span>Пропущено: <b id="fwLeak" style="color:var(--danger)">0</b></span>
    </div>`);
  stage.body.appendChild(hud);

  const field = E.el('<div class="fw-field"></div>');
  for (let i = 0; i < LANES; i++) {
    field.appendChild(
      E.el(`<div class="fw-lane" style="top:${((i + 1) / (LANES + 1)) * 100}%"></div>`)
    );
  }
  // Направляющие стрелки «поток к ядру»
  field.appendChild(E.el('<div class="fw-flow"><span></span><span></span><span></span></div>'));
  field.appendChild(E.el(`<div class="fw-core">${E.Icons.server}<i class="fw-core-label">ЯДРО</i></div>`));

  stage.body.appendChild(field);
  window.hydrateIcons(stage.body);

  const hpEl = hud.querySelector("#fwHp");
  const blkEl = hud.querySelector("#fwBlk");
  const leakEl = hud.querySelector("#fwLeak");

  let hp = 5,
    blocked = 0,
    leaked = 0,
    score = 0,
    speed = 0.5,
    running = true;
  const packets = [];
  let firstMal = true;

  function drawHp() {
    hpEl.textContent = "●".repeat(hp) + "○".repeat(Math.max(0, 5 - hp));
  }
  drawHp();

  function spawn() {
    if (!running) return;
    const lane = Math.floor(Math.random() * LANES);
    // первый пакет гарантированно вредоносный — чтобы было понятно, что тапать
    const mal = firstMal ? true : Math.random() < 0.62;
    firstMal = false;
    const el = E.el(
      `<div class="packet ${mal ? "mal" : "ok"}">${mal ? E.Icons.bolt : E.Icons.check}</div>`
    );
    el.style.top = ((lane + 1) / (LANES + 1)) * 100 + "%";
    el.style.left = "98%";
    field.appendChild(el);
    const p = { el, x: 98, mal, dead: false };
    el.addEventListener("click", () => {
      if (!running || p.dead) return;
      if (p.mal) {
        p.dead = true;
        blocked++;
        score += 35;
        blkEl.textContent = blocked;
        stage.fly(35, el);
        el.classList.add("boom");
        E.later(() => el.remove(), 180);
      } else {
        score = Math.max(0, score - 20);
        stage.fly(-20, el);
        el.classList.add("shake");
        E.later(() => el.classList.remove("shake"), 300);
      }
    });
    packets.push(p);
  }

  function tick() {
    if (!running) return;
    for (const p of packets) {
      if (p.dead) continue;
      p.x -= speed;
      p.el.style.left = p.x + "%";
      if (p.x <= 11) {
        p.dead = true;
        if (p.mal) {
          hp--;
          leaked++;
          leakEl.textContent = leaked;
          drawHp();
          field.classList.add("hit");
          E.later(() => field.classList.remove("hit"), 220);
          if (hp <= 0) return finish();
        }
        p.el.remove();
      }
    }
    for (let i = packets.length - 1; i >= 0; i--)
      if (packets[i].dead && !packets[i].el.isConnected) packets.splice(i, 1);
  }

  const mover = E.every(tick, 24);
  const spawner = E.every(() => {
    spawn();
    speed = Math.min(1.4, speed + 0.03);
  }, 900);
  spawn();
  stage.timer.start(35, finish);

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    running = false;
    clearInterval(mover);
    clearInterval(spawner);
    stage.timer.stop();
    field.querySelectorAll(".packet").forEach((p) => p.remove());
    if (hp > 0) score += hp * 15; // бонус за выжившее ядро
    stage.feedback(hp > 0, hp > 0 ? "Периметр удержан!" : "Ядро пробито", `Заблокировано: ${blocked}`);
    E.later(() => ctx.done({ score: Math.max(0, score), detail: { blocked, leaked, hp } }), 1400);
  }
  }
};
