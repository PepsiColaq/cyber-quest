/* 06 — Живая схема атаки · инфекция ползёт по сети, ставь щиты на узлы. */
window.GameModules.network = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "network",
      title: "Живая схема атаки",
      kicker: "Периметр · останови заражение",
      goal: "Красная волна ползёт от интернета к ядру. Успей закрыть уязвимые узлы щитом, пока зараза не дошла.",
      rules: [
        {
          ic: "bolt",
          tone: "bad",
          t: "Узлы с меткой <b>!</b> уязвимы. Кликни — поставишь щит (<b>+70</b>). Зараза не пройдёт через щит.",
        },
        {
          ic: "shield",
          tone: "ok",
          t: "Если волна дойдёт до <b>ЯДРА</b> — раунд провален. Зелёные узлы уже в порядке, их не трогай.",
        },
        {
          ic: "clock",
          tone: "gold",
          t: "У тебя около <b>28 секунд</b>. Закрой все дыры раньше, чем инфекция прорвётся.",
        },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
    const nets = (window.Banks && window.Banks.liveNets) || [];
    const layout =
      nets.length > 0 ? E.pick(nets, 1)[0] : null;
    // узлы в % координатах (случайная схема из банка)
    const nodes = (layout ? layout.nodes : [
      { id: "net", name: "Интернет", ic: "wifi", x: 50, y: 10, role: "source" },
      { id: "fw", name: "Шлюз", ic: "shield", x: 50, y: 32, role: "hop", vuln: true, issue: "Слабое правило ACL" },
      { id: "wifi", name: "Wi‑Fi", ic: "wifi", x: 22, y: 58, role: "hop", vuln: true, issue: "Гостевая сеть в LAN" },
      { id: "mail", name: "Почта", ic: "mail", x: 78, y: 58, role: "hop", safe: true },
      { id: "srv", name: "Сервер", ic: "server", x: 35, y: 82, role: "hop", vuln: true, issue: "Без патча" },
      { id: "core", name: "ЯДРО", ic: "shield", x: 65, y: 88, role: "core" },
    ]).map((n) => Object.assign({}, n));
    const edges = (layout && layout.edges) || [
      ["net", "fw"],
      ["fw", "wifi"],
      ["fw", "mail"],
      ["wifi", "srv"],
      ["mail", "core"],
      ["srv", "core"],
    ];

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const stage = E.buildStage(root, {
      id: "network",
      title: "Живая схема атаки",
      kicker: "Периметр · останови заражение",
      rounds: 0,
      timed: true,
    });

    stage.body.innerHTML = "";
    stage.body.appendChild(
      E.el(
        `<div>
          <div class="q-prompt">Инфекция в сети</div>
          <div class="q-sub">Кликай уязвимые узлы <b style="color:var(--danger)">!</b>, пока красная волна не дошла до ядра.</div>
        </div>`
      )
    );

    const hud = E.el(
      `<div class="patch-hud">
        <span>Щиты: <b id="lnShield">0</b>/<b id="lnNeed">0</b></span>
        <span>Статус: <b id="lnStat" style="color:var(--warn)">атака</b></span>
      </div>`
    );
    stage.body.appendChild(hud);

    const field = E.el(`
      <div class="live-net">
        <div class="ln-bg"></div>
        <svg class="ln-wires" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
        <div class="ln-nodes" id="lnNodes"></div>
      </div>`);
    stage.body.appendChild(field);

    const foot = E.el(
      `<div class="stage-foot">
        <span class="chip"><span class="dot"></span> Удержи ядро</span>
        <button class="btn btn-ghost" id="lnDone" type="button">Готово</button>
      </div>`
    );
    stage.body.appendChild(foot);
    window.hydrateIcons(stage.body);

    const svg = field.querySelector(".ln-wires");
    const nodesEl = field.querySelector("#lnNodes");
    const need = nodes.filter((n) => n.vuln).length;
    hud.querySelector("#lnNeed").textContent = need;
    let shielded = 0;
    let score = 0;
    let finished = false;
    const infected = new Set(["net"]);
    const nodeEls = {};

    // рёбра
    const edgeEls = edges.map(([a, b]) => {
      const n1 = byId[a],
        n2 = byId[b];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", n1.x);
      line.setAttribute("y1", n1.y);
      line.setAttribute("x2", n2.x);
      line.setAttribute("y2", n2.y);
      line.setAttribute("class", "ln-edge");
      line.dataset.a = a;
      line.dataset.b = b;
      svg.appendChild(line);
      // particle for infection travel
      const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pulse.setAttribute("r", "1.2");
      pulse.setAttribute("class", "ln-pulse");
      pulse.style.display = "none";
      svg.appendChild(pulse);
      return { a, b, line, pulse, t: 0, active: false };
    });

    nodes.forEach((n) => {
      const el = E.el(`
        <button type="button" class="ln-node ${n.role} ${n.vuln ? "vuln" : ""} ${n.safe ? "safe" : ""}"
          style="left:${n.x}%;top:${n.y}%" data-id="${n.id}">
          <span class="ln-ic">${E.Icons[n.ic] || E.Icons.server}</span>
          <b>${n.name}</b>
          ${n.vuln ? '<i class="ln-bang">!</i>' : n.safe ? '<i class="ln-ok"></i>' : ""}
        </button>`);
      if (n.vuln) {
        el.addEventListener("click", () => {
          if (finished || n.shielded || infected.has(n.id)) return;
          n.shielded = true;
          shielded++;
          score += 70;
          el.classList.remove("vuln");
          el.classList.add("shielded");
          const bang = el.querySelector(".ln-bang");
          if (bang) bang.remove();
          hud.querySelector("#lnShield").textContent = shielded;
          stage.feedback(true, "Щит установлен", n.issue || "");
          stage.fly(70, el);
          if (shielded >= need) win("Все дыры закрыты!");
        });
      } else if (n.safe) {
        el.addEventListener("click", () => {
          if (finished || el.dataset.hit) return;
          el.dataset.hit = "1";
          score = Math.max(0, score - 25);
          stage.feedback(false, "Уже защищён", "Не трать время на зелёные узлы");
          stage.fly(-25, el);
        });
      }
      nodesEl.appendChild(el);
      nodeEls[n.id] = el;
      window.hydrateIcons(el);
    });

    function markInfected(id) {
      if (infected.has(id)) return;
      const n = byId[id];
      // щит или уже «в порядке» — волна не проходит
      if (n.shielded || n.safe) return;
      infected.add(id);
      const el = nodeEls[id];
      if (el) el.classList.add("infected");
      if (id === "core") {
        lose("Ядро заражено");
      }
    }

    function neighbors(id) {
      return edges
        .filter(([a, b]) => a === id || b === id)
        .map(([a, b]) => (a === id ? b : a));
    }

    // волна: каждые ~1.1с пытается перейти с заражённого на соседа
    let waveTimer = null;
    function waveStep() {
      if (finished) return;
      const frontier = [...infected];
      frontier.forEach((id) => {
        neighbors(id).forEach((nb) => {
          const n = byId[nb];
          if (infected.has(nb) || n.shielded || n.safe) return;
          // анимируем импульс по ребру
          const ed = edgeEls.find(
            (e) => (e.a === id && e.b === nb) || (e.b === id && e.a === nb)
          );
          if (ed) {
            ed.active = true;
            ed.t = 0;
            ed.from = id;
            ed.to = nb;
            ed.pulse.style.display = "block";
            ed.line.classList.add("hot");
          } else {
            markInfected(nb);
          }
        });
      });
    }

    let raf = 0;
    function animate() {
      edgeEls.forEach((ed) => {
        if (!ed.active) return;
        ed.t += 0.035;
        const from = byId[ed.from];
        const to = byId[ed.to];
        const x = from.x + (to.x - from.x) * ed.t;
        const y = from.y + (to.y - from.y) * ed.t;
        ed.pulse.setAttribute("cx", x);
        ed.pulse.setAttribute("cy", y);
        if (ed.t >= 1) {
          ed.active = false;
          ed.pulse.style.display = "none";
          ed.line.classList.remove("hot");
          markInfected(ed.to);
        }
      });
      // подсветка заражённых рёбер
      edgeEls.forEach((ed) => {
        if (infected.has(ed.a) && infected.has(ed.b)) ed.line.classList.add("burn");
      });
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    waveTimer = E.every(waveStep, 1100);
    E.later(waveStep, 600);

    function cleanup() {
      cancelAnimationFrame(raf);
      // E.every IDs are in Engine T set — clearAll on exit; stop via finished flag
    }

    function win(msg) {
      if (finished) return;
      finished = true;
      stage.timer.stop();
      cleanup();
      score += 80; // бонус за удержание ядра
      hud.querySelector("#lnStat").textContent = "удержано";
      hud.querySelector("#lnStat").style.color = "var(--ok)";
      stage.feedback(true, "Сеть устояла!", msg);
      E.later(() => ctx.done({ score, detail: { shielded, need, win: true } }), 1300);
    }

    function lose(msg) {
      if (finished) return;
      finished = true;
      stage.timer.stop();
      cleanup();
      hud.querySelector("#lnStat").textContent = "прорыв";
      hud.querySelector("#lnStat").style.color = "var(--danger)";
      stage.feedback(false, "Прорыв!", msg);
      E.later(
        () =>
          ctx.done({
            score: Math.max(0, score),
            detail: { shielded, need, win: false },
          }),
        1400
      );
    }

    foot.querySelector("#lnDone").addEventListener("click", () => {
      if (shielded >= need) win("Готово — дыры закрыты");
      else lose("Остались открытые узлы");
    });

    stage.timer.start(28, () => {
      if (shielded >= need && !infected.has("core")) win("Время вышло — ядро цело");
      else if (!infected.has("core") && shielded > 0)
        lose("Не все дыры закрыты");
      else lose("Волна прорвала периметр");
    });
  }
};
