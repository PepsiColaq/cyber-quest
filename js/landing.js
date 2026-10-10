/* ============================================================
   Лендинг-контроллер: сплэш, scroll-снап, прогресс, точки,
   параллакс, карточки игр, кнопки «Начать» / «Пропустить».
   ============================================================ */
(function () {
  const cfg = window.AppConfig;
  const $ = (s) => document.querySelector(s);
  const Icons = window.Icons;

  /* ---------- Splash ---------- */
  function hideSplash() {
    const sp = $("#splash");
    if (sp) sp.classList.add("gone");
  }
  window.addEventListener("load", () => setTimeout(hideSplash, cfg.splashMs || 1500));
  // страховка, если load уже прошёл
  setTimeout(hideSplash, (cfg.splashMs || 1500) + 1200);

  /* ---------- Иконки ---------- */
  window.hydrateIcons(document);

  /* ---------- Контакты приёмной ---------- */
  function fillAdm(linkSel, type) {
    const a = $(linkSel);
    if (!a) return;
    const t = a.querySelector(".t");
    if (type === "phone") {
      a.href = "tel:" + cfg.phone.replace(/[^\d+]/g, "");
      if (t) t.textContent = cfg.phone;
    } else {
      a.href = "mailto:" + cfg.email;
      if (t) t.textContent = cfg.email;
    }
  }
  fillAdm("#admPhone", "phone");
  fillAdm("#admMail", "mail");
  fillAdm("#aboutPhone", "phone");
  fillAdm("#aboutMail", "mail");

  /* ---------- Описание миссии ---------- */
  let giStartHandler = null;
  function closeGameInfo() {
    const m = $("#gameInfoModal");
    if (!m) return;
    m.classList.remove("show");
    m.setAttribute("aria-hidden", "true");
    giStartHandler = null;
  }
  function openGameInfo(g, opts) {
    const m = $("#gameInfoModal");
    if (!m || !g) return;
    $("#giNum").textContent = g.num || "";
    $("#giTitle").textContent = g.title || "";
    $("#giBlurb").textContent = g.blurb || "";
    $("#giAbout").textContent = g.about || g.blurb || "";
    const ic = $("#giIcon");
    ic.innerHTML = Icons[g.id] || Icons.shield || "";
    window.hydrateIcons && window.hydrateIcons(ic);
    const startBtn = $("#giStart");
    if (opts && typeof opts.onStart === "function") {
      startBtn.hidden = false;
      startBtn.innerHTML =
        (opts.startLabel || "Начать миссию") + ' <span class="i-arrow"></span>';
      window.hydrateIcons && window.hydrateIcons(startBtn);
      giStartHandler = opts.onStart;
    } else {
      startBtn.hidden = true;
      giStartHandler = null;
    }
    m.classList.add("show");
    m.setAttribute("aria-hidden", "false");
  }
  window.openGameInfo = openGameInfo;
  window.closeGameInfo = closeGameInfo;

  const giClose = $("#giClose");
  const giStart = $("#giStart");
  const giModal = $("#gameInfoModal");
  if (giClose) giClose.addEventListener("click", closeGameInfo);
  if (giStart)
    giStart.addEventListener("click", () => {
      const fn = giStartHandler;
      closeGameInfo();
      if (fn) fn();
    });
  if (giModal)
    giModal.addEventListener("click", (e) => {
      if (e.target === giModal) closeGameInfo();
    });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeGameInfo();
  });

  /* ---------- Карточки игр на лендинге ---------- */
  const lg = $("#landingGames");
  if (lg) {
    cfg.games.forEach((g) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gc panel";
      card.setAttribute("data-reveal", "");
      card.setAttribute("data-tilt", "6");
      card.setAttribute("aria-label", g.title + ": подробнее");
      card.innerHTML = `
        <div class="gc-num">${g.num}</div>
        <div class="gc-ic">${Icons[g.id] || Icons.shield}</div>
        <h3>${g.title}</h3>
        <p>${g.blurb}</p>
        <div class="gc-more">Подробнее →</div>`;
      card.addEventListener("click", () =>
        openGameInfo(g, {
          startLabel: "Начать квест",
          onStart: () => window.App && window.App.enter(),
        })
      );
      lg.appendChild(card);
    });
  }

  /* ---------- Точки навигации ---------- */
  const sections = [...document.querySelectorAll(".snap-sec")];
  const dotsWrap = $("#lDots");
  const dots = [];
  sections.forEach((sec, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Секция " + (i + 1));
    b.addEventListener("click", () =>
      sec.scrollIntoView({ behavior: "smooth" })
    );
    dotsWrap && dotsWrap.appendChild(b);
    dots.push(b);
  });

  /* ---------- Скролл: прогресс, топбар, активная точка, параллакс ---------- */
  window.Motion && window.Motion.bindParallax(document);
  const lTop = $("#lTop");
  const lProgress = $("#lProgress");
  const topStart = $("#topStart");

  function onScroll() {
    const st = window.scrollY || document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? st / h : 0;
    if (lProgress) lProgress.style.width = (p * 100).toFixed(2) + "%";
    if (lTop) lTop.classList.toggle("scrolled", st > 40);
    if (topStart) topStart.classList.toggle("in", st > window.innerHeight * 0.6);

    // активная секция
    const mid = st + window.innerHeight / 2;
    let active = 0;
    sections.forEach((sec, i) => {
      if (sec.offsetTop <= mid) active = i;
    });
    dots.forEach((d, i) => d.classList.toggle("active", i === active));

    window.Motion && window.Motion.runParallax(st, window.innerHeight);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  document.body.classList.add("snap");
  onScroll();

  // анимация появления + tilt для динамически добавленных карточек
  window.Motion && window.Motion.bindAll(document);

  /* ---------- Кнопки входа в приложение ---------- */
  function enter() {
    window.App && window.App.enter();
  }
  ["#heroStart", "#finaleStart", "#topStart", "#skipBtn"].forEach((sel) => {
    const b = $(sel);
    if (b) b.addEventListener("click", enter);
  });
  const hs = $("#heroScroll");
  if (hs)
    hs.addEventListener("click", () =>
      $("#s-how").scrollIntoView({ behavior: "smooth" })
    );
})();
