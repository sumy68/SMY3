// Ausführen mit: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildPages, loadData, renderReferences, slug, validateReferences } = require('../scripts/build-references.js');

const ROOT = path.join(__dirname, '..');
const { references } = loadData(ROOT);
const noLogo = () => '';
const projects = () => fs.readFileSync(path.join(ROOT, 'projects/index.html'), 'utf8');

test('Referenzdaten sind gültig', () => {
  assert.deepStrictEqual(validateReferences(references), []);
});

test('Validierung meldet fehlende Pflichtfelder und schlechte URLs', () => {
  const errors = validateReferences([{ name: 'X', typ: 'kunde', url: 'javascript:alert(1)' }]);
  assert.ok(errors.some((e) => e.includes('leistung')));
  assert.ok(errors.some((e) => e.includes('featured')));
  assert.ok(errors.some((e) => e.includes('url')));
});

test('Featured sind genau MJ Lernförderung und Tolgi', () => {
  const featured = references.filter((e) => e.featured).map((e) => e.name);
  assert.deepStrictEqual(featured, ['MJ Lernförderung', 'Tolgi Versicherung']);
});

test('gewünschte Kunden und Partner sind enthalten', () => {
  const names = (typ) => references.filter((e) => e.typ === typ).map((e) => e.name);
  ['MJ Lernförderung', 'HappINess e. V.', 'Tolgi Versicherung', 'Fastreinigung', 'CI Dienstleistungen']
    .forEach((name) => assert.ok(names('kunde').includes(name), name));
  ['PSYNOW', 'CI Dienstleistungen'].forEach((name) => assert.ok(names('partner').includes(name), name));
});

test('Inhalte werden maskiert und nicht als HTML ausgegeben', () => {
  const html = renderReferences([
    { name: '<b>X</b>', typ: 'kunde', bereich: 'web', leistung: 'A & B', featured: false, order: 1 },
  ], noLogo);
  assert.match(html, /&lt;b&gt;X&lt;\/b&gt;/);
  assert.match(html, /A &amp; B/);
});

test('leere Felder erzeugen keine leeren Boxen', () => {
  const html = renderReferences([
    { name: 'X', typ: 'kunde', leistung: 'L', featured: true, order: 1 },
  ], noLogo);
  ['ds-ref-result', 'ds-ref-quote', 'ds-featured__tag', 'ds-ref-logo', 'Vertriebspartner', 'Alle Projekte']
    .forEach((text) => assert.ok(!html.includes(text), text));
});

test('Partner ohne Logo zeigt Wortmarke, ohne URL keinen Link', () => {
  const html = renderReferences([{ name: 'P', typ: 'partner', leistung: 'L', featured: false, order: 1 }], noLogo);
  assert.match(html, /ds-vp__wordmark">P</);
  assert.ok(!html.includes('<a '));
  assert.ok(!html.includes('<img'));
});

test('Logos erscheinen unverzerrt mit Alt-Text und Lazy Loading, externe Links sicher', () => {
  const html = renderReferences([
    { name: 'P', typ: 'partner', leistung: 'L', url: 'https://p.example', featured: false, order: 1 },
    { name: 'K', typ: 'kunde', bereich: 'web', leistung: 'L', featured: false, order: 2 },
  ], (entry) => `/logo-${entry.name}.svg`);
  assert.match(html, /alt="Logo P" loading="lazy"/);
  assert.match(html, /alt="Logo K" loading="lazy"/);
  assert.match(html, /href="https:\/\/p\.example" target="_blank" rel="noopener noreferrer"/);
  assert.ok(!html.includes('ds-vp__wordmark'));
});

test('Dateinamen für Logos entstehen aus dem Namen', () => {
  assert.strictEqual(slug('CI Dienstleistungen'), 'ci-dienstleistungen');
  assert.strictEqual(slug('MJ Lernförderung'), 'mj-lernfoerderung');
  assert.strictEqual(slug('HappINess e. V.'), 'happiness-e-v');
});

test('Seite enthält den Inhalt statisch und lädt kein Client-Rendering', () => {
  const html = projects();
  references.forEach((entry) => assert.ok(html.includes(entry.name.replace(/&/g, '&amp;')), entry.name));
  assert.ok(html.includes('über unser eigenes Leistungsportfolio hinaus'));
  assert.ok(!html.includes('/references.js'));
  assert.ok(!html.includes('/data/'));
});

test('alle Seiten entsprechen dem aktuellen Build', () => {
  Object.entries(buildPages(ROOT)).forEach(([file, html]) => {
    assert.strictEqual(fs.readFileSync(path.join(ROOT, file), 'utf8'), html, `${file}: Build-Skript ausführen`);
  });
});

test('/projects/ spricht mit Sie an', () => {
  const text = projects().replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(text, /\b(du|dein\w*|dir|dich|euch)\b/i);
  assert.match(text, /Bereit für Ihr Projekt\?/);
});

test('GGM Gastro ist nicht enthalten', () => {
  assert.doesNotMatch(JSON.stringify(references), /\bggm\b/i);
});
