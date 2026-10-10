/* ============================================================
   SVG line-art иконки. Все рисуются currentColor.
   ============================================================ */
(function () {
  const S = (p, extra) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${
      extra || ""
    }>${p}</svg>`;

  const Icons = {
    // --- игры ---
    phishing: S(
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/><path d="M16 14c0 1.5 1 2.5 2.5 2.5S21 15.5 21 14v-1.5"/>'
    ),
    passwords: S(
      '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>'
    ),
    logs: S(
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l2.5 2L7 13"/><path d="M12 14h5"/>'
    ),
    incident: S(
      '<path d="M12 3l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'
    ),
    cipher: S(
      '<circle cx="8" cy="12" r="3.2"/><path d="M11 12h9"/><path d="M16 12v3"/><path d="M19 12v2.4"/>'
    ),
    network: S(
      '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v4m0 0l-5 5m5-5l5 5"/>'
    ),
    social: S(
      '<path d="M4 5h16v10H9l-4 4z"/><path d="M8 9h8M8 12h5"/>'
    ),
    detective: S(
      '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/><path d="M8.5 10.5a2 2 0 0 1 2-2"/>'
    ),
    patches: S(
      '<path d="M14.5 4.5a3.5 3.5 0 0 0-4.9 4.9L4 15v4h4l5.6-5.6a3.5 3.5 0 0 0 4.9-4.9l-2.5 2.5-2-2z"/>'
    ),
    firewall: S(
      '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M3 14.5h18M9 4v5m6 0V4M6.5 9v5.5m5.5 0V9m5.5 5.5V9M12 14.5V20"/>'
    ),
    attackmap: S(
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 2.5 3 15 0 18M12 3c-3 2.5-3 15 0 18"/>'
    ),
    globe: S(
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 2.5 3 15 0 18M12 3c-3 2.5-3 15 0 18"/>'
    ),

    // --- интерфейс ---
    phone: S(
      '<path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'
    ),
    mail: S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    check: S('<path d="M4 12.5l5 5 11-11"/>'),
    arrow: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    arrowDown: S('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    back: S('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    trophy: S(
      '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/><path d="M12 13v4M9 20h6M10 17h4"/>'
    ),
    info: S('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>'),
    bolt: S('<path d="M13 3L5 13h5l-1 8 8-10h-5z"/>'),
    shield: S('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'),
    award: S('<circle cx="12" cy="9" r="5"/><path d="M9 13.5L8 21l4-2 4 2-1-7.5"/>'),
    close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
    user: S('<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>'),
    play: S('<path d="M7 5l12 7-12 7z"/>'),
    clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    target: S('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>'),
    flag: S('<path d="M5 21V4h11l-2 4 2 4H5"/>'),
    download: S('<path d="M12 4v10m0 0l-4-4m4 4l4-4"/><path d="M5 20h14"/>'),
    server: S('<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M8 7.5h.01M8 16.5h.01"/>'),
    wifi: S('<path d="M4 9a13 13 0 0 1 16 0M7 12.5a8 8 0 0 1 10 0M10 16a3 3 0 0 1 4 0"/><circle cx="12" cy="19" r=".7" fill="currentColor"/>'),
    laptop: S('<rect x="5" y="5" width="14" height="9" rx="1"/><path d="M3 18h18"/>'),
    key: S('<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H20l-2 2m-2-2v2"/>'),
    sparkle: S('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
  };

  window.Icons = Icons;

  // Заменяет пустые <span class="i-NAME"> на соответствующий SVG.
  window.hydrateIcons = function (scope) {
    const root = scope || document;
    root.querySelectorAll('[class*="i-"]').forEach((el) => {
      if (el.dataset.ico === "done") return;
      const cls = [...el.classList].find((c) => c.startsWith("i-"));
      if (!cls) return;
      const name = cls.slice(2);
      if (Icons[name]) {
        el.innerHTML = Icons[name];
        el.dataset.ico = "done";
      }
    });
  };
})();
