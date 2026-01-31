// ==============================
// HEADER LADEN
// ==============================
fetch('/partials/header.html')
  .then(r => r.text())
  .then(html => {
    document.body.insertAdjacentHTML('afterbegin', html);
  });


// ==============================
// FOOTER LADEN
// ==============================
fetch('/partials/footer.html')
  .then(r => r.text())
  .then(html => {
    document.body.insertAdjacentHTML('beforeend', html);

    const footer = document.querySelector('.footer-curtain');
    const yearEl = document.getElementById('wq-year');

    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    if (footer) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            footer.classList.add('is-visible');
          }
        },
        { threshold: 0.2 }
      );

      obs.observe(footer);
    }
  });


// ==============================
// MOBILE NAV TOGGLE
// ==============================
document.addEventListener('click', (e) => {
  const toggle = document.querySelector('.wq-nav-toggle');
  const nav = document.querySelector('.wq-nav');
  if (!toggle || !nav) return;

  if (toggle.contains(e.target)) {
    nav.classList.toggle('is-open');
    toggle.setAttribute(
      'aria-expanded',
      nav.classList.contains('is-open')
    );
  }
});


// ==============================
// HERO ROTATING WORD (FUNKT SAFE)
// ==============================
(() => {
  const words = [
    "designen",
    "entwickeln",
    "drucken",
    "optimieren",
    "vermarkten"
  ];

  const el = document.getElementById("wqWord");
  if (!el) return;

  let i = 0;

  el.textContent = words[i];
  el.classList.add("wq-word-in");

  setInterval(() => {
    el.classList.remove("wq-word-in");
    el.classList.add("wq-word-out");

    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];

      el.classList.remove("wq-word-out");
      el.classList.add("wq-word-in");
    }, 280);
  }, 1500);
})();

// ==============================
// REVEAL + STAGGER + COUNTERS
// ==============================
(() => {
    const revealEls = Array.from(document.querySelectorAll('.wq-reveal'));
    if (!revealEls.length) return;
  
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
    const runCounter = (box) => {
      const target = Number(box.getAttribute('data-count') || '0');
      const suffix = box.getAttribute('data-suffix') || '';
      const numEl = box.querySelector('.wq-stat__num');
      if (!numEl || !target) return;
  
      if (box.__counted) return;
      box.__counted = true;
  
      if (prefersReduced) {
        numEl.textContent = `${target}${suffix}`;
        return;
      }
  
      const duration = 900; // ms
      const start = performance.now();
      const from = 0;
  
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(from + (target - from) * eased);
        numEl.textContent = `${val}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      };
  
      requestAnimationFrame(tick);
    };
  
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
  
        const el = entry.target;
  
        // stagger innerhalb eines Parents mit data-stagger
        const parent = el.closest('[data-stagger]');
        if (parent) {
          const siblings = Array.from(parent.querySelectorAll('.wq-reveal'));
          const idx = siblings.indexOf(el);
          const delay = prefersReduced ? 0 : Math.max(0, idx) * 110;
          el.style.transitionDelay = `${delay}ms`;
        }
  
        el.classList.add('is-visible');
  
        // counter wenn’s ein stat ist
        if (el.classList.contains('wq-stat')) {
          runCounter(el);
        }
  
        io.unobserve(el);
      });
    }, { threshold: 0.18 });
  
    revealEls.forEach(el => io.observe(el));
  })();
  
  (() => {
    const wrap = document.querySelector('[data-parallax="proof"]');
    if (!wrap) return;
  
    const cards = Array.from(wrap.querySelectorAll('.wq-proof__card'));
    if (!cards.length) return;
  
    let raf = 0;
  
    const update = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 800;
  
      const start = vh * 0.9;
      const end = -vh * 0.7;
      const t = (start - rect.top) / (start - end);
      const p = Math.max(0, Math.min(1, t));
  
      const base = 140; // subtil wie screenshot
  
      cards.forEach((card, idx) => {
        const depth = Number(card.getAttribute('data-depth') || (0.5 + idx * 0.12));
        const y = (p * base * depth) - (base * depth * 0.5);
        card.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      });
    };
  
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    update();
  })();
  
  /* =========================
   USE CASES FILTER
========================= */
(function () {
    const pills = document.querySelectorAll(".uc-pill");
    const cards = document.querySelectorAll(".uc-card");
  
    if (!pills.length || !cards.length) return;
  
    function setActive(btn) {
      pills.forEach(p => p.classList.remove("is-active"));
      btn.classList.add("is-active");
    }
  
    function applyFilter(filter) {
      cards.forEach(card => {
        const cat = card.getAttribute("data-cat");
        card.style.display = (filter === "all" || cat === filter) ? "" : "none";
      });
    }
  
    pills.forEach(btn => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");
        setActive(btn);
        applyFilter(filter);
      });
    });
  })();
  
  