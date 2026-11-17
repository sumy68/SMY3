#!/usr/bin/env node
/* ==========================================================================
   Rendert das Social-Media-/OG-Bild aus _src/og/og.html und setzt die
   OG-/Twitter-Tags aller Seiten, die ein og:image haben, auf die neue Version.
   Ausführen: node scripts/build-og.js
   Braucht playwright-core (require-bar oder Pfad in PLAYWRIGHT_CORE) samt Chromium.
   ========================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, '_src/og/og.html');
const OUTPUT_REL = 'images/smy-agency-webdesign-vertrieb-digitalagentur.jpg';
const OUTPUT = path.join(ROOT, OUTPUT_REL);
const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 200 * 1024;
const QUALITIES = [90, 86, 82, 78, 74, 70];
const SITE = 'https://smyagency.de';
const ALT = 'SMY Agency – Wir entwickeln digitale Produkte für deinen Erfolg: Webdesign, Programmierung und B2B-Vertrieb';
const SKIP_DIRS = new Set(['.git', 'gstack', '.gstack', 'node_modules', 'tests', 'scripts', '_src', 'assets', 'images', 'public', 'videos', 'fonts']);

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_CORE, 'playwright-core', 'playwright'].filter(Boolean);
  for (const candidate of candidates) {
    try { return require(candidate); } catch { /* nächsten Kandidaten probieren */ }
  }
  throw new Error('playwright-core nicht gefunden – PLAYWRIGHT_CORE auf den Paketpfad setzen.');
}

async function render() {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    await page.goto('file://' + TEMPLATE);
    await page.waitForFunction(() => document.body.dataset.fertig === '1' && document.fonts.status === 'loaded');
    await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
    const loaded = await page.evaluate(() => document.fonts.check('300 78px Archivo'));
    if (!loaded) throw new Error('Schrift Archivo nicht geladen – Pfad in og.html prüfen.');
    for (const quality of QUALITIES) {
      const buffer = await page.screenshot({ type: 'jpeg', quality, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
      if (buffer.length <= MAX_BYTES) return { buffer, quality };
    }
    throw new Error(`OG-Bild bleibt über ${MAX_BYTES} Bytes – Vorlage vereinfachen.`);
  } finally {
    await browser.close();
  }
}

const walkHtml = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
  const rel = path.join(dir, entry.name);
  if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walkHtml(rel);
  return entry.name.endsWith('.html') ? [rel] : [];
});

/** Ersetzt den OG-/Twitter-Bildblock einer Seite; liefert den neuen Quelltext (unverändert, wenn kein og:image). */
function updateTags(source, imageUrl) {
  const ogLine = source.match(/^([ \t]*)<meta property="og:image" content="([^"]*)" \/>\n/m);
  if (!ogLine) return source;
  // Seiten mit eigenem OG-Bild (anderer Dateiname) bleiben unverändert
  if (!ogLine[2].startsWith(`${SITE}/${OUTPUT_REL}`)) return source;
  const indent = ogLine[1];
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const cleaned = source
    .replace(/^[ \t]*<meta property="og:image:(width|height|alt|type)" content="[^"]*" \/>\n/gm, '')
    .replace(/^[ \t]*<meta name="twitter:image:alt" content="[^"]*" \/>\n/gm, '');
  const ogBlock = [
    `<meta property="og:image" content="${imageUrl}" />`,
    '<meta property="og:image:type" content="image/jpeg" />',
    `<meta property="og:image:width" content="${WIDTH}" />`,
    `<meta property="og:image:height" content="${HEIGHT}" />`,
    `<meta property="og:image:alt" content="${esc(ALT)}" />`,
  ].map((line) => indent + line + '\n').join('');
  return cleaned
    .replace(/^[ \t]*<meta property="og:image" content="[^"]*" \/>\n/m, ogBlock)
    .replace(/^([ \t]*)<meta name="twitter:image" content="[^"]*" \/>\n/m,
      (_, ind) => `${ind}<meta name="twitter:image" content="${imageUrl}" />\n${ind}<meta name="twitter:image:alt" content="${esc(ALT)}" />\n`);
}

async function main() {
  const { buffer, quality } = await render();
  fs.writeFileSync(OUTPUT, buffer);
  const version = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 10);
  const imageUrl = `${SITE}/${OUTPUT_REL}?v=${version}`;
  const changed = walkHtml('.').filter((file) => {
    const full = path.join(ROOT, file);
    const before = fs.readFileSync(full, 'utf8');
    const after = updateTags(before, imageUrl);
    if (after !== before) fs.writeFileSync(full, after);
    return /property="og:image"/.test(after) && after.includes(imageUrl);
  });
  console.log(`OG-Bild: ${OUTPUT_REL} (${Math.round(buffer.length / 1024)} KB, Qualität ${quality}, v=${version})`);
  console.log(`Seiten mit neuem og:image: ${changed.length} – ${changed.join(', ')}`);
}

main().catch((err) => {
  console.error('[build-og]', err.message);
  process.exit(1);
});
