// Ausführen mit: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const {
  REVIEW_PAGES, applyRatingToSchema, buildPages, isRatingSet, loadData, renderHeroRating, renderReviews, validateRating, validateReviews,
} = require('../scripts/build-references.js');

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

test('nur die 12 zu prüfenden Bewertungen sind erfasst und keine ist freigegeben', () => {
  assert.strictEqual(reviews.length, 12);
  reviews.forEach((r) => assert.strictEqual(r.freigegeben, false, r.text));
});

test('leads, ugc und leitfaden enthalten keine Kundenstimmen mehr', () => {
  ['leads/index.html', 'ugc.html', 'leitfaden.html'].forEach((page) => {
    assert.strictEqual(reviews.filter((r) => r.seiten.includes(page)).length, 0, page);
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    ['Kundenstimmen', 'Was unsere Kunden sagen', 'Das sagen unsere', 'ds-review', 'rv-card', 'Sind unsere Creatives']
      .forEach((text) => assert.ok(!html.includes(text), `${page}: ${text}`));
  });
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

const RATED = { anzahl: 42, schnitt: 4.8, profilUrl: PROFILE };
const schemaOf = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const orgOf = (html) => schemaOf(html)['@graph'].find((node) => node['@id'].endsWith('#organization'));
const homepage = () => fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

test('googleRating ist zentral konfiguriert und noch nicht gesetzt', () => {
  const { googleRating } = loadData(ROOT);
  assert.strictEqual(googleRating.anzahl, null);
  assert.strictEqual(googleRating.schnitt, null);
  assert.strictEqual(googleRating.profilUrl, 'https://g.page/r/Cb-CsgZPf7TWEAE');
});

test('isRatingSet verlangt Anzahl und Schnitt', () => {
  assert.strictEqual(isRatingSet({ anzahl: null, schnitt: null }), false);
  assert.strictEqual(isRatingSet({ anzahl: 42, schnitt: null }), false);
  assert.strictEqual(isRatingSet({ anzahl: null, schnitt: 4.8 }), false);
  assert.strictEqual(isRatingSet(RATED), true);
});

test('validateRating lehnt ungültige Werte ab', () => {
  assert.deepStrictEqual(validateRating(RATED), []);
  assert.deepStrictEqual(validateRating({ anzahl: null, schnitt: null, profilUrl: PROFILE }), []);
  assert.strictEqual(validateRating({ ...RATED, anzahl: 0 }).length, 1);
  assert.strictEqual(validateRating({ ...RATED, anzahl: 1.5 }).length, 1);
  assert.strictEqual(validateRating({ ...RATED, schnitt: 5.5 }).length, 1);
  assert.strictEqual(validateRating({ ...RATED, schnitt: '4.8' }).length, 1);
  assert.strictEqual(validateRating({ ...RATED, profilUrl: 'http://x' }).length, 1);
});

test('Schema enthält aggregateRating nur bei vollständigen Werten', () => {
  const none = { anzahl: null, schnitt: null, profilUrl: PROFILE };
  assert.ok(!('aggregateRating' in orgOf(applyRatingToSchema(homepage(), none))));
  assert.ok(!('aggregateRating' in orgOf(applyRatingToSchema(homepage(), { ...RATED, schnitt: null }))));
  const rating = orgOf(applyRatingToSchema(homepage(), RATED)).aggregateRating;
  assert.strictEqual(rating['@type'], 'AggregateRating');
  assert.strictEqual(rating.ratingValue, '4.8');
  assert.strictEqual(rating.reviewCount, '42');
});

test('Hero-Zeile erscheint nur bei vollständigen Werten', () => {
  assert.strictEqual(renderHeroRating({ anzahl: null, schnitt: null }), '');
  assert.strictEqual(renderHeroRating({ anzahl: 42, schnitt: null }), '');
  assert.strictEqual(renderHeroRating({ ...RATED, schnitt: 5 }), '<span>★ 5.0 aus 42 Google-Bewertungen</span>');
});

test('Startseite enthält ohne Werte weder Schema-Rating noch Hero-Zeile', () => {
  const html = homepage();
  ['aggregateRating', 'reviewCount', 'ratingValue', '★ 5.0', 'Google-Bewertungen</span>'].forEach((text) => {
    assert.ok(!html.includes(text), text);
  });
  assert.ok(html.includes('<!-- GOOGLE_RATING:START -->'));
  assert.strictEqual(orgOf(html).name, 'SMY Agency');
});

test('Bewertungsblock der Startseite nimmt Zahlen nur aus der Konfiguration', () => {
  const review = approved();
  const without = renderReviews('index.html', [review], PROFILE, { anzahl: null, schnitt: null, profilUrl: PROFILE });
  assert.ok(!without.includes('ds-reviews__num'));
  assert.ok(without.includes('Bewertung schreiben'));
  const rated = renderReviews('index.html', [review], PROFILE, RATED);
  assert.ok(rated.includes('<div class="ds-reviews__num">4.8</div>'));
  assert.ok(rated.includes('Basierend auf 42 Google-Bewertungen'));
});

test('Build-Ergebnis steht statisch in den Seiten', () => {
  Object.entries(buildPages(ROOT)).forEach(([file, html]) => {
    assert.strictEqual(fs.readFileSync(path.join(ROOT, file), 'utf8'), html, `${file}: Build nicht aktuell`);
  });
});
