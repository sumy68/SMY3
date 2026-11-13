/* Über uns: die rote Linie der Story füllt sich beim Scrollen, die Rakete fliegt mit */
(function () {
  'use strict';
  var bahn = document.querySelector('.story__bahn');
  if (!bahn) return;
  var kapitel = [].slice.call(bahn.querySelectorAll('.story__kapitel'));
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bahn.classList.add('ist-aktiv');
  var linie = bahn.querySelector('.story__linie');
  var punkte = [].slice.call(bahn.querySelectorAll('.story__punkt'));
  function setzen() {
    var r = bahn.getBoundingClientRect(), mitte = innerHeight * 0.55;
    // Linie genau durch die Punkte legen, vom ersten bis zum letzten
    var a = punkte[0].getBoundingClientRect(), z = punkte[punkte.length - 1].getBoundingClientRect();
    linie.style.left = (a.left + a.width / 2 - r.left - 1) + 'px';
    linie.style.top = (a.top + a.height / 2 - r.top) + 'px';
    linie.style.height = (z.top - a.top) + 'px';
    linie.style.bottom = 'auto';
    var lr = linie.getBoundingClientRect();
    var p = ruhig ? 1 : Math.min(1, Math.max(0, (mitte - lr.top) / Math.max(1, lr.height)));
    bahn.style.setProperty('--fort', p.toFixed(4));
    kapitel.forEach(function (k) {
      var kr = k.getBoundingClientRect();
      k.classList.toggle('ist-da', ruhig || kr.top + 30 < mitte);
    });
  }
  addEventListener('scroll', setzen, { passive: true });
  addEventListener('resize', setzen);
  setzen();
})();
