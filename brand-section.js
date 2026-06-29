/* ============================================================
   SMY AGENCY — BRAND SECTION MOTION (JS)  (#services)
   Cursor-Spotlight (--mx/--my) + sanfter 3D-Tilt für die
   Service-Cards. Vanilla JS, respektiert reduced-motion & Touch.
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  if (prefersReduced || !canHover) return;

  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var cards = document.querySelectorAll('#services .ds-card');
  if (!cards.length) return;

  var MAX_TILT = 8; // Grad

  cards.forEach(function (card) {
    var raf = null;
    var pending = null;

    var apply = function () {
      raf = null;
      if (!pending) return;
      var r = pending.r, x = pending.x, y = pending.y;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      var rx = (x / r.width - 0.5);
      var ry = (y / r.height - 0.5);
      var rotY = clamp(rx * MAX_TILT * 2, -MAX_TILT, MAX_TILT);
      var rotX = clamp(-ry * MAX_TILT * 2, -MAX_TILT, MAX_TILT);
      card.style.transform =
        'translateY(-6px) scale(1.015) rotateX(' + rotX.toFixed(2) +
        'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
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
