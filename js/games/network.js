/* 06 — Ночной дежурный SOC · triage алертов по приоритету. */
window.GameModules.network = function (root, ctx) {
  const E = window.Engine;
  E.intro(
    root,
    {
      id: "network",
      title: "Ночной дежурный SOC",
      kicker: "Смена · triage алертов",
      goal: "На стене мониторов вспыхивают алерты. Распредели каждый: Игнор / Смотреть / Критично.",
      rules: [
        {
          ic: "bolt",
          tone: "bad",
          t: "<b>Критично</b> — реальная угроза прямо сейчас (шифровальщик, чужой вход админа, утечка).",
        },
        {
          ic: "clock",
          tone: "warn",
          t: "<b>Смотреть</b> — подозрительно, но не паника: последить, собрать контекст.",
        },
        {
          ic: "check",
          tone: "ok",
          t: "<b>Игнор</b> — шум / плановое / безопасно. Ошибка приоритета: монитор «рвётся», штраф. Раунд: <b>40 сек</b>.",
        },
      ],
    },
    () => play(root, ctx)
  );

  function play(root, ctx) {
    const BANK = [
      {
        title: "Ransomware.Note",
        body: "На файловом сервере появились .LOCKED и записка с выкупом",
        sev: "critical",
        why: "Шифровальщик — изоляция и реакция немедленно",
      },
      {
        title: "Admin@03:14",
        body: "Успешный вход domain\\admin с IP 185.220.x.x (другая страна)",
        sev: "critical",
        why: "Ночной админ из-за рубежа — компрометация учётки",
      },
      {
        title: "DNS → pastebin",
        body: "ПК бухгалтерии шлёт длинные DNS-запросы на странный домен",
        sev: "critical",
        why: "Похоже на скрытый канал утечки данных",
      },
      {
        title: "RDP brute",
        body: "С внешнего IP 400+ FAIL к серверу практики за 2 минуты, затем OK",
        sev: "critical",
        why: "После брутфорса успешный вход — уже внутри",
      },
      {
        title: "USB.Autorun",
        body: "На лаб. ПК запустился неизвестный .exe с флешки «Зарплаты»",
        sev: "critical",
        why: "Классическая доставка вредоноса",
      },
      {
        title: "Mail rule",
        body: "У преподавателя создано скрытое правило: все письма → внешний ящик",
        sev: "critical",
        why: "Тихая пересылка почты — кража переписки",
      },
      {
        title: "New device",
        body: "Вход в почту a.petrov с нового iPhone, город тот же, днём",
        sev: "watch",
        why: "Может быть новый телефон — проверить у человека",
      },
      {
        title: "FAIL×6",
        body: "Шесть неверных паролей к VPN, потом тишина, IP из города кампуса",
        sev: "watch",
        why: "Похоже на опечатки; стоит понаблюдать",
      },
      {
        title: "Port scan",
        body: "Внутренний хост просканировал соседние /24 за 40 секунд",
        sev: "watch",
        why: "Может быть лаба или червь — нужна проверка",
      },
      {
        title: "Odd hours",
        body: "Студент зашёл в LMS в 01:20 — обычно только днём",
        sev: "watch",
        why: "Аномалия режима, но не доказательство взлома",
      },
      {
        title: "Cert warn",
        body: "На сайте колледжа сертификат истекает через 9 дней",
        sev: "watch",
        why: "Плановая задача, не инцидент «прямо сейчас»",
      },
      {
        title: "Backup.OK",
        body: "Ночной бэкап БД завершён, код 0, как каждый день в 02:00",
        sev: "ignore",
        why: "Плановое событие — не тревога",
      },
      {
        title: "AV update",
        body: "Антивирус на 40 ПК обновил базы по расписанию",
        sev: "ignore",
        why: "Штатное обновление",
      },
      {
        title: "Printer jam",
        body: "Принтер в 214: «закончилась бумага»",
        sev: "ignore",
        why: "Не киберинцидент",
      },
      {
        title: "DHCP renew",
        body: "Ноут учителя получил новый IP в той же подсети",
        sev: "ignore",
        why: "Обычная аренда адреса",
      },
      {
        title: "Spam quarantine",
        body: "Фильтр отложил 12 писем «VIAGRA» в карантин",
        sev: "ignore",
        why: "Система уже отработала",
      },
    ];

    const COLS = [
      { id: "ignore", label: "Игнор", hint: "шум / план", tone: "ok" },
      { id: "watch", label: "Смотреть", hint: "подозрительно", tone: "warn" },
      { id: "critical", label: "Критично", hint: "действовать", tone: "bad" },
    ];

    const alerts = E.pick(BANK, 7).map((a, i) => Object.assign({}, a, { uid: "a" + i }));

    const stage = E.buildStage(root, {
      id: "network",
      title: "Ночной дежурный SOC",
      kicker: "Смена · triage алертов · 40 сек",
      rounds: 0,
      timed: true,
    });

    stage.body.innerHTML = "";
    stage.body.appendChild(
      E.el(
        `<div>
          <div class="q-prompt">Стена алертов</div>
          <div class="q-sub">Перетащи монитор в колонку или тапни монитор → колонку. Верный приоритет: <b>+70</b>.</div>
        </div>`
      )
    );

    const hud = E.el(
      `<div class="patch-hud">
        <span>Разобрано: <b id="socDone">0</b>/${alerts.length}</span>
        <span>Верно: <b id="socOk" style="color:var(--ok)">0</b></span>
        <span>Ошибки: <b id="socBad" style="color:var(--danger)">0</b></span>
      </div>`
    );
    stage.body.appendChild(hud);

    const wall = E.el('<div class="soc-wall" id="socWall"></div>');
    stage.body.appendChild(wall);

    const bins = E.el('<div class="soc-bins" id="socBins"></div>');
    COLS.forEach((c) => {
      bins.appendChild(
        E.el(
          `<div class="soc-bin ${c.tone}" data-bin="${c.id}" tabindex="0">
            <b>${c.label}</b>
            <span>${c.hint}</span>
          </div>`
        )
      );
    });
    stage.body.appendChild(bins);

    const foot = E.el(
      `<div class="stage-foot">
        <span class="chip"><span class="dot"></span> Ночная смена SOC</span>
        <button class="btn btn-ghost" id="socDoneBtn" type="button">Завершить смену</button>
      </div>`
    );
    stage.body.appendChild(foot);
    window.hydrateIcons(stage.body);

    const doneEl = hud.querySelector("#socDone");
    const okEl = hud.querySelector("#socOk");
    const badEl = hud.querySelector("#socBad");

    let score = 0,
      okN = 0,
      badN = 0,
      placed = 0,
      running = true,
      selected = null;

    function scramble(len) {
      const chars = "01ABCDEF#$%";
      let s = "";
      for (let i = 0; i < len; i++) s += chars[(Math.random() * chars.length) | 0];
      return s;
    }

    alerts.forEach((a) => {
      const mon = E.el(
        `<div class="soc-mon" draggable="true" data-uid="${a.uid}">
          <div class="soc-bezel">
            <div class="soc-scan"></div>
            <div class="soc-digits" aria-hidden="true">${scramble(18)}</div>
            <div class="soc-tag">${a.title}</div>
            <div class="soc-body">${a.body}</div>
          </div>
        </div>`
      );
      wall.appendChild(mon);

      // бегущие «цифры»
      const dig = mon.querySelector(".soc-digits");
      const tick = E.every(() => {
        if (!mon.isConnected || mon.classList.contains("done")) return;
        dig.textContent = scramble(18);
      }, 180 + ((Math.random() * 120) | 0));

      mon.addEventListener("pointerdown", () => {
        if (!running || mon.classList.contains("done")) return;
        wall.querySelectorAll(".soc-mon").forEach((m) => m.classList.remove("picked"));
        mon.classList.add("picked");
        selected = a.uid;
      });

      mon.addEventListener("dragstart", (e) => {
        if (!running || mon.classList.contains("done")) {
          e.preventDefault();
          return;
        }
        selected = a.uid;
        mon.classList.add("dragging");
        e.dataTransfer.setData("text/plain", a.uid);
        e.dataTransfer.effectAllowed = "move";
      });
      mon.addEventListener("dragend", () => mon.classList.remove("dragging"));
    });

    function findAlert(uid) {
      return alerts.find((x) => x.uid === uid);
    }

    function place(uid, binId, binEl) {
      if (!running) return;
      const a = findAlert(uid);
      const mon = wall.querySelector(`.soc-mon[data-uid="${uid}"]`);
      if (!a || !mon || mon.classList.contains("done")) return;

      mon.classList.add("done");
      mon.classList.remove("picked", "dragging");
      mon.setAttribute("draggable", "false");
      placed++;
      doneEl.textContent = placed;
      selected = null;

      const correct = a.sev === binId;
      if (correct) {
        score += 70;
        okN++;
        okEl.textContent = okN;
        mon.classList.add("soc-ok");
        binEl.classList.add("flash-ok");
        E.later(() => binEl.classList.remove("flash-ok"), 320);
        stage.feedback(true, "Верный приоритет", a.why);
        stage.fly(70, mon);
      } else {
        score = Math.max(0, score - 35);
        badN++;
        badEl.textContent = badN;
        mon.classList.add("soc-boom");
        binEl.classList.add("flash-bad");
        E.later(() => binEl.classList.remove("flash-bad"), 320);
        const right = COLS.find((c) => c.id === a.sev);
        stage.feedback(
          false,
          "Неверный приоритет!",
          a.why + (right ? " → «" + right.label + "»" : "")
        );
        stage.fly(-35, mon);
      }

      if (placed >= alerts.length) finish();
    }

    bins.querySelectorAll(".soc-bin").forEach((bin) => {
      bin.addEventListener("dragover", (e) => {
        e.preventDefault();
        bin.classList.add("over");
      });
      bin.addEventListener("dragleave", () => bin.classList.remove("over"));
      bin.addEventListener("drop", (e) => {
        e.preventDefault();
        bin.classList.remove("over");
        const uid = e.dataTransfer.getData("text/plain") || selected;
        if (uid) place(uid, bin.dataset.bin, bin);
      });
      bin.addEventListener("click", () => {
        if (selected) place(selected, bin.dataset.bin, bin);
      });
    });

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      running = false;
      stage.timer.stop();
      foot.querySelector("#socDoneBtn").disabled = true;
      // бонус за скорость и чистоту
      if (okN === alerts.length) score += 80;
      else if (stage.timer && stage.timer.left > 12) score += 30;
      const title =
        okN === alerts.length
          ? "Смена закрыта идеально"
          : okN >= 5
            ? "Смена удержана"
            : "Смена в огне";
      stage.feedback(okN >= 5, title, `Верно ${okN} из ${alerts.length}`);
      E.later(
        () =>
          ctx.done({
            score: Math.max(0, score),
            detail: { ok: okN, bad: badN, total: alerts.length },
          }),
        1400
      );
    }

    foot.querySelector("#socDoneBtn").addEventListener("click", finish);
    stage.timer.start(40, finish);
  }
};
