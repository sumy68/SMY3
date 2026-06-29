/* ============================================================
   SMY AGENCY — SUBPAGES PREMIUM LAYER (JS)
   · injiziert animierte Aurora in jeden Page-Hero
   · Cursor-Spotlight (--mx/--my) + sanfter 3D-Tilt auf Cards
   Vanilla JS, respektiert prefers-reduced-motion & Touch.
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

  /* ── 1. Aurora in Page-Heros ──────────────────────────── */
  document.querySelectorAll('.ds-page-hero').forEach(function (hero) {
    if (hero.querySelector('.sp-aurora')) return;
    var aurora = document.createElement('div');
    aurora.className = 'sp-aurora';
    aurora.setAttribute('aria-hidden', 'true');
    aurora.innerHTML = '<i></i><i></i>';
    hero.insertBefore(aurora, hero.firstChild);
  });

  if (prefersReduced || !canHover) return;

  /* ── 2. Card-Spotlight + 3D-Tilt ──────────────────────── */
  var cards = document.querySelectorAll('.ds-card, .ds-featured');
  var MAX_TILT = 6; // Grad

  cards.forEach(function (card) {
    var raf = null;
    var pending = null;

    var apply = function () {
      raf = null;
      if (!pending) return;
      var r = pending.r, x = pending.x, y = pending.y;
      // Spotlight-Position (px relativ zur Karte)
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      // Tilt: Cursor-Offset von der Mitte → Rotation
      var rx = (x / r.width - 0.5);
      var ry = (y / r.height - 0.5);
      var rotY = clamp(rx * MAX_TILT * 2, -MAX_TILT, MAX_TILT);
      var rotX = clamp(-ry * MAX_TILT * 2, -MAX_TILT, MAX_TILT);
      card.style.transform =
        'translateY(-6px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
    };

    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      pending = { r: r, x: e.clientX - r.left, y: e.clientY - r.top };
      if (!raf) raf = window.requestAnimationFrame(apply);
    });

    card.addEventListener('mouseleave', function () {
      pending = null;
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
      card.style.transform = '';
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });
})();
