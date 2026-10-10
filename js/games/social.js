/* 07 — Социальный инженер · переписка со шкалой подозрения и «печатает…». */
window.GameModules.social = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "social",
      title: "Социальный инженер",
      kicker: "Входящее сообщение",
      goal: "Тебе пишет «коллега». Отвечай так, чтобы не выдать пароль, код и детали защиты.",
      rules: [
        { ic: "social", tone: "warn", t: "Выбирай безопасный ответ. Верно: <b>+90</b>, шкала подозрения падает." },
        { ic: "bolt", tone: "bad", t: "Ошибка — манипулятор ближе к цели, шкала растёт. В конце бонус за низкое подозрение." },
        { ic: "shield", tone: "ok", t: "Золотое правило: пароли, коды из SMS и переходы по чужим ссылкам — <b>никому</b>." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const steps = E.pick(window.Banks.social, 4);

  const stage = E.buildStage(root, {
    id: "social",
    title: "Социальный инженер",
    kicker: "Входящее сообщение",
    rounds: steps.length,
    timed: false,
  });

  stage.body.innerHTML = "";
  stage.body.appendChild(
    E.el(
      `<div><div class="q-prompt">Тебе пишет «коллега»</div>
       <div class="q-sub">Отвечай так, чтобы не выдать ничего ценного</div></div>`
    )
  );
  const susp = E.el(`
    <div class="susp">
      <div class="susp-top"><span>Манипулятор близок к цели</span><b class="mono" id="suspVal">0%</b></div>
      <div class="susp-bar"><i id="suspBar"></i></div>
    </div>`);
  stage.body.appendChild(susp);
  const chat = E.el('<div class="chat" style="margin:10px 0 14px"></div>');
  const optWrap = E.el('<div class="opts"></div>');
  stage.body.appendChild(chat);
  stage.body.appendChild(optWrap);

  let idx = 0,
    score = 0,
    safe = 0,
    suspicion = 0;
  const suspBar = susp.querySelector("#suspBar");
  const suspVal = susp.querySelector("#suspVal");

  function setSusp(v) {
    suspicion = Math.max(0, Math.min(100, v));
    suspBar.style.width = suspicion + "%";
    suspBar.style.background =
      suspicion < 40 ? "var(--ok)" : suspicion < 75 ? "var(--warn)" : "var(--danger)";
    suspVal.textContent = suspicion + "%";
  }
  setSusp(0);

  function bubble(side, text) {
    const b = E.el(`<div class="bubble ${side}">${text}</div>`);
    chat.appendChild(b);
    chat.scrollTop = chat.scrollHeight;
    return b;
  }
  function typing(cb) {
    const t = E.el('<div class="bubble them typing"><span></span><span></span><span></span></div>');
    chat.appendChild(t);
    chat.scrollTop = chat.scrollHeight;
    E.later(() => {
      t.remove();
      cb();
    }, 750);
  }

  function render() {
    stage.setActive(idx);
    const s = steps[idx];
    optWrap.innerHTML = "";
    typing(() => {
      bubble("them", s.them);
      E.shuffle(s.options).forEach((o, i) => {
        const btn = E.el(
          `<button class="opt"><span class="okey">${i + 1}</span><span>${o.label}</span></button>`
        );
        btn.addEventListener("click", () => pick(o, s));
        optWrap.appendChild(btn);
      });
    });
  }

  function pick(o, s) {
    bubble("me", o.label);
    optWrap.innerHTML = "";
    if (o.ok) {
      score += 90;
      safe++;
      setSusp(suspicion - 12);
      stage.dot(idx, "ok");
      stage.feedback(true, "Молодец!", s.hint);
    } else {
      setSusp(suspicion + 34);
      stage.dot(idx, "bad");
      stage.feedback(false, "Утечка!", s.hint);
    }
    idx++;
    E.later(() => {
      if (idx >= steps.length) {
        typing(() => {
          bubble(
            "them",
            safe === steps.length
              ? "Чёрт, с тобой не вышло."
              : "Спасибо, этого достаточно..."
          );
          const bonus = Math.round((100 - suspicion) * 0.6);
          E.later(
            () => ctx.done({ score: score + bonus, detail: { safe, total: steps.length, suspicion } }),
            1100
          );
        });
      } else render();
    }, 900);
  }

  render();
  }
};
