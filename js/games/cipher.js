/* 05 — Радиоперехват · настрой частоту, пока «каша» не станет словом (Цезарь под капотом). */
window.GameModules.cipher = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "cipher",
      title: "Радиоперехват",
      kicker: "Эфир · поймай чистый сигнал",
      goal: "Крути частоту приёмника. Когда попадёшь в резонанс — из шума проявится слово. Зафиксируй сигнал.",
      rules: [
        {
          ic: "wifi",
          tone: "gold",
          t: "Ползунок — <b>частота</b>. Волна становится ровной, а буквы — читаемыми, когда близко к цели.",
        },
        {
          ic: "check",
          tone: "ok",
          t: "Индикатор <b>LOCK</b> загорится в зоне. Жми <b>Принять сигнал</b>. Верно: <b>+110</b>.",
        },
        {
          ic: "clock",
          tone: "warn",
          t: "Три перехвата, на каждый — <b>32 секунды</b>. Есть короткая подсказка по смыслу слова.",
        },
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
    function scrambleNear(str, noise) {
      if (noise <= 0.08) return str;
      return [...str]
        .map((ch) => {
          if (Math.random() > noise) return ch;
          return A[Math.floor(Math.random() * N)];
        })
        .join("");
    }

    const stage = E.buildStage(root, {
      id: "cipher",
      title: "Радиоперехват",
      kicker: "Эфир · поймай чистый сигнал",
      rounds: words.length,
      timed: true,
    });

    let idx = 0,
      score = 0,
      correct = 0;

    function render() {
      stage.setActive(idx);
      const w = words[idx];
      const shift = 4 + Math.floor(Math.random() * (N - 8));
      const cipher = enc(w.text, shift);
      // частота 0..100, цель около 20..85
      const targetFreq = 18 + Math.floor(Math.random() * 64);

      stage.body.innerHTML = "";
      stage.body.appendChild(
        E.el(
          `<div>
            <div class="q-prompt">Перехват ${idx + 1} · настрой частоту</div>
            <div class="q-sub">Подсказка: ${w.hint}</div>
          </div>`
        )
      );

      const panel = E.el(`
        <div class="radio">
          <div class="radio-glow"></div>
          <div class="radio-top">
            <span class="radio-badge">RX · ENC</span>
            <span class="radio-lock" id="rLock">SEEK</span>
          </div>
          <canvas class="radio-wave" id="rWave" width="640" height="120"></canvas>
          <div class="radio-readout">
            <div class="radio-lab">Сигнал в эфире</div>
            <div class="radio-text" id="rText"></div>
          </div>
          <div class="radio-tune">
            <div class="row" style="justify-content:space-between;width:100%">
              <span>Частота</span>
              <span class="mono" id="rMhz">— МГц</span>
            </div>
            <input type="range" min="0" max="100" value="0" id="rFreq" />
          </div>
        </div>`);
      stage.body.appendChild(panel);

      const foot = E.el(
        `<div class="stage-foot">
          <span class="chip"><span class="dot"></span> Канал ${idx + 1}/${words.length}</span>
          <button class="btn btn-primary" id="rGo" disabled>Принять сигнал <span class="i-arrow"></span></button>
        </div>`
      );
      stage.body.appendChild(foot);
      window.hydrateIcons(stage.body);

      const canvas = panel.querySelector("#rWave");
      const ctx2 = canvas.getContext("2d");
      const textEl = panel.querySelector("#rText");
      const lockEl = panel.querySelector("#rLock");
      const mhz = panel.querySelector("#rMhz");
      const range = panel.querySelector("#rFreq");
      const go = foot.querySelector("#rGo");
      let phase = 0;
      let locked = false;
      let anim = 0;

      function quality(freq) {
        const d = Math.abs(freq - targetFreq);
        return Math.min(1, d / 28);
      }

      function paint(q) {
        const wdt = canvas.width;
        const h = canvas.height;
        ctx2.clearRect(0, 0, wdt, h);
        ctx2.strokeStyle = "rgba(88,224,216,0.08)";
        ctx2.lineWidth = 1;
        for (let x = 0; x < wdt; x += 32) {
          ctx2.beginPath();
          ctx2.moveTo(x, 0);
          ctx2.lineTo(x, h);
          ctx2.stroke();
        }
        for (let y = 0; y < h; y += 24) {
          ctx2.beginPath();
          ctx2.moveTo(0, y);
          ctx2.lineTo(wdt, y);
          ctx2.stroke();
        }
        const amp = 18 + (1 - q) * 28;
        const noise = q * 22;
        const clarity = 1 - q;
        ctx2.beginPath();
        ctx2.lineWidth = 2.2;
        ctx2.strokeStyle =
          clarity > 0.75
            ? "rgba(232,195,106,0.95)"
            : clarity > 0.4
              ? "rgba(88,224,216,0.85)"
              : "rgba(120,140,160,0.55)";
        for (let x = 0; x < wdt; x++) {
          const t = x * 0.045 + phase;
          let y =
            h / 2 +
            Math.sin(t * (1.2 + clarity * 1.6)) * amp * (0.35 + clarity) +
            Math.sin(t * 3.1) * amp * 0.25 * clarity;
          y += (Math.random() - 0.5) * noise;
          if (x === 0) ctx2.moveTo(x, y);
          else ctx2.lineTo(x, y);
        }
        ctx2.stroke();
        if (clarity > 0.7) {
          ctx2.shadowColor = "rgba(232,195,106,0.55)";
          ctx2.shadowBlur = 12;
          ctx2.stroke();
          ctx2.shadowBlur = 0;
        }
      }

      function tick() {
        phase += 0.12 + (1 - quality(+range.value)) * 0.08;
        paint(quality(+range.value));
        anim = requestAnimationFrame(tick);
      }

      function update() {
        const freq = +range.value;
        const q = quality(freq);
        const clarity = 1 - q;
        const shown =
          clarity > 0.82 ? w.text : scrambleNear(cipher, 0.25 + q * 0.75);
        textEl.textContent = shown;
        textEl.classList.toggle("hot", clarity > 0.82);
        mhz.textContent = (88 + freq * 0.2).toFixed(1) + " МГц";
        locked = clarity > 0.82;
        lockEl.textContent = locked ? "LOCK" : clarity > 0.5 ? "SYNC" : "SEEK";
        lockEl.classList.toggle("on", locked);
        panel.classList.toggle("locked", locked);
        go.disabled = !locked;
      }

      range.addEventListener("input", update);
      update();
      anim = requestAnimationFrame(tick);

      function cleanup() {
        cancelAnimationFrame(anim);
      }

      let submitted = false;
      function submit(timeout) {
        if (submitted) return;
        submitted = true;
        stage.timer.stop();
        cleanup();
        range.disabled = true;
        go.disabled = true;
        const ok = locked || textEl.textContent === w.text;
        if (ok) {
          score += 110;
          correct++;
          stage.dot(idx, "ok");
          textEl.textContent = w.text;
          stage.feedback(true, "Сигнал принят!", w.text);
          stage.fly(110, go);
        } else {
          stage.dot(idx, "bad");
          textEl.textContent = w.text;
          stage.feedback(
            false,
            timeout ? "Потерян в эфире" : "Не в резонансе",
            "Нужное слово: " + w.text
          );
        }
        idx++;
        E.later(() => {
          if (idx >= words.length)
            ctx.done({ score, detail: { correct, total: words.length } });
          else render();
        }, 1400);
      }

      go.addEventListener("click", () => submit(false));
      stage.timer.start(32, () => submit(true));
    }

    render();
  }
};
