/* 11 — Карта кибератак · нейтрализуй источники атак, пока трассеры не дошли до ядра. */
window.GameModules.attackmap = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "attackmap",
      title: "Карта кибератак",
      kicker: "SOC-мониторинг · 32 секунды",
      goal: "По карте ползут трассеры к ядру в центре. Нейтрализуй источники, пока луч не дошёл.",
      rules: [
        { ic: "bolt", tone: "bad", t: "Тапай <b>красные точки</b> на краю карты — это источники атаки. <b>+45</b>." },
        { ic: "target", tone: "gold", t: "Если луч дошёл до ядра — минус HP. Ядро в центре, жизней <b>5</b>." },
        { ic: "clock", tone: "warn", t: "Раунд: <b>32 секунды</b>. Бонус за выжившее ядро." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const CX = 50,
    CY = 54; // центр (ядро) в координатах viewBox 0..100

  const stage = E.buildStage(root, {
    id: "attackmap",
    title: "Карта кибератак",
    kicker: "SOC-мониторинг · 32 секунды",
    rounds: 0,
    timed: true,
  });

  stage.body.innerHTML = "";
  stage.body.appendChild(
    E.el(
      `<div><div class="q-prompt">Отрази атаки на инфраструктуру</div>
       <div class="q-sub">Тапай <b style="color:var(--danger)">красные источники</b>, пока их трассеры не дошли до ядра в центре.</div></div>`
    )
  );
  const hud = E.el(
    `<div class="patch-hud"><span>Ядро: <b id="amHp" style="color:var(--ok)">●●●●●</b></span><span>Отражено: <b id="amKill">0</b></span></div>`
  );
  stage.body.appendChild(hud);

  const map = E.el(`
    <div class="amap">
      <svg class="am-lines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
      <div class="am-rings"><i></i><i></i><i></i></div>
      <div class="am-core" style="left:${CX}%;top:${CY}%">${E.Icons.shield}</div>
    </div>`);
  stage.body.appendChild(map);
  window.hydrateIcons(stage.body);

  const svg = map.querySelector(".am-lines");
  const hpEl = hud.querySelector("#amHp");
  const killEl = hud.querySelector("#amKill");

  let hp = 5,
    kills = 0,
    score = 0,
    running = true;
  function drawHp() {
    hpEl.textContent = "●".repeat(Math.max(0, hp)) + "○".repeat(Math.max(0, 5 - hp));
  }
  drawHp();

  const labels =
    (window.Banks && window.Banks.attackLabels) || [
      "C2",
      "Сканер",
      "Брутфорс",
      "DDoS",
      "Фишинг",
    ];

  function spawn() {
    if (!running) return;
    // источник у края по случайному углу
    const ang = Math.random() * Math.PI * 2;
    const ox = CX + Math.cos(ang) * 46;
    const oy = CY + Math.sin(ang) * 42;
    const dur = 2600 + Math.random() * 1200;
    const tag = labels[Math.floor(Math.random() * labels.length)];

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", ox);
    line.setAttribute("y1", oy);
    line.setAttribute("x2", CX);
    line.setAttribute("y2", CY);
    line.setAttribute("class", "am-trace");
    const len = Math.hypot(CX - ox, CY - oy);
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    svg.appendChild(line);
    // запустить анимацию «пробега» трассера
    requestAnimationFrame(() => {
      line.style.transition = `stroke-dashoffset ${dur}ms linear`;
      line.style.strokeDashoffset = 0;
    });

    const dot = E.el(
      `<div class="am-src" title="${tag}"><span class="am-ping"></span>${E.Icons.bolt}<i class="am-tag">${tag}</i></div>`
    );
    dot.style.left = ox + "%";
    dot.style.top = oy + "%";
    map.appendChild(dot);

    function fireLaser() {
      const mw = map.clientWidth || 1;
      const mh = map.clientHeight || 1;
      const x1 = (ox / 100) * mw;
      const y1 = (oy / 100) * mh;
      const x2 = (CX / 100) * mw;
      const y2 = (CY / 100) * mh;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy);
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const beam = E.el('<div class="am-laser"></div>');
      beam.style.left = x1 + "px";
      beam.style.top = y1 - 2 + "px";
      beam.style.width = dist + "px";
      beam.style.setProperty("--am-rot", deg + "deg");
      beam.style.transform = "rotate(" + deg + "deg)";
      map.appendChild(beam);
      const core = map.querySelector(".am-core");
      if (core) {
        core.classList.add("struck");
        E.later(() => core.classList.remove("struck"), 450);
      }
      E.later(() => beam.remove(), 420);
    }

    const atk = { line, dot, dead: false, impact: null };
    atk.impact = E.later(() => {
      if (atk.dead || !running) return;
      atk.dead = true;
      fireLaser();
      hp--;
      drawHp();
      map.classList.add("am-hit");
      E.later(() => map.classList.remove("am-hit"), 280);
      line.remove();
      dot.remove();
      if (hp <= 0) finish();
    }, dur);

    dot.addEventListener("pointerdown", (e) => {
      if (e && e.cancelable) e.preventDefault();
      if (!running || atk.dead) return;
      atk.dead = true;
      clearTimeout(atk.impact);
      kills++;
      score += 45;
      killEl.textContent = kills;
      stage.fly(45, dot);
      dot.classList.add("am-killed");
      line.style.stroke = "var(--ok)";
      E.later(() => {
        dot.remove();
        line.remove();
      }, 220);
    });
  }

  const spawner = E.every(spawn, 950);
  spawn();

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    running = false;
    clearInterval(spawner);
    stage.timer.stop();
    map.querySelectorAll(".am-src").forEach((d) => d.remove());
    map.querySelectorAll(".am-trace").forEach((l) => l.remove());
    // оставшиеся таймеры impact уже проверяют !running
    if (hp > 0) score += hp * 15;
    stage.feedback(hp > 0, hp > 0 ? "Атаки отражены!" : "Ядро пробито", `Отражено: ${kills}`);
    E.later(() => ctx.done({ score: Math.max(0, score), detail: { kills, hp } }), 1400);
  }

  stage.timer.start(32, finish);
  }
};
