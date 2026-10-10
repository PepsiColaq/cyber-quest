/* 04 — Реакция на инцидент. Прими верное первое решение. */
window.GameModules.incident = function (root, ctx) {
  const E = window.Engine;
  const cases = E.pick(window.Banks.incident, 5);

  E.quiz(root, ctx, {
    id: "incident",
    title: "Реакция на инцидент",
    kicker: "Раунд · первое решение",
    goal: "Пять коротких сцен. В каждой выбери <b>первый правильный шаг</b> защитника — как на реальном дежурстве.",
    rules: [
      { ic: "incident", tone: "warn", t: "Читай ситуацию и выбирай действие. Правильный ответ даёт <b>+70</b> и короткий разбор." },
      { ic: "close", tone: "bad", t: "Ошибка подсветит верный вариант — это тоже обучение." },
      { ic: "clock", tone: "gold", t: "На раунд — <b>20 секунд</b>. Думай быстро, как в SOC." },
    ],
    perRound: 70,
    timed: 20,
    rounds: cases.map((c) => ({
      prompt: c.prompt,
      sub: c.sub,
      okHint: c.hint,
      badHint: c.hint,
      options: c.options.map((o) => ({ ...o, hint: c.hint })),
    })),
  });
};
