/* 05 — Расшифруй сигнал. Подбери сдвиг шифра Цезаря. */
window.GameModules.cipher = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "cipher",
      title: "Расшифруй сигнал",
      kicker: "Перехват · шифр Цезаря",
      goal: "Подбери сдвиг алфавита, пока из «каши» не получится настоящее слово.",
      rules: [
        { ic: "cipher", tone: "gold", t: "Крути ползунок <b>сдвига ключа</b> — буквы сдвигаются по кругу (шифр Цезаря)." },
        { ic: "check", tone: "ok", t: "Когда в правом окне читается слово — жми <b>Расшифровано</b>. Верно: <b>+100</b>." },
        { ic: "clock", tone: "warn", t: "Три раунда, на каждый — <b>30 секунд</b>. Есть подсказка-смысл слова." },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
  const A = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const N = A.length;
  const words = E.pick(window.Banks.cipher, 3);

  function enc(str, k) {
    return [...str]
      .map((ch) => {
        const i = A.indexOf(ch);
        return i < 0 ? ch : A[(i + k) % N];
      })
      .join("");
  }
  function dec(str, k) {
    return [...str]
      .map((ch) => {
        const i = A.indexOf(ch);
        return i < 0 ? ch : A[(i - k + N) % N];
      })
      .join("");
  }

  const stage = E.buildStage(root, {
    id: "cipher",
    title: "Расшифруй сигнал",
    kicker: "Перехват · шифр Цезаря",
    rounds: words.length,
    timed: true,
  });

  let idx = 0,
    score = 0,
    correct = 0;

  function render() {
    stage.setActive(idx);
    const w = words[idx];
    const shift = 3 + Math.floor(Math.random() * (N - 6));
    const cipher = enc(w.text, shift);

    stage.body.innerHTML = "";
    stage.body.appendChild(
      E.el(
        `<div><div class="q-prompt">Перехвачен сигнал</div>
         <div class="q-sub">Подсказка: ${w.hint}. Крути сдвиг, пока не получится слово.</div></div>`
      )
    );

    const wrap = E.el(`
      <div class="cipher-wrap">
        <div class="cipher-io">
          <div class="cipher-box">${cipher}</div>
          <div class="cipher-box out" id="cOut"></div>
        </div>
        <div class="alpha-wheel" id="cWheel"></div>
        <div class="cipher-slider">
          <div class="row" style="justify-content:space-between">
            <span class="pw-label">Сдвиг ключа</span>
            <span class="cs-val" id="cVal">0</span>
          </div>
          <input type="range" min="0" max="${N - 1}" value="0" id="cRange" />
        </div>
      </div>`);
    stage.body.appendChild(wrap);

    const foot = E.el(
      `<div class="stage-foot"><span class="chip"><span class="dot"></span> Раунд ${
        idx + 1
      } из ${words.length}</span><button class="btn btn-primary" id="cGo">Расшифровано <span class="i-arrow"></span></button></div>`
    );
    stage.body.appendChild(foot);
    window.hydrateIcons(stage.body);

    const out = wrap.querySelector("#cOut");
    const val = wrap.querySelector("#cVal");
    const range = wrap.querySelector("#cRange");
    const wheel = wrap.querySelector("#cWheel");
    [...A].forEach((ch) => wheel.appendChild(E.el(`<span>${ch}</span>`)));

    function update() {
      const k = +range.value;
      val.textContent = k;
      out.textContent = dec(cipher, k);
      [...wheel.children].forEach((el, i) => {
        el.classList.toggle("hot", i === (0 + k) % N);
      });
    }
    range.addEventListener("input", update);
    update();

    function submit(timeout) {
      stage.timer.stop();
      range.disabled = true;
      foot.querySelector("#cGo").disabled = true;
      const ok = out.textContent === w.text;
      if (ok) {
        score += 100;
        correct++;
        stage.dot(idx, "ok");
        stage.feedback(true, "Сигнал ясен!", w.text);
        stage.fly(100, foot.querySelector("#cGo"));
      } else {
        stage.dot(idx, "bad");
        out.textContent = w.text;
        stage.feedback(false, timeout ? "Время!" : "Не совсем", "Правильно: " + w.text);
      }
      idx++;
      E.later(() => {
        if (idx >= words.length) ctx.done({ score, detail: { correct, total: words.length } });
        else render();
      }, 1500);
    }

    foot.querySelector("#cGo").addEventListener("click", () => submit(false));
    stage.timer.start(30, () => submit(true));
  }

  render();
  }
};
