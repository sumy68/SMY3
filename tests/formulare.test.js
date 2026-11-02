// Prüft Formspree-Endpunkte und Betreffzeilen, ohne etwas zu versenden. Ausführen mit: node --test tests/formulare.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const KUNDEN_ENDPOINT = 'https://formspree.io/f/movggzpl';
const BEWERBUNG_ENDPOINT = 'https://formspree.io/f/xgaapdaa';

const FORMULARE = [
  ['leads/index.html', 'Anfrage Leads: Lead-Listen'],
  ['services/index.html', 'Projektanfrage Services: Kontaktformular'],
  ['webdesign/index.html', 'Neuer Webdesign-Lead (Preiskalkulator)'],
  ['praxis-demo/index.html', 'Anfrage Praxis-Demo: Praxis-Website'],
  ['website-mieten.html', 'Anfrage Website-Mieten: Analyse'],
  ['leitfaden.html', 'Leitfaden-Fragebogen']
];

const formOf = (html) => {
  const start = html.search(/<form\b[^>]*formspree\.io/);
  return html.slice(start, html.indexOf('</form>', start));
};

FORMULARE.forEach(([file, subject]) => {
  test(`${file} sendet an das Kundenformular mit eigenem Betreff`, () => {
    const html = read(file);
    assert.deepStrictEqual(html.match(/https:\/\/formspree\.io\/f\/\w+/g), [KUNDEN_ENDPOINT]);
    const form = formOf(html);
    assert.ok(form.includes(`name="_subject" value="${subject}"`), subject);
  });
});

test('Betreffzeilen sind eindeutig', () => {
  assert.strictEqual(new Set(FORMULARE.map(([, subject]) => subject)).size, FORMULARE.length);
});

test('Bewerbung sendet an den eigenen Endpunkt', () => {
  const sandbox = { window: {} };
  vm.runInNewContext(read('data/bewerbung-vertrieb.js'), sandbox);
  assert.strictEqual(sandbox.window.SMY_BEWERBUNG.endpoint, BEWERBUNG_ENDPOINT);
});

test('alter Leitfaden-Endpunkt kommt nicht mehr vor', () => {
  [...FORMULARE.map(([file]) => file), 'data/bewerbung-vertrieb.js', 'datenschutz/index.html'].forEach((file) => {
    assert.ok(!read(file).includes('xnqegnbw'), file);
  });
});

test('Datenschutzerklärung nennt den Leitfaden-Fragebogen und keine Formspree-IDs', () => {
  const html = read('datenschutz/index.html');
  assert.ok(html.includes('den Fragebogen zum Social Media Leitfaden'));
  assert.ok(!/formspree\.io\/f\//.test(html));
});

const submitLeitfaden = (name) => {
  const listeners = {};
  const form = {
    elements: { name: { value: name }, _subject: { value: 'Leitfaden-Fragebogen' } },
    addEventListener: (type, handler) => { listeners[type] = handler; }
  };
  const sandbox = {
    document: { getElementById: (id) => (id === 'leitfaden-form' ? form : null) },
    fetch: () => assert.fail('kein echter Versand')
  };
  vm.runInNewContext(read('leitfaden.js'), sandbox);
  listeners.submit();
  return form.elements._subject.value;
};

test('Leitfaden-Betreff enthält den Namen', () => {
  assert.strictEqual(submitLeitfaden('  Alex Beispiel '), 'Leitfaden-Fragebogen: Alex Beispiel');
});

test('leitfaden.html hat Pflichtfeld Name und lädt das Skript', () => {
  const html = read('leitfaden.html');
  assert.ok(/<input type="text" name="name" required/.test(formOf(html)));
  assert.ok(html.includes('<script src="/leitfaden.js"></script>'));
});
