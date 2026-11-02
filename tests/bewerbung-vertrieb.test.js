// Prüft Score, Flags, Validierung und E-Mail-Inhalt. Ausführen mit: node --test tests/bewerbung-vertrieb.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sandbox = { window: {} };
['../data/bewerbung-vertrieb.js', '../bewerbung-logik.js'].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), sandbox);
});
const config = sandbox.window.SMY_BEWERBUNG;
const logik = sandbox.window.SMY_BEWERBUNG_LOGIK;
const plain = (value) => JSON.parse(JSON.stringify(value));

const answers = (overrides) => ({
  name: 'Alex Beispiel',
  email: 'alex@example.com',
  telefon: '+49 151 12345678',
  wohnort: 'Ingolstadt',
  tage: ['Mo', 'Di', 'Mi'],
  zeiten: ['Vormittags'],
  stunden: '5–10',
  start: '2026-12-01',
  telefonieren: '5',
  kaltakquise: '4',
  nein: '3',
  organisation: '2',
  emails: '1',
  erfahrung: 'Nein',
  andererMinijob: 'Nein',
  ruhigerPlatz: 'Ja',
  equipment: 'Ja',
  motivation: 'Ich rede gerne mit Menschen.',
  rueckruf: ['Abends'],
  datenschutz: true,
  ...overrides,
});

test('Konfiguration hat 5 Schritte und eindeutige Feld-IDs', () => {
  assert.strictEqual(config.steps.length, 5);
  const ids = config.steps.flatMap((step) => step.fields.map((field) => field.id));
  assert.strictEqual(new Set(ids).size, ids.length);
});

test('keine AGG-kritischen Fragen im Fragebogen', () => {
  const text = JSON.stringify(config.steps).toLowerCase();
  ['alter', 'geschlecht', 'herkunft', 'familienstand', 'kinder', 'religion', 'foto'].forEach((word) => {
    assert.ok(!new RegExp(`\\b${word}\\b`).test(text), word);
  });
});

test('Score gewichtet Telefonieren und Kaltakquise doppelt, Maximum 35', () => {
  const result = plain(logik.computeScore(config.steps, answers()));
  assert.deepStrictEqual(result, { score: 24, max: 35 });
  const best = { telefonieren: '5', kaltakquise: '5', nein: '5', organisation: '5', emails: '5' };
  assert.strictEqual(logik.computeScore(config.steps, answers(best)).score, 35);
  const worst = { telefonieren: '1', kaltakquise: '1', nein: '1', organisation: '1', emails: '1' };
  assert.strictEqual(logik.computeScore(config.steps, answers(worst)).score, 7);
});

test('Flag zeitlich: 3 Werktage plus Vormittag oder Nachmittag', () => {
  const flags = (overrides) => plain(logik.computeFlags(answers(overrides)));
  assert.ok(flags({}).includes('✅ Passt zeitlich'));
  assert.ok(flags({ zeiten: ['Nachmittags', 'Abends'] }).includes('✅ Passt zeitlich'));
  assert.ok(flags({ zeiten: ['Abends'] }).includes('⚠️ Zeitlich eingeschränkt'));
  assert.ok(flags({ tage: ['Mo', 'Di'] }).includes('⚠️ Zeitlich eingeschränkt'));
  assert.ok(flags({ tage: ['Mo', 'Di', 'Sa', 'So'] }).includes('⚠️ Zeitlich eingeschränkt'));
  assert.ok(flags({ tage: ['Mo', 'Di', 'Mi', 'Sa'] }).includes('✅ Passt zeitlich'));
});

test('Flag Minijob und Equipment', () => {
  const flags = (overrides) => plain(logik.computeFlags(answers(overrides)));
  assert.deepStrictEqual(flags({}), ['✅ Passt zeitlich']);
  assert.ok(flags({ andererMinijob: 'Ja' }).includes('⚠️ Schon Minijob'));
  assert.ok(flags({ ruhigerPlatz: 'Nein' }).includes('⚠️ Kein Equipment'));
  assert.ok(flags({ equipment: 'Nur Laptop' }).includes('⚠️ Kein Equipment'));
  assert.ok(flags({ equipment: 'Nein' }).includes('⚠️ Kein Equipment'));
  assert.ok(!flags({ equipment: '', ruhigerPlatz: '' }).includes('⚠️ Kein Equipment'));
});

test('Betreff folgt dem vereinbarten Format und entfernt Zeilenumbrüche', () => {
  const subject = logik.buildSubject('Alex\r\nBcc: x@y.de', { score: 24, max: 35 }, ['✅ Passt zeitlich', '⚠️ Schon Minijob']);
  assert.strictEqual(subject, 'Bewerbung Vertrieb: Alex Bcc: x@y.de, Score 24/35, ✅ Passt zeitlich, ⚠️ Schon Minijob');
});

test('E-Mail-Validierung', () => {
  ['a@b.de', 'vor.nach+tag@firma-x.co.uk'].forEach((value) => assert.ok(logik.isValidEmail(value), value));
  ['', 'a@b', 'a b@c.de', '@c.de', 'a@.de'].forEach((value) => assert.ok(!logik.isValidEmail(value), value));
});

test('Telefon-Validierung', () => {
  ['0151 12345678', '+49 (151) 123-45678', '0841/123456'].forEach((value) => assert.ok(logik.isValidPhone(value), value));
  ['', '12345', 'abc', '+49 151 abc 12345', '1234567890123456'].forEach((value) => assert.ok(!logik.isValidPhone(value), value));
});

test('Pflichtfelder liefern Fehler, optionale nicht', () => {
  const fields = config.steps.flatMap((step) => step.fields);
  const field = (id) => fields.find((candidate) => candidate.id === id);
  const today = '2026-11-02';
  assert.ok(logik.validateField(field('name'), '', today));
  assert.ok(logik.validateField(field('email'), 'kaputt', today));
  assert.ok(logik.validateField(field('telefon'), '123', today));
  assert.ok(logik.validateField(field('tage'), [], today));
  assert.ok(logik.validateField(field('telefonieren'), '', today));
  assert.ok(logik.validateField(field('andererMinijob'), '', today));
  assert.ok(logik.validateField(field('datenschutz'), false, today));
  assert.strictEqual(logik.validateField(field('stunden'), '', today), '');
  assert.ok(logik.validateField(field('rueckruf'), [], today));
  assert.ok(logik.validateField(field('ruhigerPlatz'), '', today));
  assert.ok(logik.validateField(field('equipment'), '', today));
  assert.strictEqual(logik.validateField(field('email'), 'a@b.de', today), '');
});

test('Startdatum darf nicht in der Vergangenheit liegen, Motivation max. 300 Zeichen', () => {
  const fields = config.steps.flatMap((step) => step.fields);
  const field = (id) => fields.find((candidate) => candidate.id === id);
  assert.ok(logik.validateField(field('start'), '2026-11-01', '2026-11-02'));
  assert.strictEqual(logik.validateField(field('start'), '2026-11-02', '2026-11-02'), '');
  assert.ok(logik.validateField(field('motivation'), 'x'.repeat(301), '2026-11-02'));
  assert.strictEqual(logik.validateField(field('motivation'), 'x'.repeat(300), '2026-11-02'), '');
});

test('Payload enthält Score, Flags, Betreff und alle Antworten', () => {
  const payload = plain(logik.buildPayload(config, answers({ andererMinijob: 'Ja' }), '2026-11-02T18:00:00.000Z'));
  assert.strictEqual(payload._subject, 'Bewerbung Vertrieb: Alex Beispiel, Score 24/35, ✅ Passt zeitlich, ⚠️ Schon Minijob');
  assert.strictEqual(payload.Score, '24/35');
  assert.strictEqual(payload.Flags, '✅ Passt zeitlich, ⚠️ Schon Minijob');
  assert.strictEqual(payload.email, 'alex@example.com');
  assert.strictEqual(payload['2. Verfügbarkeit: Tage'], 'Mo, Di, Mi');
  assert.strictEqual(payload['2. Verfügbarkeit: Start ab'], '01.12.2026');
  assert.strictEqual(payload['3. Selbsteinschätzung: Telefonieren (doppelt gewertet)'], '5');
  assert.match(payload['5. Motivation & Rückruf: Datenschutz-Einwilligung'], /2026-11-02T18:00:00/);
});

test('Payload nennt leere optionale Felder und lässt ausgeblendete Folgefragen weg', () => {
  const none = plain(logik.buildPayload(config, answers({ stunden: '', erfahrung: 'Nein', erfahrungDauer: 'unter 6 Monate' }), 'x'));
  assert.strictEqual(none['2. Verfügbarkeit: Stunden pro Woche'], 'keine Angabe');
  assert.ok(!('4. Erfahrung & Rahmen: Erfahrung, Dauer' in none));
  const some = plain(logik.buildPayload(config, answers({ erfahrung: 'Ja', erfahrungDauer: '1–3 Jahre', erfahrungArt: 'B2B' }), 'x'));
  assert.strictEqual(some['4. Erfahrung & Rahmen: Erfahrung, Dauer'], '1–3 Jahre');
  assert.strictEqual(some['4. Erfahrung & Rahmen: Erfahrung, Bereich'], 'B2B');
});

test('Ausgeblendete Pflichtfolgefragen blockieren nicht', () => {
  const fields = config.steps.flatMap((step) => step.fields);
  const dauer = fields.find((candidate) => candidate.id === 'erfahrungDauer');
  assert.strictEqual(logik.isFieldVisible(dauer, { erfahrung: 'Nein' }), false);
  assert.strictEqual(logik.isFieldVisible(dauer, { erfahrung: 'Ja' }), true);
});

test('Rate-Limit: maximal 3 Einsendungen pro Stunde', () => {
  const now = 10 * 60 * 60 * 1000;
  const minutes = (n) => now - n * 60 * 1000;
  assert.strictEqual(logik.isRateLimited([], now), false);
  assert.strictEqual(logik.isRateLimited([minutes(1), minutes(2)], now), false);
  assert.strictEqual(logik.isRateLimited([minutes(1), minutes(2), minutes(3)], now), true);
  assert.strictEqual(logik.isRateLimited([minutes(61), minutes(62), minutes(63)], now), false);
});

const TALENTPOOL_TEXT = 'Optional: Ich möchte in den SMY-Talentpool aufgenommen werden. Dafür dürfen meine Angaben bis zu 12 Monate gespeichert werden, damit ihr mich bei passenden Stellen erneut kontaktieren könnt. Diese Einwilligung kann ich jederzeit per E-Mail an info@smyagency.de widerrufen.';
const talentpoolField = () => config.steps.flatMap((step) => step.fields).find((field) => field.id === 'talentpool');

test('Talentpool ist optional, steht nach der Datenschutz-Checkbox und hat den vereinbarten Text', () => {
  const ids = config.steps[4].fields.map((field) => field.id);
  assert.strictEqual(ids.indexOf('talentpool'), ids.indexOf('datenschutz') + 1);
  assert.strictEqual(talentpoolField().label, TALENTPOOL_TEXT);
  assert.strictEqual(logik.validateField(talentpoolField(), false, '2026-11-02'), '');
});

test('Talentpool erscheint als Ja/Nein und nur bei Ja im Betreff', () => {
  const yes = plain(logik.buildPayload(config, answers({ talentpool: true }), 'x'));
  assert.strictEqual(yes.Talentpool, 'Ja');
  assert.strictEqual(yes._subject, 'Bewerbung Vertrieb: Alex Beispiel, Score 24/35, ✅ Passt zeitlich [Talentpool]');
  const no = plain(logik.buildPayload(config, answers({ talentpool: false }), 'x'));
  assert.strictEqual(no.Talentpool, 'Nein');
  assert.ok(!no._subject.includes('Talentpool'));
});

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('Seite ist nur per noindex ausgeschlossen, nicht per robots.txt oder Sitemap', () => {
  assert.ok(!read('robots.txt').includes('bewerbung'));
  assert.ok(!read('sitemap.xml').includes('bewerbung'));
  assert.match(read('bewerbung-vertrieb/index.html'), /<meta name="robots" content="noindex, nofollow"/);
});

test('Datenschutzerklärung enthält Bewerbungen, Talentpool, Formspree und markierte Platzhalter', () => {
  const html = read('datenschutz/index.html');
  assert.ok(html.includes('5.3 Bewerbungen'));
  assert.ok(html.includes('5.4 Formspree'));
  assert.ok(html.indexOf('in die Aufnahme in unseren Talentpool') < html.indexOf('spätestens 6 Monate'));
  ['[Formspree Firmierung/Anschrift]', '[Rechtsgrundlage USA-Transfer]', '[AV-Vertrag]'].forEach((placeholder) => {
    assert.ok(html.includes(`<!-- TODO PRÜFEN --><mark class="ds-legal__todo">${placeholder}</mark>`), placeholder);
  });
});
