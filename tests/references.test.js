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

test('Featured sind genau MJ Lernförderung und Picsart', () => {
  const featured = references.filter((e) => e.featured).map((e) => e.name);
  assert.deepStrictEqual(featured, ['MJ Lernförderung', 'Picsart Inc.']);
});

test('gewünschte Kunden und Partner sind enthalten', () => {
  const names = (typ) => references.filter((e) => e.typ === typ).map((e) => e.name);
  ['MJ Lernförderung', 'HappINess e. V.', 'Picsart Inc.', 'Fastreinigung', 'CI Dienstleistungen']
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
  assert.match(html, /alt="P Logo" loading="lazy"/);
  assert.match(html, /alt="K Logo" loading="lazy"/);
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

test('CI Dienstleistungen verlinkt die eigene Website', () => {
  const found = loadData(ROOT).references.filter((entry) => entry.name === 'CI Dienstleistungen');
  assert.strictEqual(found.length, 2);
  found.forEach((entry) => assert.strictEqual(entry.url, 'https://ci-dienstleistungen.com'));
});

test('Picsart steht als Featured-Karte auf der Projekte-Seite und nicht doppelt in der Liste', () => {
  const html = projects();
  assert.strictEqual((html.match(/Picsart Inc\./g) || []).length, 1);
  assert.match(html, /ds-featured__tag">Enterprise Tech<\/div><h3>Picsart Inc\.<\/h3>/);
  assert.ok(html.indexOf('MJ Lernförderung') < html.indexOf('Picsart Inc.'));
  assert.ok(html.indexOf('Picsart Inc.') < html.indexOf('Alle Projekte'));
});

test('die entfernte Referenz kommt in Daten und Seite nicht mehr vor', () => {
  const removed = new RegExp(`tol${'gi'}`, 'i');
  assert.ok(!removed.test(projects()));
  assert.ok(!removed.test(fs.readFileSync(path.join(ROOT, 'data/references.js'), 'utf8')));
});

test('Partner-Leiste zeigt genau PSYNOW und CI mit lokalem Logo und Alt-Text', () => {
  const html = projects();
  const section = html.slice(html.indexOf('id="vertriebspartner"'));
  const images = [...section.matchAll(/<img class="ds-vp__logo" src="([^"]+)" alt="([^"]+)"/g)].map((match) => [match[1], match[2]]);
  assert.deepStrictEqual(images, [
    ['/images/logos/psynow.png', 'PSYNOW Logo'],
    ['/images/logos/ci.png', 'CI Dienstleistungen Logo'],
  ]);
  images.forEach(([src]) => assert.ok(fs.existsSync(path.join(ROOT, src)), src));
  assert.ok(!section.includes('ds-vp__wordmark'));
  assert.ok(section.includes('href="https://ci-dienstleistungen.com"'));
});

test('Logo-Pfad muss unter /public/ oder /images/ liegen', () => {
  const entry = { name: 'X', typ: 'partner', leistung: 'L', featured: false, order: 1 };
  assert.deepStrictEqual(validateReferences([{ ...entry, logo: '/images/logos/x.png' }]), []);
  assert.strictEqual(validateReferences([{ ...entry, logo: 'https://example.com/x.png' }]).length, 1);
});
