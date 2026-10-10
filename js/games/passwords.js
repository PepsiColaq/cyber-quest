/* 02 — Крепость пароля · «Кузница пароля».
   Собери пароль из блоков и смотри, как растёт стойкость и время взлома. */
window.GameModules.passwords = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "passwords",
      title: "Крепость пароля",
      kicker: "Кузница · собери стойкий пароль",
      goal: "Собери пароль из блоков и смотри, как растёт стойкость и время взлома.",
      rules: [
        { ic: "key", tone: "gold", t: "Жми блоки: <b>+слово</b>, <b>+ЗАГЛАВНАЯ</b>, <b>+цифры</b>, <b>+символ</b>. Чем длиннее и разнообразнее — тем лучше." },
        { ic: "check", tone: "ok", t: "Цель — зелёная зона («крепкий» / «неприступный»). За длину от 16 символов — бонус." },
        { ic: "clock", tone: "warn", t: "На сборку — <b>45 секунд</b>. Когда готов — кнопка «Готово»." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const words = ["river", "tiger", "orbit", "maple", "zebra", "comet", "lemon", "night"];
  const syms = "!@#$%&?*+=";
  let pw = "";

  function rnd(a) {
    return a[Math.floor(Math.random() * a.length)];
  }

  function analyze(p) {
    let charset = 0;
    if (/[a-z]/.test(p)) charset += 26;
    if (/[A-Z]/.test(p)) charset += 26;
    if (/[0-9]/.test(p)) charset += 10;
    if (/[^A-Za-z0-9]/.test(p)) charset += 30;
    const bits = p.length * (charset ? Math.log2(charset) : 0);
    const seconds = charset ? Math.pow(2, bits) / 1e10 : 0;
    // стойкость 0..100 — по битам энтропии (0..90 бит)
    let s = Math.min(100, Math.round((bits / 90) * 100));
    const weak = ["123", "qwerty", "password", "admin"];
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
    kicker: "Кузница · собери стойкий пароль",
    rounds: 0,
    timed: true,
  });

  stage.body.innerHTML = "";
  stage.body.appendChild(
    E.el(
      `<div><div class="q-prompt">Выкуй неприступный пароль</div>
       <div class="q-sub">Добавляй блоки — следи за шкалой и временем взлома. Цель — зелёная зона.</div></div>`
    )
  );

  const forge = E.el(`
    <div class="forge">
      <div class="forge-pw"><span id="pwText" class="mono"></span><span class="pw-caret"></span></div>
      <div class="pw-meter"><i id="pwBar"></i></div>
      <div class="forge-stats">
        <span class="pw-label" id="pwLab">—</span>
        <span class="forge-crack">Взлом: <b id="pwCrack" class="mono">—</b></span>
      </div>
      <div class="forge-blocks">
        <button class="forge-b" data-act="word">+ слово</button>
        <button class="forge-b" data-act="upper">+ ЗАГЛАВНАЯ</button>
        <button class="forge-b" data-act="num">+ цифры</button>
        <button class="forge-b" data-act="sym">+ символ</button>
        <button class="forge-b" data-act="len">+ длиннее</button>
        <button class="forge-b ghost" data-act="back">⌫</button>
        <button class="forge-b ghost" data-act="reset">сброс</button>
      </div>
    </div>`);
  stage.body.appendChild(forge);

  const foot = E.el(
    `<div class="stage-foot"><div class="hint" style="margin:0"><span class="i-info"></span><span>Длинная фраза со спецсимволами надёжнее короткого «сложного» пароля.</span></div><button class="btn btn-primary" id="pwDone">Готово <span class="i-arrow"></span></button></div>`
  );
  stage.body.appendChild(foot);
  window.hydrateIcons(stage.body);

  const pwText = forge.querySelector("#pwText");
  const bar = forge.querySelector("#pwBar");
  const lab = forge.querySelector("#pwLab");
  const crack = forge.querySelector("#pwCrack");

  function update() {
    pwText.textContent = pw || "";
    const a = analyze(pw);
    bar.style.width = a.s + "%";
    bar.style.background = color(a.s);
    lab.textContent = pw ? label(a.s) : "—";
    lab.style.color = color(a.s);
    crack.textContent = pw ? human(a.seconds) : "—";
  }

  forge.querySelectorAll(".forge-b").forEach((b) => {
    b.addEventListener("click", () => {
      const act = b.dataset.act;
      if (act === "word") pw += rnd(words);
      else if (act === "upper") pw += rnd(words).replace(/^./, (c) => c.toUpperCase());
      else if (act === "num") pw += Math.floor(100 + Math.random() * 900);
      else if (act === "sym") pw += rnd(syms.split(""));
      else if (act === "len") pw += rnd(words) + rnd(syms.split(""));
      else if (act === "back") pw = pw.slice(0, -1);
      else if (act === "reset") pw = "";
      if (pw.length > 40) pw = pw.slice(0, 40);
      update();
    });
  });
  update();

  let done = false;
  function finish(timeout) {
    if (done) return;
    done = true;
    stage.timer.stop();
    const a = analyze(pw);
    let score = Math.round(a.s * 2.6);
    if (pw.length >= 16) score += 25;
    forge.querySelectorAll(".forge-b").forEach((b) => (b.disabled = true));
    foot.querySelector("#pwDone").disabled = true;
    stage.feedback(a.s >= 70, label(a.s) + " пароль", "Взлом: " + human(a.seconds));
    E.later(() => ctx.done({ score, detail: { strength: a.s, len: pw.length } }), 1300);
  }
  foot.querySelector("#pwDone").addEventListener("click", () => finish(false));
  stage.timer.start(45, () => finish(true));
  }
};
