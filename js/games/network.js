/* 06 — Собери безопасную сеть. Закрой уязвимые узлы, не трогая защищённые. */
window.GameModules.network = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "network",
      title: "Собери безопасную сеть",
      kicker: "Инфраструктура · закрой дыры",
      goal: "На схеме сети закрой уязвимые узлы — и не трогай те, что уже защищены.",
      rules: [
        { ic: "bolt", tone: "bad", t: "<b>Красный узел с «!»</b> — дыра. Кликни, чтобы закрыть. <b>+90</b>." },
        { ic: "check", tone: "ok", t: "Зелёный узел уже в порядке. Если кликнешь — штраф <b>−30</b>." },
        { ic: "clock", tone: "gold", t: "Закрой все дыры за <b>30 секунд</b> или жми «Готово»." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const layout = E.pick(window.Banks.networkLayouts, 1)[0];
  const nodes = layout.nodes.map((n) => Object.assign({}, n));
  const wires = layout.wires;

  const stage = E.buildStage(root, {
    id: "network",
    title: "Собери безопасную сеть",
    kicker: "Инфраструктура · закрой дыры",
    rounds: 0,
    timed: true,
  });

  stage.body.innerHTML = "";
  stage.body.appendChild(
    E.el(
      `<div><div class="q-prompt">Закрой уязвимые узлы</div>
       <div class="q-sub">Красные узлы — с дырами. Нажми, чтобы устранить. Защищённые не трогай!</div></div>`
    )
  );

  const field = E.el('<div class="net" style="margin:6px 0 16px"></div>');
  const svg = E.el(
    '<svg class="wires" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>'
  );
  wires.forEach(([a, b]) => {
    const n1 = nodes[a],
      n2 = nodes[b];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", n1.x);
    line.setAttribute("y1", n1.y);
    line.setAttribute("x2", n2.x);
    line.setAttribute("y2", n2.y);
    line.setAttribute("class", "live");
    svg.appendChild(line);
  });
  field.appendChild(svg);

  let vulnLeft = nodes.filter((n) => n.vuln).length;
  let score = 0,
    mistakes = 0;

  nodes.forEach((n) => {
    const node = E.el(`
      <div class="node ${n.vuln ? "vuln" : ""} ${n.safe ? "secured" : ""}" style="left:${n.x}%;top:${n.y}%">
        <div class="nic">${E.Icons[n.ic] || E.Icons.server}</div>
        <b>${n.name}</b>
        ${n.vuln || n.safe ? `<div class="badge">${n.vuln ? "!" : E.Icons.check}</div>` : ""}
      </div>`);
    if (n.vuln) {
      node.title = n.issue;
      node.addEventListener("click", () => {
        if (!n.vuln) return;
        n.vuln = false;
        node.classList.remove("vuln");
        node.classList.add("secured");
        node.querySelector(".badge").innerHTML = E.Icons.check;
        score += 90;
        vulnLeft--;
        stage.feedback(true, "Закрыто!", n.issue);
        stage.fly(90, node);
        if (vulnLeft === 0) finish(false);
      });
    } else if (n.safe) {
      node.addEventListener("click", () => {
        if (node.dataset.hit) return;
        node.dataset.hit = "1";
        mistakes++;
        score -= 30;
        stage.feedback(false, "Стоп!", "Этот узел и так защищён");
        stage.fly(-30, node);
      });
    }
    field.appendChild(node);
  });
  stage.body.appendChild(field);

  const foot = E.el(
    `<div class="stage-foot"><span class="chip"><span class="dot"></span> Устрани все дыры до нуля</span><button class="btn btn-ghost" id="netDone">Готово</button></div>`
  );
  stage.body.appendChild(foot);
  window.hydrateIcons(stage.body);

  let finished = false;
  function finish(timeout) {
    if (finished) return;
    finished = true;
    stage.timer.stop();
    const closed = nodes.filter((n) => n.issue && !n.vuln && !n.safe).length;
    stage.feedback(vulnLeft === 0, vulnLeft === 0 ? "Сеть защищена!" : "Есть дыры", `Ошибок: ${mistakes}`);
    E.later(
      () => ctx.done({ score: Math.max(0, score), detail: { closed, mistakes } }),
      1400
    );
  }
  foot.querySelector("#netDone").addEventListener("click", () => finish(false));
  stage.timer.start(30, () => finish(true));
  }
};
