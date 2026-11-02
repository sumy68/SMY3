// Ausführen mit: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { REVIEW_PAGES, loadData, renderReviews, validateReviews } = require('../scripts/build-references.js');

const ROOT = path.join(__dirname, '..');
const { reviews, profileUrl } = loadData(ROOT);
const PROFILE = 'https://example.com/profil';
const approved = (overrides = {}) => ({
  name: 'Ahmet K.', sterne: 4, datum: '03/2026', text: 'Sehr gut […] gerne wieder.',
  quelle: 'google', seiten: ['index.html'], freigegeben: true, ...overrides,
});

test('Bewertungsdaten sind gültig', () => {
  assert.deepStrictEqual(validateReviews(reviews, profileUrl), []);
});

test('alle 20 Kundenstimmen sind erfasst', () => {
  assert.strictEqual(reviews.length, 20);
});

test('Einträge mit Platzhaltern sind nicht freigegeben', () => {
  reviews
    .filter((r) => [r.name, r.sterne, r.datum].some((v) => String(v).startsWith('[')))
    .forEach((r) => assert.strictEqual(r.freigegeben, false, r.text));
});

test('Freigabe mit Platzhaltern schlägt fehl', () => {
  const errors = validateReviews([approved({ name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]' })], PROFILE);
  assert.strictEqual(errors.length, 3);
});

test('Freigabe prüft Sternebereich und Datumsformat', () => {
  assert.strictEqual(validateReviews([approved({ sterne: 6 })], PROFILE).length, 1);
  assert.strictEqual(validateReviews([approved({ sterne: 0 })], PROFILE).length, 1);
  assert.strictEqual(validateReviews([approved({ datum: '13/2026' })], PROFILE).length, 1);
  assert.deepStrictEqual(validateReviews([approved()], PROFILE), []);
});

test('Validierung meldet unbekannte Seiten und fremde Quellen', () => {
  assert.strictEqual(validateReviews([approved({ seiten: ['foo.html'] })], PROFILE).length, 1);
  assert.strictEqual(validateReviews([approved({ quelle: 'trustpilot' })], PROFILE).length, 1);
});

test('nicht freigegebene Bewertungen werden nirgends ausgegeben', () => {
  Object.keys(REVIEW_PAGES).forEach((page) => {
    assert.strictEqual(renderReviews(page, reviews, profileUrl), '', page);
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    reviews.forEach((r) => assert.ok(!html.includes(r.text), `${page}: ${r.text}`));
  });
});

test('freigegebene Bewertung zeigt Name, Sterne, Datum, Label und Hinweis', () => {
  ['index.html', 'ugc.html'].forEach((page) => {
    const html = renderReviews(page, [approved({ seiten: [page] })], PROFILE);
    assert.ok(html.includes('Ahmet K.'));
    assert.ok(html.includes('★★★★☆'));
    assert.ok(html.includes('aria-label="4 von 5 Sternen"'));
    assert.ok(html.includes('03/2026 · Google-Bewertung'));
    assert.ok(html.includes('„Sehr gut […] gerne wieder.“'));
    assert.ok(html.includes('Auszüge aus öffentlichen Google-Bewertungen unseres Unternehmensprofils.'));
    assert.ok(html.includes(`href="${PROFILE}" target="_blank" rel="noopener noreferrer">Alle Bewertungen ansehen`));
  });
});

test('Bewertung erscheint nur auf ihren Seiten und ohne Inhalt fällt der Block weg', () => {
  assert.strictEqual(renderReviews('leads/index.html', [approved()], PROFILE), '');
});

test('Bewertungstexte werden maskiert', () => {
  const html = renderReviews('index.html', [approved({ text: '<script>x</script>' })], PROFILE);
  assert.ok(!html.includes('<script>'));
});

test('jede Bewertungsseite hat Marker, Stylesheet und bleibt ohne JS sichtbar', () => {
  Object.keys(REVIEW_PAGES).forEach((page) => {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    assert.ok(html.includes('<!-- REVIEWS:START -->') && html.includes('<!-- REVIEWS:END -->'), page);
    assert.ok(html.includes('/reviews.css'), page);
  });
  ['index.html', 'leads/index.html', 'webdesign/index.html', 'projects/index.html'].forEach((page) => {
    assert.ok(fs.readFileSync(path.join(ROOT, page), 'utf8').includes('<noscript><style>.reveal'), page);
  });
});
