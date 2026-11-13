/* Projekte-Seite: Filter nach Bereich + 3D-Karussell.
   Ohne JavaScript bleibt die normale Liste sichtbar. */
(function () {
  'use strict';
  var liste = document.querySelector('.ds-plist');
  var leiste = document.querySelector('.ds-pfilter');
  var alle = [].slice.call(document.querySelectorAll('.ds-prow'));
  if (!liste || !alle.length) return;
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Bühne aufbauen
  var buehne = document.createElement('div');
  buehne.className = 'ds-karussell';
  liste.parentNode.insertBefore(buehne, liste);
  buehne.appendChild(liste);
  liste.classList.add('ds-plist--karussell');
  liste.setAttribute('aria-roledescription', 'Karussell');

  var steuer = document.createElement('div');
  steuer.className = 'ds-karussell__steuer';
  steuer.innerHTML = '<button type="button" class="ds-karussell__pfeil" data-r="-1" aria-label="Vorheriges Projekt">‹</button>' +
    '<span class="ds-karussell__zahl" aria-live="polite"></span>' +
    '<button type="button" class="ds-karussell__pfeil" data-r="1" aria-label="Nächstes Projekt">›</button>';
  buehne.parentNode.insertBefore(steuer, buehne.nextSibling);
  var zahl = steuer.querySelector('.ds-karussell__zahl');

  // Monogramm je Karte
  alle.forEach(function (z) {
    var name = (z.querySelector('.ds-prow__name') || z).textContent.trim();
    var m = document.createElement('span');
    m.className = 'ds-prow__mono';
    m.setAttribute('aria-hidden', 'true');
    m.textContent = name.charAt(0);
    z.insertBefore(m, z.firstChild);
    z.tabIndex = -1;
  });

  var karten = alle.slice(), winkel = 0, ziel = 0, schritt = 360 / karten.length;
  var radius = 0, ziehen = null, pause = false, letzteAktion = 0;

  function radiusBerechnen() {
    var breite = karten[0] ? karten[0].offsetWidth : 280;
    var n = Math.max(karten.length, 3);
    radius = Math.round((breite + 34) / (2 * Math.tan(Math.PI / n)));
    radius = Math.max(radius, breite * 0.9);
    buehne.style.setProperty('--radius', radius + 'px');
  }

  function aufstellen() {
    schritt = 360 / Math.max(karten.length, 1);
    karten.forEach(function (k, i) { k.style.setProperty('--w', (i * schritt) + 'deg'); });
    radiusBerechnen();
  }

  function vorneIndex() {
    var n = karten.length;
    return ((Math.round(-winkel / schritt) % n) + n) % n;
  }

  function zeichnen() {
    liste.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + winkel + 'deg)';
    var vorne = vorneIndex();
    karten.forEach(function (k, i) {
      var rel = ((i * schritt + winkel) % 360 + 540) % 360 - 180; // −180…180
      var nah = Math.cos(rel * Math.PI / 180);                     // 1 vorne, −1 hinten
      k.style.opacity = Math.max(0.12, (nah + 1) / 2).toFixed(3);
      k.style.zIndex = Math.round((nah + 1) * 50);
      k.classList.toggle('is-vorne', i === vorne);
      k.setAttribute('aria-hidden', i === vorne ? 'false' : 'true');
    });
    zahl.textContent = (vorne + 1) + ' / ' + karten.length;
  }

  function einrasten() { ziel = Math.round(ziel / schritt) * schritt; }
  function drehen(r) { ziel -= r * schritt; einrasten(); letzteAktion = performance.now(); }

  steuer.addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]');
    if (b) drehen(+b.getAttribute('data-r'));
  });
  buehne.tabIndex = 0;
  buehne.setAttribute('aria-label', 'Alle Projekte, mit Pfeiltasten blättern');
  buehne.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { drehen(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { drehen(-1); e.preventDefault(); }
  });

  // Ziehen mit Maus oder Finger
  buehne.addEventListener('pointerdown', function (e) {
    ziehen = { x: e.clientX, start: ziel, id: e.pointerId, bewegt: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!ziehen || e.pointerId !== ziehen.id) return;
    var dx = e.clientX - ziehen.x;
    if (Math.abs(dx) > 4 && !ziehen.bewegt) { ziehen.bewegt = true; buehne.setPointerCapture && buehne.setPointerCapture(e.pointerId); buehne.classList.add('is-ziehen'); }
    if (ziehen.bewegt) { ziel = ziehen.start + dx * 0.25; letzteAktion = performance.now(); }
  });
  window.addEventListener('pointerup', function () {
    if (!ziehen) return;
    if (ziehen.bewegt) einrasten();
    ziehen = null; buehne.classList.remove('is-ziehen');
  });
  // Klick auf eine Seitenkarte dreht sie nach vorne
  liste.addEventListener('click', function (e) {
    var k = e.target.closest('.ds-prow');
    if (!k || k.classList.contains('is-vorne') || e.target.closest('a')) return;
    var i = karten.indexOf(k), rel = ((i * schritt + winkel) % 360 + 540) % 360 - 180;
    ziel -= rel; einrasten(); letzteAktion = performance.now();
  });
  buehne.addEventListener('mouseenter', function () { pause = true; });
  buehne.addEventListener('mouseleave', function () { pause = false; });

  // Filter
  if (leiste) {
    var knoepfe = [].slice.call(leiste.querySelectorAll('.ds-pfilter__btn'));
    leiste.hidden = false;
    knoepfe.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        knoepfe.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        karten = [];
        alle.forEach(function (z) {
          var an = f === 'alle' || z.getAttribute('data-bereich') === f;
          z.hidden = !an;
          if (an) karten.push(z);
        });
        winkel = ziel = 0;
        aufstellen(); zeichnen();
      });
    });
  }

  window.addEventListener('resize', function () { radiusBerechnen(); zeichnen(); });
  aufstellen(); zeichnen();

  var t0 = performance.now();
  function frame(t) {
    var dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
    // langsames Weiterdrehen, wenn niemand interagiert
    if (!ruhig && !pause && !ziehen && t - letzteAktion > 3500) { ziel -= dt * 6; }
    else if (!ziehen && t - letzteAktion > 3500 && Math.abs(ziel - Math.round(ziel / schritt) * schritt) > 0.01) { einrasten(); }
    var k = ruhig ? 1 : 1 - Math.pow(0.002, dt);
    winkel += (ziel - winkel) * k;
    zeichnen();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
