// Prüft die zentrale Datendatei. Ausführen mit: node --test tests/references.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../data/references.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const entries = Array.from(sandbox.window.SMY_REFERENCES);

test('jeder Eintrag hat alle Pflichtfelder', () => {
  for (const entry of entries) {
    assert.ok(entry.name, 'name fehlt');
    assert.ok(['kunde', 'partner'].includes(entry.typ), `${entry.name}: typ`);
    assert.ok(entry.leistung, `${entry.name}: leistung`);
    assert.strictEqual(typeof entry.featured, 'boolean', `${entry.name}: featured`);
    assert.strictEqual(typeof entry.order, 'number', `${entry.name}: order`);
  }
});

test('nicht-featured Kunden haben eine gültige Spalte', () => {
  entries
    .filter((entry) => entry.typ === 'kunde' && !entry.featured)
    .forEach((entry) => {
      assert.ok(['web', 'branding', 'marketing'].includes(entry.bereich), `${entry.name}: bereich`);
    });
});

test('URLs sind absolut und http(s)', () => {
  entries.filter((entry) => entry.url).forEach((entry) => {
    assert.match(entry.url, /^https?:\/\//, entry.name);
  });
});

test('gewünschte Kunden und Partner sind enthalten', () => {
  const names = (typ) => entries.filter((entry) => entry.typ === typ).map((entry) => entry.name);
  ['MJ Lernförderung', 'HappINess e. V.', 'Tolgi Versicherung', 'Fastreinigung', 'CI Dienstleistungen']
    .forEach((name) => assert.ok(names('kunde').includes(name), name));
  ['PSYNOW', 'CI Dienstleistungen'].forEach((name) => assert.ok(names('partner').includes(name), name));
});

test('GGM Gastro ist nicht enthalten', () => {
  assert.doesNotMatch(source, /\bggm\b/i);
});
