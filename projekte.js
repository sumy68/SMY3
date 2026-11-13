/* Projekte-Seite: Filter nach Bereich (ohne JavaScript ist die ganze Liste sichtbar) */
(function () {
  'use strict';
  var leiste = document.querySelector('.ds-pfilter');
  var zeilen = [].slice.call(document.querySelectorAll('.ds-prow'));
  if (!leiste || !zeilen.length) return;
  var knoepfe = [].slice.call(leiste.querySelectorAll('.ds-pfilter__btn'));
  leiste.hidden = false;
  knoepfe.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      knoepfe.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      zeilen.forEach(function (z) {
        var an = f === 'alle' || z.getAttribute('data-bereich') === f;
        z.classList.toggle('is-aus', !an);
        z.hidden = !an;
      });
    });
  });
})();
