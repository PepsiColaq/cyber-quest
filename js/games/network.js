/* 06 — Поддельный портал колледжа · Spot the Clone.
   Полноэкранный «браузер» с фейковым ЛК. Найди 5 красных флагов. */
window.GameModules.network = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "network",
      title: "Поддельный портал",
      kicker: "Spot the Clone · найди 5 отличий",
      goal: "Перед тобой «личный кабинет» колледжа. Он почти настоящий — но это ловушка. Найди все красные флаги.",
      rules: [
        {
          ic: "flag",
          tone: "bad",
          t: "Смотри <b>адресную строку</b>, замок HTTPS, иконку сайта, странные кнопки и баннеры «срочно».",
        },
        {
          ic: "check",
          tone: "ok",
          t: "Кликай только подозрительное. Обычное меню и таблицу пар трогать не надо (−20).",
        },
        {
          ic: "clock",
          tone: "gold",
          t: "На портал — <b>40 секунд</b>. Лупа следует за курсором. Все 5 флагов = крупный бонус.",
        },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
    const portals = [
      {
        tab: "Личный кабинет — Колледж",
        favicon: "💀",
        favWhy: "Чужой favicon вместо герба колледжа",
        lock: "open",
        lockWhy: "Нет замка HTTPS — соединение не защищено",
        protocol: "http://",
        host: "соllege-lk.online",
        hostWhy: "В слове college спрятана кириллическая «с» — поддельный домен",
        path: "/cabinet",
        user: "Иванов А.С. · группа ИС-21",
        foot: "support@соllege-lk.online",
      },
      {
        tab: "Маршал Чуйков · Кабинет",
        favicon: "🔥",
        favWhy: "Favicon не герб колледжа — сигнал чужого сайта",
        lock: "warn",
        lockWhy: "Браузер не доверяет сертификату",
        protocol: "https://",
        host: "chuikov-cabinet.ru.com",
        hostWhy: "Домен .ru.com — не официальный сайт колледжа",
        path: "/student",
        user: "Петрова М.И. · абитуриент",
        foot: "help@chuikov-cabinet.ru.com",
      },
      {
        tab: "Портал практики",
        favicon: "⚠️",
        favWhy: "Предупреждающая иконка вместо бренда колледжа",
        lock: "open",
        lockWhy: "Замка нет: пароль могут перехватить",
        protocol: "http://",
        host: "marshal-chuikov.secure-edu.top",
        hostWhy: "Длинный домен .top — классика фишинговых клонов",
        path: "/lk",
        user: "Сидоров К. · ИБ-22",
        foot: "it@secure-edu.top",
      },
    ];

    const P = E.pick(portals, 1)[0];

    const stage = E.buildStage(root, {
      id: "network",
      title: "Поддельный портал",
      kicker: "Spot the Clone · 40 секунд",
      rounds: 0,
      timed: true,
    });

    stage.body.innerHTML = "";
    stage.body.appendChild(
      E.el(
        `<div>
          <div class="q-prompt">Это настоящий кабинет… или нет?</div>
          <div class="q-sub">Найди <b>5</b> подделок. Лупа увеличивает зону под курсором. Флаги: <b class="mono" id="scFound">0/5</b></div>
        </div>`
      )
    );

    const wrap = E.el('<div class="sc-stage"></div>');
    stage.body.appendChild(wrap);

    const lockHtml =
      P.lock === "warn"
        ? `<span class="sc-lock warn sc-hit" data-flag="1" data-why="${P.lockWhy}">⚠️</span>`
        : `<span class="sc-lock open sc-hit" data-flag="1" data-why="${P.lockWhy}">🔓</span>`;

    const browser = E.el(`
      <div class="sc-browser">
        <div class="sc-chrome">
          <div class="sc-dots"><i></i><i></i><i></i></div>
          <div class="sc-tabs">
            <div class="sc-tab on">
              <span class="sc-fav sc-hit" data-flag="1" data-why="${P.favWhy}">${P.favicon}</span>
              <span class="sc-tab-t">${P.tab}</span>
            </div>
            <div class="sc-tab ghost">Новая вкладка</div>
          </div>
        </div>
        <div class="sc-addr">
          ${lockHtml}
          <div class="sc-url" title="Адресная строка">
            <span class="sc-proto">${P.protocol}</span><span class="sc-host sc-hit" data-flag="1" data-why="${P.hostWhy}">${P.host}</span><span class="sc-path">${P.path}</span>
          </div>
          <div class="sc-addr-tools" aria-hidden="true">☆ ⋯</div>
        </div>
        <div class="sc-viewport" id="scView">
          <div class="sc-lens" id="scLens" hidden></div>
          <aside class="sc-side">
            <div class="sc-brand">
              <div class="sc-logo">К</div>
              <div>
                <b>Колледж им. Чуйкова</b>
                <small>Личный кабинет</small>
              </div>
            </div>
            <nav class="sc-nav">
              <span class="on">Главная</span>
              <span class="sc-decoy" data-flag="0" data-why="Обычный раздел — не флаг">Оценки</span>
              <span class="sc-decoy" data-flag="0" data-why="Обычный раздел — не флаг">Расписание</span>
              <span>Документы</span>
              <span>Сообщения</span>
            </nav>
            <div class="sc-side-foot">Сессия активна · 14:02</div>
          </aside>
          <main class="sc-main">
            <header class="sc-topbar">
              <div>
                <div class="sc-hello">Добро пожаловать</div>
                <div class="sc-user">${P.user}</div>
              </div>
              <div class="sc-top-actions">
                <button type="button" class="sc-ghost sc-decoy" data-flag="0" data-why="Обычная кнопка профиля">Профиль</button>
                <button type="button" class="sc-danger-cta sc-hit" data-flag="1" data-why="Настоящий кабинет не требует пароль всплывающей кнопкой «срочно»">⚠ Срочно подтвердите пароль</button>
              </div>
            </header>

            <div class="sc-banner sc-hit" data-flag="1" data-why="Давление срочностью и призыв «подтвердить» — классика фишинга">
              <b>Внимание!</b> Доступ заблокируют через <em>2 часа</em>.
              <u>Подтвердите личность сейчас →</u>
            </div>

            <section class="sc-cards">
              <div class="sc-card"><span>Средний балл</span><b>4.6</b></div>
              <div class="sc-card"><span>Долги</span><b>0</b></div>
              <div class="sc-card"><span>Сообщения</span><b>3</b></div>
            </section>

            <section class="sc-panel">
              <h3>Ближайшие пары</h3>
              <table class="sc-table">
                <tr><td>09:00</td><td>Информационная безопасность</td><td>ауд. 312</td></tr>
                <tr><td>10:45</td><td>Сети ЭВМ</td><td>ауд. 208</td></tr>
                <tr><td>12:30</td><td>Практика</td><td>лаб. 4</td></tr>
              </table>
            </section>

            <footer class="sc-foot">
              <span>© Колледж им. Маршала В.И. Чуйкова</span>
              · <span class="sc-mail">${P.foot}</span>
            </footer>
          </main>
        </div>
      </div>`);
    wrap.appendChild(browser);

    const foot = E.el(
      `<div class="stage-foot">
        <span class="chip"><span class="dot"></span> Режим инспектора</span>
        <button class="btn btn-ghost" id="scSkip" type="button">Сдать как есть</button>
      </div>`
    );
    stage.body.appendChild(foot);

    const foundEl = stage.body.querySelector("#scFound");
    const view = browser.querySelector("#scView");
    const lens = browser.querySelector("#scLens");
    const flagNodes = [...browser.querySelectorAll(".sc-hit")];
    const NEED = 5;

    let found = 0,
      score = 0,
      running = true,
      finished = false;

    view.addEventListener("pointermove", (e) => {
      if (!running) return;
      const r = view.getBoundingClientRect();
      lens.hidden = false;
      lens.style.left = e.clientX - r.left + "px";
      lens.style.top = e.clientY - r.top + "px";
    });
    view.addEventListener("pointerleave", () => {
      lens.hidden = true;
    });

    function markFound(el) {
      if (el.classList.contains("sc-found")) return;
      el.classList.add("sc-found");
      found++;
      score += 80;
      foundEl.textContent = found + "/" + NEED;
      stage.feedback(true, "Флаг пойман!", el.dataset.why || "");
      stage.fly(80, el);
      if (found >= NEED) {
        score += 120;
        finish(true);
      }
    }

    function onHit(el) {
      if (!running || el.classList.contains("sc-found")) return;
      if (el.dataset.flag === "1") markFound(el);
      else {
        el.classList.add("sc-miss");
        score = Math.max(0, score - 20);
        stage.feedback(false, "Это нормально", el.dataset.why || "Здесь нет подделки");
        stage.fly(-20, el);
        E.later(() => el.classList.remove("sc-miss"), 420);
      }
    }

    browser.querySelectorAll(".sc-hit, .sc-decoy").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onHit(el);
      });
    });

    function revealRest() {
      flagNodes.forEach((f) => {
        if (!f.classList.contains("sc-found")) f.classList.add("sc-reveal");
      });
    }

    function finish(perfect) {
      if (finished) return;
      finished = true;
      running = false;
      stage.timer.stop();
      lens.hidden = true;
      foot.querySelector("#scSkip").disabled = true;
      if (!perfect) revealRest();
      stage.feedback(
        found >= 4,
        found >= NEED ? "Клон разоблачён!" : found >= 3 ? "Почти весь клон" : "Клон ускользнул",
        `Найдено ${found} из ${NEED}`
      );
      E.later(
        () =>
          ctx.done({
            score: Math.max(0, score),
            detail: { found, total: NEED },
          }),
        1500
      );
    }

    foot.querySelector("#scSkip").addEventListener("click", () => finish(false));
    stage.timer.start(40, () => finish(false));
  }
};
