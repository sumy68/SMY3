/* ============================================================
   SMY AGENCY — SIGNATURE SHOWCASE
   Scroll-getriebene Animationen (vanilla JS, keine Libraries).
   - Setzt pro Akt die CSS-Variable --p (0 → 1) anhand der
     Scroll-Position, während die Bühne „gepinnt" ist.
   - Spawnt schwebende Likes/Hearts beim Handy.
   - SVG-Pfadlängen für den „Zeichnen"-Effekt der Leinwand.
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

  var acts = Array.prototype.slice.call(document.querySelectorAll('.sc-act'));
  if (!acts.length) return;

  /* ── 1. SVG-Pfade vorbereiten (Zeichnen-Effekt) ───────── */
  document.querySelectorAll('.sc-draw').forEach(function (path) {
    try {
      var len = Math.ceil(path.getTotalLength());
      path.style.setProperty('--len', len);
    } catch (e) { /* Pfad evtl. noch nicht messbar – Default greift */ }
  });

  if (prefersReduced) {
    acts.forEach(function (a) { a.style.setProperty('--p', '1'); });
    return;
  }

  /* ── 2. Scroll → --p pro Akt ──────────────────────────── */
  var ticking = false;
  var vh = window.innerHeight;

  var update = function () {
    ticking = false;
    for (var i = 0; i < acts.length; i++) {
      var act = acts[i];
      var rect = act.getBoundingClientRect();
      var total = rect.height - vh;            // Strecke, die „gepinnt" gescrollt wird
      if (total <= 0) { act.style.setProperty('--p', '1'); continue; }
      // Früher starten: Animation beginnt, sobald der Akt ~halb im Viewport ist,
      // und ist schon bei ~70 % der Pin-Strecke fertig → fühlt sich „sofort" an.
      var lead = vh * 0.55;
      var p = clamp((-rect.top + lead) / (total * 0.6 + lead), 0, 1);
      act.style.setProperty('--p', p.toFixed(4));
      act.classList.toggle('is-active', rect.top < vh * 0.5 && rect.bottom > vh * 0.5);
    }
  };

  var onScroll = function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; update(); }, { passive: true });
  update();

  /* ── 3. Videos erst abspielen, wenn sichtbar (Performance) ─ */
  var videos = document.querySelectorAll('.sc-phone__screen video');
  if (videos.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { v.play && v.play().catch(function () {}); }
        else { v.pause && v.pause(); }
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { vio.observe(v); });
  }

  /* ── 4. Schwebende Hearts/Likes beim Handy ────────────── */
  var burst = document.querySelector('.sc-burst');
  var socialAct = document.querySelector('.sc-act--social');
  if (burst && socialAct) {
    var HEART = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.6 1.9 5 5.3 5c2 0 3.3 1.1 4.2 2.4C10.4 6.1 11.7 5 13.7 5c3.4 0 4.9 3.6 3.3 6.8C19.5 16.4 12 21 12 21z"/></svg>';
    var spawnTimer = null;

    var spawn = function () {
      var i = document.createElement('i');
      i.innerHTML = HEART;
      var left = 20 + Math.random() * 55;      // % über die Breite
      var dur = 2400 + Math.random() * 1400;
      var drift = (Math.random() - 0.5) * 40;
      i.style.left = left + '%';
      i.style.setProperty('--drift', drift + 'px');
      i.style.animation = 'sc-heart ' + dur + 'ms ease-out forwards';
      i.style.fontSize = (0.8 + Math.random() * 0.6) + 'rem';
      burst.appendChild(i);
      setTimeout(function () { i.remove(); }, dur + 60);
    };

    var sio = new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      if (visible && !spawnTimer) {
        spawn();
        spawnTimer = setInterval(spawn, 650);
      } else if (!visible && spawnTimer) {
        clearInterval(spawnTimer);
        spawnTimer = null;
      }
    }, { threshold: 0.3 });
    sio.observe(socialAct);
  }
})();
