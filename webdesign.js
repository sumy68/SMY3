/* ──────────────────────────────────────────────────────────────
   webdesign.js — Preiskalkulator + Lead-Capture für /webdesign/
   Live-Preisspanne, schreibt Auswahl in versteckte Formularfelder,
   sendet den Lead per AJAX an Formspree (mit Inline-Erfolgsmeldung).
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var calc = document.getElementById('wd-calc-form');
  var lead = document.getElementById('wd-lead-form');
  if (!calc || !lead) return;

  /* Lesbare Labels für die E-Mail an SMY */
  var LABELS = {
    type:  { neu: 'Neue Website', relaunch: 'Relaunch', onepager: 'Landingpage / Onepager' },
    scope: { '1-3': '1–3 Seiten', '4-8': '4–8 Seiten', '9+': '9+ Seiten' },
    addon: { seo: 'Google-/KI-Sichtbarkeit', karriere: 'Karriere-/Bewerbungsseite', branding: 'Logo / Branding' },
    speed: { standard: 'Standard', express: 'Express (+20 %)' }
  };

  var elLow     = document.getElementById('wd-low');
  var elHigh    = document.getElementById('wd-high');
  var elWartung = document.getElementById('wd-wartung-note');

  /* Euro-Format, ohne Nachkommastellen */
  function euro(n) {
    return n.toLocaleString('de-DE') + ' €';
  }
  /* Auf nächste 50 € runden — wirkt wie ein bewusst kalkulierter Preis */
  function round50(n) {
    return Math.round(n / 50) * 50;
  }

  function selected(name) {
    return calc.querySelector('input[name="' + name + '"]:checked');
  }

  function compute() {
    var typeEl  = selected('type');
    var scopeEl = selected('scope');
    var speedEl = selected('speed');

    var base = 0;
    if (typeEl)  base += parseInt(typeEl.dataset.price, 10) || 0;
    if (scopeEl) base += parseInt(scopeEl.dataset.price, 10) || 0;

    var addonEls = calc.querySelectorAll('input[name="addon"]:checked');
    addonEls.forEach(function (el) { base += parseInt(el.dataset.price, 10) || 0; });

    var rate = speedEl ? (parseFloat(speedEl.dataset.rate) || 0) : 0;
    var total = base * (1 + rate);

    var low  = round50(total * 0.9);
    var high = round50(total * 1.1);

    elLow.textContent  = euro(low);
    elHigh.textContent = euro(high);

    var wartung = calc.querySelector('input[name="wartung"]');
    if (wartung) elWartung.hidden = !wartung.checked;

    return {
      type:  typeEl  ? LABELS.type[typeEl.value]   : '',
      scope: scopeEl ? LABELS.scope[scopeEl.value] : '',
      speed: speedEl ? LABELS.speed[speedEl.value] : '',
      addons: Array.prototype.map.call(addonEls, function (el) { return LABELS.addon[el.value]; }),
      wartung: !!(wartung && wartung.checked),
      range: euro(low) + ' – ' + euro(high)
    };
  }

  /* Versteckte Felder vor dem Absenden befüllen */
  function syncHidden() {
    var s = compute();
    var addons = s.addons.slice();
    if (s.wartung) addons.push('Wartung & Pflege (ab 49 €/Monat)');

    document.getElementById('wd-h-type').value   = s.type;
    document.getElementById('wd-h-scope').value  = s.scope;
    document.getElementById('wd-h-addons').value = addons.length ? addons.join(', ') : 'keine';
    document.getElementById('wd-h-speed').value  = s.speed;
    document.getElementById('wd-h-range').value  = s.range;
  }

  calc.addEventListener('change', compute);
  compute();

  /* ── Lead-Absenden per AJAX (Formspree) ──────────────────── */
  lead.addEventListener('submit', function (e) {
    syncHidden();

    // Native Pflichtfeld-Validierung respektieren
    if (!lead.checkValidity()) return;

    e.preventDefault();
    var btn = lead.querySelector('button[type="submit"]');
    var original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Wird gesendet …'; }

    fetch(lead.action, {
      method: 'POST',
      body: new FormData(lead),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        lead.classList.add('is-sent');
        lead.innerHTML =
          '<span class="wd-result__range" style="display:block;margin-bottom:.5rem;">Danke! ✓</span>' +
          '<p style="color:var(--text-secondary);margin:0;">Ihre Anfrage ist bei uns. Sie erhalten Ihr Angebot inkl. ' +
          'kostenfreiem Design-Entwurf innerhalb von 24 Std. per E-Mail.</p>';
        lead.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error('Formspree ' + res.status);
      }
    }).catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = original; }
      alert('Senden hat nicht geklappt. Bitte schreiben Sie uns direkt an info.smyagency@gmail.com.');
    });
  });
})();
