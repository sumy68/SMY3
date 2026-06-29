/* ============================================================
   SMY AGENCY — ROTER FADEN (Services-Timeline) JS
   · füllt die rote Linie scroll-getrieben (--thread 0→1)
   · lässt Knoten aufleuchten, sobald der Faden sie erreicht
   · enthüllt jede Station beim Reinscrollen
   Vanilla JS, respektiert prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var thread = document.querySelector('.thread');
  if (!thread) return;

  var steps = Array.prototype.slice.call(thread.querySelectorAll('.thread__step'));
  var nodes = steps.map(function (s) { return s.querySelector('.thread__node'); });
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

  /* Motion läuft bewusst auf allen Geräten (Mobile = Desktop). */

  /* Stationen enthüllen */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    steps.forEach(function (s) { io.observe(s); });
  } else {
    steps.forEach(function (s) { s.classList.add('is-in'); });
  }

  /* Faden-Fortschritt + Knoten-Leuchten */
  var vh = window.innerHeight;
  var ticking = false;

  var update = function () {
    ticking = false;
    var r = thread.getBoundingClientRect();
    var mid = vh * 0.55;                          // „Lesepunkt" etwas über der Mitte
    var p = clamp((mid - r.top) / r.height, 0, 1);
    thread.style.setProperty('--thread', p.toFixed(4));
    for (var i = 0; i < nodes.length; i++) {
      var nr = nodes[i].getBoundingClientRect();
      steps[i].classList.toggle('is-lit', (nr.top + nr.height / 2) <= mid);
    }
  };

  var onScroll = function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; update(); }, { passive: true });
  update();
})();
