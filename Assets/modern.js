/* MBTech · interacciones del portfolio (tema, menú, galerías, visor, cotización) */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const ua = navigator.userAgent || "";
  const inApp = /Instagram|FBAN|FBAV/.test(ua);
  if (inApp) root.classList.add("in-app-browser");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Partículas del hero ---------- */
  function initParticles() {
    if (!window.particlesJS || reduceMotion || inApp) return;
    if (window.pJSDom && window.pJSDom.length) {
      window.pJSDom.forEach((p) => p.pJS.fn.vendors.destroypJS());
      window.pJSDom = [];
    }
    const color = root.dataset.theme === "light" ? "#6a35e8" : "#5cc0ff";
    window.particlesJS("particles-js", {
      particles: {
        number: { value: 60, density: { enable: true, value_area: 900 } },
        color: { value: color },
        shape: { type: "circle" },
        opacity: { value: 0.5 },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: color, opacity: 0.35, width: 1 },
        move: { enable: true, speed: 1.6 },
      },
      interactivity: {
        events: { onhover: { enable: true, mode: "repulse" } },
        modes: { repulse: { distance: 100 } },
      },
      retina_detect: true,
    });
  }

  /* ---------- Tema claro / oscuro ---------- */
  const themeBtn = $("#themeToggle");
  function syncThemeLabel() {
    if (!themeBtn) return;
    const light = root.dataset.theme === "light";
    themeBtn.setAttribute("aria-label", light ? "Cambiar a tema oscuro" : "Cambiar a tema claro");
  }
  syncThemeLabel();
  themeBtn?.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("mbtech-theme", next); } catch (e) { /* sin almacenamiento */ }
    syncThemeLabel();
    initParticles();
  });

  /* ---------- Menú móvil ---------- */
  const menuBtn = $("#menuBtn");
  const menu = $("#menu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  menuBtn?.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  /* ---------- Agendar llamada (Google Calendar) ---------- */
 $("#btnMeet")?.addEventListener("click", () => {
  // Mañana a las 15:00 hora Argentina (18:00 UTC), una hora de duración
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 1);
  start.setUTCHours(18, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent("Reunión con MBTech") +
    "&details=" + encodeURIComponent("Videollamada por Google Meet. Coordinamos el horario por mail o WhatsApp.") +
    "&dates=" + fmt(start) + "/" + fmt(end) +
    "&ctz=" + encodeURIComponent("America/Argentina/Buenos_Aires") +
    "&add=" + encodeURIComponent("mbtechit07@gmail.com");
  window.open(url, "_blank", "noopener");
});

  /* ---------- Galería de promociones ---------- */
  const strip = $("#promoStrip");
  const promoPrev = $("#promoPrev");
  const promoNext = $("#promoNext");
  if (strip && promoPrev && promoNext) {
    const behavior = reduceMotion ? "auto" : "smooth";
    const step = () => Math.max(strip.clientWidth * 0.8, 240);
    const updateArrows = () => {
      promoPrev.disabled = strip.scrollLeft < 4;
      promoNext.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
    };
    promoPrev.addEventListener("click", () => strip.scrollBy({ left: -step(), behavior }));
    promoNext.addEventListener("click", () => strip.scrollBy({ left: step(), behavior }));
    strip.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    window.addEventListener("load", updateArrows);
    updateArrows();

    // los videos solo se reproducen mientras se ven
    const vids = $$("video", strip);
    if (vids.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) en.target.play().catch(() => {});
          else en.target.pause();
        });
      }, { root: strip, threshold: 0.35 });
      vids.forEach((v) => io.observe(v));
    }
  }

  /* ---------- Visor: amplía servicios, proyectos y promociones ---------- */
  const viewer = $("#viewer");
  const viewerBody = $("#viewerBody");
  const viewerPrev = $("#viewerPrev");
  const viewerNext = $("#viewerNext");
  let group = [];
  let index = 0;

  const groupItems = (name) =>
    $$(`[data-group="${name}"]`).filter((el) => !(el.classList.contains("promo") && el.classList.contains("no-img")));

  function show(i) {
    index = (i + group.length) % group.length;
    const el = group[index];
    const detail = $(".detail", el);
    const source = el.classList.contains("no-img") ? null : $("img, video", el);

    viewerBody.textContent = "";
    viewerBody.className = "viewer-body" + (source ? " has-media" : "") + (detail ? " has-text" : "");

    if (source) {
      const media = document.createElement("div");
      media.className = "viewer-media";
      let node;
      if (source.tagName === "VIDEO") {
        node = document.createElement("video");
        node.src = source.currentSrc || source.src;
        node.controls = true;
        node.autoplay = true;
        node.loop = true;
        node.muted = true;
        node.playsInline = true;
      } else {
        node = document.createElement("img");
        node.src = source.currentSrc || source.src;
        node.alt = source.alt || el.dataset.title || "";
      }
      media.append(node);
      viewerBody.append(media);
    }
    if (detail) {
      const text = document.createElement("div");
      text.className = "viewer-text";
      text.innerHTML = detail.innerHTML; // contenido propio de la página
      viewerBody.append(text);
    }
    viewer.setAttribute("aria-label", el.dataset.title || "Detalle");
    const multiple = group.length > 1;
    viewerPrev.hidden = !multiple;
    viewerNext.hidden = !multiple;
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".open");
    if (!trigger) return;
    const item = trigger.closest("[data-group]");
    if (!item) return;
    group = groupItems(item.dataset.group);
    show(group.indexOf(item));
    root.classList.add("lock");
    viewer.showModal();
  });

  viewerPrev?.addEventListener("click", () => show(index - 1));
  viewerNext?.addEventListener("click", () => show(index + 1));
  $("#viewerClose")?.addEventListener("click", () => viewer.close());
  viewer?.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
  viewer?.addEventListener("keydown", (e) => {
    if (group.length < 2) return;
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
  viewer?.addEventListener("close", () => {
    root.classList.remove("lock");
    viewerBody.textContent = ""; // detiene videos
  });

  // deslizar con el dedo para cambiar de imagen
  let touchX = null;
  viewer?.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  viewer?.addEventListener("touchend", (e) => {
    if (touchX === null || group.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------- Cotización ---------- */
  const quote = $("#quote");
  $$("[data-open-quote]").forEach((b) =>
    b.addEventListener("click", () => { root.classList.add("lock"); quote.showModal(); })
  );
  $("#quoteClose")?.addEventListener("click", () => quote.close());
  quote?.addEventListener("click", (e) => { if (e.target === quote) quote.close(); });
  quote?.addEventListener("close", () => root.classList.remove("lock"));

  /* ---------- Inicio ---------- */
  initParticles();
})();
