// Prüft rechtliche Texte und statische Korrekturen. Ausführen mit: node --test tests/rechtliches.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('leads verspricht keine Nicht-Weitergabe mehr und verlinkt die Datenschutzerklärung', () => {
  const html = read('leads/index.html');
  assert.ok(!html.includes('Keine Weitergabe an Dritte'));
  assert.ok(html.includes('>Datenschutzerklärung</a>.'));
});

const privacyVisible = () => read('datenschutz/index.html').replace(/<!--[\s\S]*?-->/g, '');

test('Datenschutzerklärung hat keine sichtbaren Platzhalter', () => {
  const html = privacyVisible();
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  assert.ok(!main.includes('<mark'));
  assert.ok(!main.includes('ds-legal__todo'));
  assert.ok(!main.replace(/<[^>]+>/g, ' ').includes('['), 'eckige Klammer im Text');
  assert.ok(!read('design-system.css').includes('ds-legal__todo'));
});

test('Hosting beschreibt GitHub Pages statt IONOS-Hosting und Cloudflare', () => {
  const html = privacyVisible();
  assert.ok(html.includes('GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA'));
  assert.ok(html.includes('IP-Adresse'));
  assert.ok(!html.includes('Cloudflare'));
  assert.ok(!html.includes('ausschließlich auf Servern innerhalb der Europäischen Union'));
});

test('Anbieter stehen mit Firmierung, Anschrift und Transfergrundlage drin', () => {
  const html = privacyVisible();
  [
    'Sendinblue SAS, 106 Boulevard Haussmann, 75008 Paris, Frankreich',
    'PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxembourg',
    'Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland',
    'Calendly, LLC, 115 E Main St., Ste A1B, Buford, GA 30518, USA',
    'Formspree, Inc.',
    'Standardvertragsklauseln der EU-Kommission',
    'EU-US Data Privacy Framework',
  ].forEach((text) => assert.ok(html.includes(text), text));
});

test('nicht eingebundene Analysedienste sind entfernt, der Meta Pixel bleibt', () => {
  const html = privacyVisible();
  ['Google Analytics', 'Hotjar'].forEach((text) => assert.ok(!html.includes(text), text));
  assert.ok(html.includes('Meta Pixel'));
  assert.ok(html.includes('Stand: November 2026'));
});

test('support.html hat kein totes Formular mehr, sondern einen E-Mail-Button', () => {
  const html = read('support.html');
  assert.ok(!html.includes('action="#"'));
  assert.ok(!html.includes('<form'));
  assert.ok(!/'form\.(nameLabel|submit|consent|footnote)'/.test(html));
  assert.match(html, /<a href="mailto:info@smyagency\.de\?subject=Support-Anfrage"[^>]*data-i18n="support\.mailButton">Support per E-Mail kontaktieren<\/a>/);
  assert.strictEqual((html.match(/'support\.mailButton':/g) || []).length, 2);
});

test('leitfaden.html hat ein gültiges Gerüst aus head und body', () => {
  const html = read('leitfaden.html');
  assert.strictEqual((html.match(/<\/head>/g) || []).length, 1);
  assert.strictEqual((html.match(/<body/g) || []).length, 1);
  assert.ok(html.indexOf('</style>') < html.indexOf('</head>'));
  assert.ok(html.indexOf('</head>') < html.indexOf('<body'));
  assert.ok(html.indexOf('<body') < html.indexOf('<header'));
});

test('ugc.html enthält keine Bilder, deren Datei fehlt', () => {
  const sources = [...read('ugc.html').matchAll(/<img\b[^>]*?\bsrc="([^"]+)"/g)].map((match) => match[1]);
  sources.filter((src) => !/^(https?:|data:)/.test(src)).forEach((src) => {
    assert.ok(fs.existsSync(path.join(__dirname, '..', src.replace(/^\//, ''))), src);
  });
});

test('Datenschutzerklärung bleibt ohne JavaScript lesbar', () => {
  assert.ok(read('datenschutz/index.html').includes('<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>'));
});

test('Fragebogen zeigt ohne JavaScript nur den Hinweis statt eines leeren Formulars', () => {
  const html = read('bewerbung-vertrieb/index.html');
  assert.ok(html.includes('<noscript><style>#bw-form{display:none}</style></noscript>'));
  assert.ok(html.includes('Der Fragebogen braucht JavaScript'));
});

const LEGAL_PAGES = ['impressum/index.html', 'services/index.html', 'ueber-uns/index.html', 'vertrieb/index.html'];
const LINK_PAGES = ['leitfaden.html', 'shop.html', 'support.html', 'terms-socialpro.html', 'ugc.html', 'workbook.html', 'workbook-danke.html'];

test('keine toten Links auf flache Rechts- und Portfolio-Seiten', () => {
  LINK_PAGES.forEach((page) => {
    assert.ok(!/href=["'](?:\.\.\/|\.\/|\/)?(?:datenschutz|impressum|Kundenportfolio)\.html/.test(read(page)), page);
  });
  assert.ok(read('workbook.html').includes('href="/datenschutz/"'));
});

test('weitere Seiten bleiben ohne JavaScript sichtbar', () => {
  LEGAL_PAGES.forEach((page) => {
    assert.ok(read(page).includes('<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>'), page);
  });
});

test('Zähler der Startseite stehen mit Endwert im HTML', () => {
  const counters = [...read('index.html').matchAll(/<span[^>]*data-count="(\d+)"(?: data-suffix="([^"]*)")?[^>]*>([^<]*)</g)];
  assert.ok(counters.length >= 3);
  counters.forEach(([, count, suffix = '', text]) => assert.strictEqual(text, `${count}${suffix}`));
});

test('leads nutzt die Du-Ansprache im Datenschutz-Satz', () => {
  const html = read('leads/index.html');
  assert.ok(html.includes('Deine Daten werden ausschließlich zur Bearbeitung deiner Anfrage verwendet und vertraulich behandelt. Details in unserer <a href="/datenschutz/"'));
  assert.ok(!html.includes('Ihre Daten werden ausschließlich'));
});

test('support.html nutzt einheitlich info@smyagency.de', () => {
  assert.ok(!read('support.html').includes('support@smyagency.de'));
});

test('Visa-Logo liegt lokal und wird von leitfaden.html genutzt', () => {
  assert.ok(fs.existsSync(path.join(__dirname, '../images/visa.svg')));
  const html = read('leitfaden.html');
  assert.ok(html.includes('src="/images/visa.svg"'));
  assert.ok(!html.includes('commons/0/04/Visa.svg'));
});
