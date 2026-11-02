// Prüft rechtliche Texte und statische Korrekturen. Ausführen mit: node --test tests/rechtliches.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const TODO = (placeholder) => `<!-- TODO PRÜFEN --><mark class="ds-legal__todo">${placeholder}</mark>`;

test('leads verspricht keine Nicht-Weitergabe mehr und verlinkt die Datenschutzerklärung', () => {
  const html = read('leads/index.html');
  assert.ok(!html.includes('Keine Weitergabe an Dritte'));
  assert.ok(html.includes('Ihre Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet. Details in unserer <a href="/datenschutz/"'));
  assert.ok(html.includes('>Datenschutzerklärung</a>.'));
});

test('Datenschutzerklärung nennt Brevo und PayPal mit markierten Platzhaltern', () => {
  const html = read('datenschutz/index.html');
  assert.ok(html.indexOf('5.4 Formspree') < html.indexOf('5.5 Brevo'));
  assert.ok(html.indexOf('5.5 Brevo') < html.indexOf('5.6 PayPal'));
  [
    '[Brevo Firmierung/Anschrift]', '[Rechtsgrundlage Drittlandtransfer Brevo]', '[AV-Vertrag Brevo]',
    '[PayPal Firmierung/Anschrift]', '[Rechtsgrundlage Drittlandtransfer PayPal]',
  ].forEach((placeholder) => assert.ok(html.includes(TODO(placeholder)), placeholder));
});

test('Stand der Datenschutzerklärung bleibt unverändert', () => {
  assert.ok(read('datenschutz/index.html').includes('Stand: 31. Mai 2026'));
});

test('support.html hat kein totes Formular mehr, sondern einen E-Mail-Button', () => {
  const html = read('support.html');
  assert.ok(!html.includes('action="#"'));
  assert.ok(!html.includes('<form'));
  assert.ok(!/'form\.(nameLabel|submit|consent|footnote)'/.test(html));
  assert.match(html, /<a href="mailto:info@smyagency\.de\?subject=Support-Anfrage"[^>]*data-i18n="support\.mailButton">Support per E-Mail kontaktieren<\/a>/);
  assert.strictEqual((html.match(/'support\.mailButton':/g) || []).length, 2);
});
