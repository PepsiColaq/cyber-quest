/* ============================================================
   Движок игрового стенда. Строительные блоки для всех мини-игр:
   шапка со счётчиком раундов и SVG-таймером, фидбек-тост,
   вылет очков, утилиты. Каждая игра регистрируется в
   window.GameModules[id] = function(root, ctx).
   ============================================================ */
window.GameModules = window.GameModules || {};

window.Engine = (function () {
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // Трекаем таймеры игры, чтобы гасить их при смене/выходе (стенд, idle-reset).
  const T = new Set();
  function later(fn, ms) {
    const id = setTimeout(() => {
      T.delete(id);
      fn();
    }, ms);
    T.add(id);
    return id;
  }
  function every(fn, ms) {
    const id = setInterval(fn, ms);
    T.add(id);
    return id;
  }
  function clearAll() {
    T.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    T.clear();
    const fb = document.getElementById("feedback");
    if (fb) fb.classList.remove("show");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Случайная выборка без повторов (для банков заданий). */
  function pick(arr, n) {
    if (!arr || !arr.length) return [];
    const k = Math.min(n == null ? arr.length : n, arr.length);
    return shuffle(arr).slice(0, k);
  }

  const Icons = window.Icons;

  /* ---- Фидбек-тост (один на страницу) ---- */
  let fbTimer = null;
  function feedback(ok, title, text) {
    const fb = document.getElementById("feedback");
    if (!fb) return;
    fb.classList.remove("ok", "bad");
    fb.classList.add(ok ? "ok" : "bad");
    fb.querySelector(".fb-ic").innerHTML = ok ? Icons.check : Icons.close;
    document.getElementById("fbTitle").textContent = title || (ok ? "Верно!" : "Мимо");
    document.getElementById("fbText").textContent = text || "";
    fb.classList.add("show");
    clearTimeout(fbTimer);
    fbTimer = setTimeout(() => fb.classList.remove("show"), 1600);
  }

  /* ---- Вылет очков ---- */
  function fly(amount, anchor) {
    const node = el(
      `<div class="score-fly ${amount >= 0 ? "plus" : "minus"}">${
        amount >= 0 ? "+" : ""
      }${amount}</div>`
    );
    const r = (anchor || document.body).getBoundingClientRect();
    node.style.left = (anchor ? r.left + r.width / 2 : window.innerWidth / 2) + "px";
    node.style.top = (anchor ? r.top : window.innerHeight / 2) + "px";
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 1000);
  }

  /* ---- Шапка стенда ---- */
  function buildStage(root, opts) {
    opts = opts || {};
    const rounds = opts.rounds || 0;
    root.innerHTML = "";

    const top = el(`
      <div class="stage-top">
        <div class="stage-id">
          <div class="st-ic">${Icons[opts.id] || Icons.shield}</div>
          <div class="st-meta">
            <b>${opts.title || ""}</b>
            <span>${opts.kicker || ""}</span>
          </div>
        </div>
        <div class="row gap-md">
          <div class="round-dots"></div>
        </div>
      </div>`);
    root.appendChild(top);

    const dotsWrap = top.querySelector(".round-dots");
    const dots = [];
    for (let i = 0; i < rounds; i++) {
      const d = el('<i></i>');
      dotsWrap.appendChild(d);
      dots.push(d);
    }

    // таймер-кольцо (опционально)
    let timer = null;
    if (opts.timed) {
      const ring = el(`
        <div class="timer-ring">
          <svg viewBox="0 0 58 58">
            <circle class="track" cx="29" cy="29" r="25"></circle>
            <circle class="bar" cx="29" cy="29" r="25"></circle>
          </svg>
          <div class="tnum">0</div>
        </div>`);
      top.querySelector(".row").insertBefore(ring, dotsWrap);
      const bar = ring.querySelector(".bar");
      const num = ring.querySelector(".tnum");
      const C = 2 * Math.PI * 25;
      bar.style.strokeDasharray = C;
      bar.style.strokeDashoffset = 0;
      let left = 0,
        total = 0,
        iv = null,
        onEnd = null;
      timer = {
        el: ring,
        start(sec, cb) {
          total = left = sec;
          onEnd = cb;
          num.textContent = left;
          bar.style.strokeDashoffset = 0;
          ring.classList.remove("warn");
          clearInterval(iv);
          iv = every(() => {
            left--;
            num.textContent = Math.max(0, left);
            bar.style.strokeDashoffset = C * (1 - left / total);
            if (left <= 5) ring.classList.add("warn");
            if (left <= 0) {
              clearInterval(iv);
              onEnd && onEnd();
            }
          }, 1000);
        },
        stop() {
          clearInterval(iv);
        },
        get left() {
          return left;
        },
      };
    }

    const body = el('<div class="stage-body panel"></div>');
    root.appendChild(body);

    const api = {
      root,
      body,
      timer,
      dot(i, status) {
        const d = dots[i];
        if (!d) return;
        d.classList.remove("on", "ok", "bad");
        if (status) d.classList.add(status);
      },
      setActive(i) {
        dots.forEach((d, k) => {
          if (!d.classList.contains("ok") && !d.classList.contains("bad"))
            d.classList.toggle("on", k === i);
        });
      },
      feedback,
      fly,
    };
    return api;
  }

  /* ---- Мини-обучение: экран «Как играть» перед стартом игры ----
     opts: { id, title, kicker, goal, cta, rules:[{ic, tone, t}] }
     onStart() вызывается по клику на кнопку (там игра строит стенд). */
  function intro(root, opts, onStart) {
    opts = opts || {};
    root.innerHTML = "";
    const rules = (opts.rules || [])
      .map(
        (r) => `
        <div class="gi-rule">
          <span class="gi-chip ${r.tone || ""}">${Icons[r.ic] || Icons.info}</span>
          <div>${r.t}</div>
        </div>`
      )
      .join("");
    const wrap = el(`
      <div class="game-intro">
        <div class="gi-head">
          <div class="st-ic">${Icons[opts.id] || Icons.shield}</div>
          <div class="st-meta">
            <b>${opts.title || ""}</b>
            <span>${opts.kicker || ""}</span>
          </div>
        </div>
        <div class="gi-card">
          <div class="gi-badge">${Icons.info}<span>Мини-обучение</span></div>
          <div class="gi-title">Как играть</div>
          ${opts.goal ? `<div class="gi-goal">${opts.goal}</div>` : ""}
          <div class="gi-rules">${rules}</div>
          <button class="btn btn-primary gi-go">${opts.cta || "Понятно, начать"} <span class="i-arrow"></span></button>
        </div>
      </div>`);
    root.appendChild(wrap);
    if (window.hydrateIcons) window.hydrateIcons(root);
    wrap.querySelector(".gi-go").addEventListener("click", () => {
      wrap.classList.add("gone");
      later(() => onStart(), 240);
    });
  }

  /* ---- Хелпер «викторина раундами» (для простых игр) ---- */
  function quiz(root, ctx, spec) {
    // spec: { id, title, kicker, perRound, intro, rounds:[{prompt, sub, options:[{label,ok,key,hint}]}] }
    const run = () => quizRun(root, ctx, spec);
    if (spec.skipIntro) return run();
    intro(
      root,
      {
        id: spec.id,
        title: spec.title,
        kicker: spec.kicker,
        goal: spec.goal,
        cta: spec.cta,
        rules: spec.rules || [
          { ic: "check", tone: "ok", t: "Выбери <b>верный ответ</b> — получишь очки и короткий разбор, зачем так." },
          { ic: "close", tone: "bad", t: "Ошибка подсветит правильный вариант. Учись на ходу." },
          {
            ic: "clock",
            tone: "gold",
            t: spec.timed
              ? `На каждый раунд — <b>${spec.timed} секунд</b>. Не успел — раунд пропускается.`
              : "Отвечай спокойно — таймера нет.",
          },
        ],
      },
      run
    );
  }

  function quizRun(root, ctx, spec) {
    const rounds = spec.rounds;
    const stage = buildStage(root, {
      id: spec.id,
      title: spec.title,
      kicker: spec.kicker,
      rounds: rounds.length,
      timed: spec.timed,
    });
    let idx = 0,
      score = 0,
      correct = 0;

    function renderRound() {
      stage.setActive(idx);
      const r = rounds[idx];
      stage.body.innerHTML = "";
      const head = el(
        `<div><div class="q-prompt">${r.prompt}</div>${
          r.sub ? `<div class="q-sub">${r.sub}</div>` : ""
        }</div>`
      );
      stage.body.appendChild(head);
      if (r.html) stage.body.appendChild(el(r.html));
      const opts = el(
        `<div class="opts ${r.cols === 2 ? "cols-2" : ""}"></div>`
      );
      const shuffled = spec.keepOrder ? r.options : shuffle(r.options);
      shuffled.forEach((o, i) => {
        const key = o.key || String.fromCharCode(65 + i);
        const btn = el(
          `<button class="opt"><span class="okey">${key}</span><span>${o.label}</span></button>`
        );
        btn.addEventListener("click", () => pick(btn, o, opts, r));
        opts.appendChild(btn);
      });
      stage.body.appendChild(opts);
      if (spec.timed && stage.timer) {
        stage.timer.start(spec.timed, () => {
          lockAll(opts);
          stage.feedback(false, "Время!", "Раунд пропущен");
          stage.dot(idx, "bad");
          next();
        });
      }
    }

    function lockAll(opts) {
      opts.querySelectorAll(".opt").forEach((b) => b.classList.add("locked"));
    }

    let advancing = false;

    function pick(btn, o, opts, r) {
      if (btn.classList.contains("locked") || advancing) return;
      if (stage.timer) stage.timer.stop();
      lockAll(opts);
      const pts = spec.perRound || 100;
      if (o.ok) {
        btn.classList.add("correct");
        score += pts;
        correct++;
        stage.dot(idx, "ok");
        stage.feedback(true, "Верно!", o.hint || r.okHint || "");
        stage.fly(pts, btn);
      } else {
        btn.classList.add("wrong");
        stage.dot(idx, "bad");
        // подсветить правильный
        opts.querySelectorAll(".opt").forEach((b) => {
          const label = b.querySelector("span:last-child").textContent;
          const match = r.options.find((x) => x.label === label);
          if (match && match.ok) b.classList.add("correct");
        });
        stage.feedback(false, "Не то", o.hint || r.badHint || "");
      }
      next();
    }

    function next() {
      if (advancing) return;
      advancing = true;
      if (stage.timer) stage.timer.stop();
      idx++;
      later(() => {
        advancing = false;
        if (idx >= rounds.length) {
          ctx.done({
            score,
            detail: { correct, total: rounds.length },
          });
        } else {
          renderRound();
        }
      }, 1100);
    }

    renderRound();
  }

  return { el, shuffle, pick, buildStage, quiz, quizRun, intro, feedback, fly, later, every, clearAll, Icons };
})();
