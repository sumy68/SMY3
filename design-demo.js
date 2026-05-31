/* ============================================================
   SMY AGENCY — DEMO INTERACTIONS
   Vanilla JS, keine Libraries.
   - 3D-Laptop klappt beim Scrollen auf
   - Custom-Cursor-Glow folgt der Maus
   - Magnetische Buttons
   - Scroll-Reveals (IntersectionObserver)
   - Stat-Counter (Count-up)
   - Header-Hintergrund beim Scrollen
   - Rotierendes Hero-Wort
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

  /* ── 1. Hero-Partikelnetz (Canvas, KI-Vibe) ───────────── */
  var canvas = document.querySelector('.hero-particles');
  if (canvas && canvas.getContext && !prefersReduced) {
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [];
    var LINK_DIST = 130;        // max. Abstand für Verbindungslinien
    var MOUSE_DIST = 200;       // Reichweite des Cursors
    var mouse = { x: -9999, y: -9999, active: false };
    var RED = [225, 6, 0];

    var sizeFor = function () {
      // Dichte abhängig von Fläche, gedeckelt für Performance
      return clamp(Math.round((w * h) / 14000), 28, 90);
    };

    var build = function () {
      var rect = hero.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = sizeFor();
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.8
        });
      }
    };

    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // sanfte Anziehung Richtung Cursor
        if (mouse.active) {
          var mdx = mouse.x - n.x, mdy = mouse.y - n.y;
          var md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < MOUSE_DIST && md > 0.5) {
            var pull = (1 - md / MOUSE_DIST) * 0.6;
            n.x += (mdx / md) * pull;
            n.y += (mdy / md) * pull;
          }
        }
        // Punkt
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,80,70,0.9)';
        ctx.fill();
      }

      // Verbindungslinien
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            var op = (1 - dist / LINK_DIST) * 0.32;
            ctx.strokeStyle = 'rgba(' + RED[0] + ',' + RED[1] + ',' + RED[2] + ',' + op + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }

      // Linien zum Cursor (heller, „verbindet" sich mit dem Netz)
      if (mouse.active) {
        for (var c = 0; c < nodes.length; c++) {
          var ddx = nodes[c].x - mouse.x, ddy = nodes[c].y - mouse.y;
          var dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < MOUSE_DIST) {
            ctx.strokeStyle = 'rgba(255,60,50,' + (1 - dd / MOUSE_DIST) * 0.5 + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[c].x, nodes[c].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
      window.requestAnimationFrame(draw);
    };

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    hero.addEventListener('mouseleave', function () { mouse.active = false; });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    });

    build();
    draw();
  }

  /* ── 2. Custom-Cursor-Glow ────────────────────────────── */
  var glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(hover: hover)').matches) {
    var gx = 0, gy = 0, cx = 0, cy = 0;
    document.body.classList.add('cursor-active');
    window.addEventListener('mousemove', function (e) {
      gx = e.clientX; gy = e.clientY;
    }, { passive: true });
    var renderGlow = function () {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      window.requestAnimationFrame(renderGlow);
    };
    renderGlow();
  }

  /* ── 3. Magnetische Buttons ───────────────────────────── */
  if (!prefersReduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (mx * 0.25) + 'px,' + (my * 0.35) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ── 4. Scroll-Reveals ────────────────────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── 5. Stat-Counter ──────────────────────────────────── */
  var counted = false;
  var counters = document.querySelectorAll('[data-count]');
  var runCount = function () {
    if (counted || !counters.length) return;
    counted = true;
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1400, start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = clamp((ts - start) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    });
  };
  var statsEl = document.querySelector('.ds-stats');
  if (statsEl && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { runCount(); sio.disconnect(); }
    }, { threshold: 0.4 });
    sio.observe(statsEl);
  } else { runCount(); }

  /* ── 6. Header beim Scrollen ──────────────────────────── */
  var header = document.querySelector('.ds-header');
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();
  }

  /* ── 6b. Mobile-Navigation (Hamburger) ────────────────── */
  var nav = document.querySelector('.ds-header .ds-nav');
  var navLinks = document.querySelector('.ds-header .ds-nav__links');
  if (nav && navLinks) {
    var burger = document.createElement('button');
    burger.className = 'ds-burger';
    burger.setAttribute('aria-label', 'Menü öffnen');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(burger);

    var setMenu = function (open) {
      navLinks.classList.toggle('is-open', open);
      burger.classList.toggle('is-active', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    };
    burger.addEventListener('click', function () {
      setMenu(!navLinks.classList.contains('is-open'));
    });
    // beim Klick auf einen Link das Menü schließen
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  /* ── 7. Rotierendes Hero-Wort ─────────────────────────── */
  var word = document.getElementById('rotatingWord');
  if (word) {
    var words = ['designen', 'entwickeln', 'vermarkten', 'optimieren'];
    var i = 0;
    word.style.transition = 'opacity 240ms ease';
    setInterval(function () {
      i = (i + 1) % words.length;
      word.style.opacity = '0';
      setTimeout(function () {
        word.textContent = words[i];
        word.style.opacity = '1';
      }, 240);
    }, 2400);
  }
})();
