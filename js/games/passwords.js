/* 02 — Крепость пароля.
   Участник сам вводит пароль; шкала показывает стойкость и время взлома. */
window.GameModules.passwords = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "passwords",
      title: "Крепость пароля",
      kicker: "Кузница · придумай стойкий пароль",
      goal: "Сам введи пароль в поле. Смотри, как растёт стойкость и время взлома.",
      rules: [
        {
          ic: "key",
          tone: "gold",
          t: "Длина и разнообразие важнее «хитрых» замен. Лучше фраза из нескольких слов + цифры и символ.",
        },
        {
          ic: "check",
          tone: "ok",
          t: "Цель — зелёная зона («крепкий» / «неприступный»). От 16 символов — бонус к очкам.",
        },
        {
          ic: "clock",
          tone: "warn",
          t: "На ввод — <b>45 секунд</b>. Когда готов — кнопка «Готово».",
        },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
    function analyze(p) {
      let charset = 0;
      if (/[a-z]/.test(p)) charset += 26;
      if (/[A-Z]/.test(p)) charset += 26;
      if (/[0-9]/.test(p)) charset += 10;
      if (/[^A-Za-z0-9]/.test(p)) charset += 30;
      const bits = p.length * (charset ? Math.log2(charset) : 0);
      const seconds = charset ? Math.pow(2, bits) / 1e10 : 0;
      let s = Math.min(100, Math.round((bits / 90) * 100));
      const weak = [
        "123", "1234", "12345", "123456", "qwerty", "qwert", "password", "pass",
        "admin", "пароль", "login", "welcome", "monkey", "dragon", "letmein",
        "abc123", "111111", "iloveyou", "master", "football", "shadow", "sunshine",
        "princess", "qwertyuiop", "йцукен", "ячсмит", "любовь", "мама", "дата",
      ];
      if (weak.some((w) => p.toLowerCase().includes(w))) s = Math.max(5, s - 40);
      return { s, seconds, bits };
    }
    function color(s) {
      if (s < 35) return "var(--danger)";
      if (s < 70) return "var(--warn)";
      return "var(--ok)";
    }
    function label(s) {
      if (s < 35) return "Слабый";
      if (s < 70) return "Средний";
      if (s < 90) return "Крепкий";
      return "Неприступный";
    }
    function human(sec) {
      if (!isFinite(sec) || sec > 3.15e9 * 1000) return "века";
      if (sec < 1) return "мгновенно";
      if (sec < 60) return Math.round(sec) + " сек";
      if (sec < 3600) return Math.round(sec / 60) + " мин";
      if (sec < 86400) return Math.round(sec / 3600) + " ч";
      if (sec < 2.6e6) return Math.round(sec / 86400) + " дн";
      if (sec < 3.15e7) return Math.round(sec / 2.6e6) + " мес";
      if (sec < 3.15e9) return Math.round(sec / 3.15e7) + " лет";
      return "века";
    }

    const stage = E.buildStage(root, {
      id: "passwords",
      title: "Крепость пароля",
      kicker: "Кузница · придумай стойкий пароль",
      rounds: 0,
      timed: true,
    });

    stage.body.innerHTML = "";
    stage.body.appendChild(
      E.el(
        `<div><div class="q-prompt">Придумай и введи пароль</div>
       <div class="q-sub">Печатай сам — следи за шкалой и временем взлома. Цель — зелёная зона.</div></div>`
      )
    );

    const forge = E.el(`
    <div class="forge">
      <label class="forge-label" for="pwInput">Твой пароль</label>
      <input class="forge-input" id="pwInput" type="text" autocomplete="off" spellcheck="false"
        maxlength="40" placeholder="" />
      <div class="pw-meter"><i id="pwBar"></i></div>
      <div class="forge-stats">
        <span class="pw-label" id="pwLab">—</span>
        <span class="forge-crack">Взлом: <b id="pwCrack" class="mono">—</b></span>
      </div>
      <div class="forge-tips">
        <span>Подсказки:</span>
        <span class="forge-tip">длинная фраза</span>
        <span class="forge-tip">ЗАГЛАВНЫЕ</span>
        <span class="forge-tip">цифры</span>
        <span class="forge-tip">символ !@#</span>
      </div>
    </div>`);
    stage.body.appendChild(forge);

    const foot = E.el(
      `<div class="stage-foot"><div class="hint" style="margin:0"><span class="i-info"></span><span>Не используй настоящий пароль от почты или банка — это учебный стенд.</span></div><button class="btn btn-primary" id="pwDone">Готово <span class="i-arrow"></span></button></div>`
    );
    stage.body.appendChild(foot);
    window.hydrateIcons(stage.body);

    const input = forge.querySelector("#pwInput");
    const bar = forge.querySelector("#pwBar");
    const lab = forge.querySelector("#pwLab");
    const crack = forge.querySelector("#pwCrack");

    function update() {
      const pw = input.value || "";
      const a = analyze(pw);
      bar.style.width = a.s + "%";
      bar.style.background = color(a.s);
      lab.textContent = pw ? label(a.s) : "—";
      lab.style.color = color(a.s);
      crack.textContent = pw ? human(a.seconds) : "—";
    }

    input.addEventListener("input", update);
    update();
    setTimeout(() => input.focus(), 80);

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      stage.timer.stop();
      const pw = input.value || "";
      const a = analyze(pw);
      let score = Math.round(a.s * 2.6);
      if (pw.length >= 16) score += 25;
      input.disabled = true;
      foot.querySelector("#pwDone").disabled = true;
      stage.feedback(a.s >= 70, label(a.s) + " пароль", "Взлом: " + human(a.seconds));
      E.later(() => ctx.done({ score, detail: { strength: a.s, len: pw.length } }), 1300);
    }
    foot.querySelector("#pwDone").addEventListener("click", finish);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish();
    });
    stage.timer.start(45, finish);
  }
};
