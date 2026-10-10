/* 06 — Собери безопасную сеть.
   Не «нажми красное», а выбери правильную меру защиты для проблемы. */
window.GameModules.network = function (root, ctx) {
  const E = window.Engine;
  const cases = E.pick(window.Banks.networkCases || [], 4);

  E.quiz(root, ctx, {
    id: "network",
    title: "Собери безопасную сеть",
    kicker: "Инфраструктура · что закрыть",
    goal: "У сети колледжа типичные дыры. Для каждой проблемы выбери правильное действие защитника — не «наугад по цвету».",
    timed: 28,
    perRound: 90,
    rules: [
      {
        ic: "shield",
        tone: "gold",
        t: "Читай <b>проблему</b> (открытый порт, слабый пароль, гостевой Wi‑Fi…). Это реальные кейсы админа.",
      },
      {
        ic: "check",
        tone: "ok",
        t: "Выбери <b>верную меру</b>: закрыть порт, включить MFA, обновить, сегментировать. Верно: <b>+90</b>.",
      },
      {
        ic: "close",
        tone: "bad",
        t: "Ошибочный ответ подсветит правильный — так запомнишь, почему так делают. На раунд — <b>28 с</b>.",
      },
    ],
    rounds: cases.map((c) => ({
      prompt: c.asset,
      sub: c.problem,
      options: c.options.map((o) => ({
        label: o.label,
        ok: !!o.ok,
        hint: o.hint,
      })),
    })),
  });
};
