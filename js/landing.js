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

  /* ---------- Карточки игр на лендинге ---------- */
  const lg = $("#landingGames");
  if (lg) {
    cfg.games.forEach((g) => {
      const card = document.createElement("div");
      card.className = "gc panel";
      card.setAttribute("data-reveal", "");
      card.setAttribute("data-tilt", "6");
      card.innerHTML = `
        <div class="gc-num">${g.num}</div>
        <div class="gc-ic">${Icons[g.id] || Icons.shield}</div>
        <h3>${g.title}</h3>
        <p>${g.blurb}</p>`;
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
