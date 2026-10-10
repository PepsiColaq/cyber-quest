/* ============================================================
   Motion — лёгкий движок анимаций без зависимостей.
   reveal (IntersectionObserver), countUp, parallax, tilt,
   типографический «magnetic» эффект, уважение reduced-motion.
   ============================================================ */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Reveal по появлению в вьюпорте ----------
     Элементы с [data-reveal] плавно всплывают. Поддержка
     задержки через [data-reveal-delay] (мс) и групп через
     родителя [data-reveal-group] (stagger по индексу).      */
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                const el = e.target;
                const d = +(el.dataset.revealDelay || 0);
                setTimeout(() => el.classList.add("in"), reduce ? 0 : d);
                io.unobserve(el);
              }
            });
          },
          { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
        )
      : null;

  function observe(scope) {
    const root = scope || document;
    const items = root.querySelectorAll("[data-reveal]:not(.bound)");
    items.forEach((el, i) => {
      el.classList.add("bound");
      // авто-stagger внутри групп
      const grp = el.closest("[data-reveal-group]");
      if (grp && !el.dataset.revealDelay) {
        const sibs = [...grp.querySelectorAll("[data-reveal]")];
        el.dataset.revealDelay = sibs.indexOf(el) * 80;
      }
      if (!io || reduce) {
        el.classList.add("in");
      } else {
        io.observe(el);
      }
    });
  }

  /* ---------- Счётчик (count up) ---------- */
  function countUp(el, to, opts) {
    opts = opts || {};
    const dur = reduce ? 0 : opts.dur || 1100;
    const dec = opts.decimals || 0;
    const prefix = opts.prefix || "";
    const suffix = opts.suffix || "";
    const start = performance.now();
    const from = +(opts.from || 0);
    function tick(now) {
      const t = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (to - from) * eased;
      el.textContent = prefix + val.toFixed(dec) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // авто-countUp для [data-count] когда появляется
  const countIo =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                const el = e.target;
                countUp(el, +el.dataset.count, {
                  suffix: el.dataset.suffix || "",
                  prefix: el.dataset.prefix || "",
                  decimals: +(el.dataset.decimals || 0),
                });
                countIo.unobserve(el);
              }
            });
          },
          { threshold: 0.5 }
        )
      : null;

  function bindCounters(scope) {
    (scope || document)
      .querySelectorAll("[data-count]:not(.bound-c)")
      .forEach((el) => {
        el.classList.add("bound-c");
        if (!countIo || reduce) {
          el.textContent =
            (el.dataset.prefix || "") +
            el.dataset.count +
            (el.dataset.suffix || "");
        } else {
          countIo.observe(el);
        }
      });
  }

  /* ---------- Parallax по скроллу контейнера ----------
     [data-parallax="0.2"] — коэффициент смещения.          */
  let parallaxEls = [];
  function bindParallax(scope) {
    if (reduce) return;
    const root = scope || document;
    parallaxEls = [...root.querySelectorAll("[data-parallax]")];
  }
  function runParallax(scrollTop, viewportH) {
    if (reduce) return;
    for (const el of parallaxEls) {
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2 - viewportH / 2;
      const k = parseFloat(el.dataset.parallax) || 0.15;
      el.style.transform = `translate3d(0, ${(-center * k).toFixed(1)}px, 0)`;
    }
  }

  /* ---------- Tilt hover (3D наклон карточек) ---------- */
  function bindTilt(scope) {
    if (reduce) return;
    (scope || document)
      .querySelectorAll("[data-tilt]:not(.bound-t)")
      .forEach((el) => {
        el.classList.add("bound-t");
        const max = parseFloat(el.dataset.tilt) || 8;
        el.addEventListener("pointermove", (ev) => {
          const r = el.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width - 0.5;
          const py = (ev.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(900px) rotateY(${(px * max).toFixed(
            2
          )}deg) rotateX(${(-py * max).toFixed(2)}deg) translateZ(0)`;
          el.style.setProperty("--mx", (px * 100 + 50).toFixed(1) + "%");
          el.style.setProperty("--my", (py * 100 + 50).toFixed(1) + "%");
        });
        el.addEventListener("pointerleave", () => {
          el.style.transform = "";
        });
      });
  }

  /* ---------- Разбивка заголовка на буквы для анимации ---------- */
  function splitChars(el) {
    if (el.dataset.split === "done") return;
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--i", i);
      span.textContent = ch === " " ? "\u00A0" : ch;
      el.appendChild(span);
    });
    el.dataset.split = "done";
  }

  /* ---------- Публичный API ---------- */
  window.Motion = {
    reduce,
    observe,
    countUp,
    bindCounters,
    bindParallax,
    runParallax,
    bindTilt,
    splitChars,
    bindAll(scope) {
      observe(scope);
      bindCounters(scope);
      bindTilt(scope);
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.Motion.bindAll(document);
  });
})();
