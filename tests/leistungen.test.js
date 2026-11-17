// Leistungen-Akkordeon der Startseite (#leistungen, „Eine Brand, die hängen bleibt – on- und offline.“)
// Ausführen mit: node --test tests/leistungen.test.js
// Die Browser-Tests brauchen playwright-core (require-bar oder Pfad in PLAYWRIGHT_CORE) samt installierten
// Chromium-/WebKit-Browsern; fehlt das, werden nur die statischen Prüfungen ausgeführt.
// Optional: WEBKIT_PATH / CHROMIUM_PATH zeigen auf eine bereits installierte Browser-Binary.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const ANIMATION_MS = 450;
const CLOSED_MAX_PX = 6;

const loadPlaywright = () => {
  const candidates = [process.env.PLAYWRIGHT_CORE, 'playwright-core', 'playwright'].filter(Boolean);
  for (const candidate of candidates) {
    try { return require(candidate); } catch { /* nächsten Kandidaten probieren */ }
  }
  return null;
};

test('jeder Kopf ist ein Button mit aria-expanded und aria-controls auf ein vorhandenes Panel', () => {
  const heads = [...html.matchAll(/<button([^>]*class="l__kopf"[^>]*)>/g)].map((m) => m[1]);
  assert.ok(heads.length >= 1);
  heads.forEach((attrs) => {
    assert.match(attrs, /type="button"/);
    assert.match(attrs, /aria-expanded="(true|false)"/);
    const controls = attrs.match(/aria-controls="([^"]+)"/);
    assert.ok(controls, attrs);
    assert.ok(html.includes(`id="${controls[1]}"`), controls[1]);
  });
  assert.strictEqual(heads.filter((a) => a.includes('aria-expanded="true"')).length, 1);
});

test('Akkordeon wird nicht im Leerlauf-Init und nicht per Hover gebunden', () => {
  const js = fs.readFileSync(path.join(ROOT, 'startseite.js'), 'utf8');
  assert.ok(!/#leistungen \.l/.test(js), 'startseite.js darf das Akkordeon nicht (verzögert) binden');
  assert.ok(html.includes("liste.setAttribute('data-akkordeon','bereit')"), 'Guard gegen doppeltes Binden fehlt');
});

const serve = () => new Promise((resolve) => {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
  const server = http.createServer((req, res) => {
    let file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(body);
    });
  });
  server.listen(0, '127.0.0.1', () => resolve(server));
});

// Zustand aller Einträge: aria-expanded, Klasse, sichtbare Höhe des Panels
const readState = (page) => page.$$eval('#leistungen > .l', (items) => items.map((li) => {
  const head = li.querySelector('.l__kopf');
  const panel = li.querySelector('.l__text');
  return {
    expanded: head.getAttribute('aria-expanded') === 'true',
    offen: li.classList.contains('offen'),
    height: Math.round(panel.getBoundingClientRect().height),
    visibility: getComputedStyle(panel).visibility,
    plusRotation: getComputedStyle(li.querySelector('.l__plus'), '::after').transform,
  };
}));

const settle = (page) => page.waitForTimeout(ANIMATION_MS + 150);

const assertConsistent = (state, openIndex) => {
  state.forEach((s, i) => {
    const shouldBeOpen = i === openIndex;
    assert.strictEqual(s.expanded, shouldBeOpen, `Eintrag ${i} aria-expanded`);
    assert.strictEqual(s.offen, shouldBeOpen, `Eintrag ${i} Klasse offen`);
    assert.strictEqual(s.visibility, shouldBeOpen ? 'visible' : 'hidden', `Eintrag ${i} visibility`);
    // zu: nur der Rest-Abstand des Absatzes (padding-bottom 6px, bisherige Optik), kein Text sichtbar
    if (shouldBeOpen) assert.ok(s.height > CLOSED_MAX_PX, `Eintrag ${i} ist offen, hat aber Höhe ${s.height}`);
    else assert.ok(s.height <= CLOSED_MAX_PX, `Eintrag ${i} ist zu, hat aber Höhe ${s.height}`);
  });
  // +/–: offenes Icon (Strich ohne Drehung) unterscheidet sich von allen geschlossenen (+)
  if (openIndex >= 0) state.forEach((s, i) => { if (i !== openIndex) assert.notStrictEqual(s.plusRotation, state[openIndex].plusRotation); });
};

const playwright = loadPlaywright();

test('Akkordeon im Browser', { skip: playwright ? false : 'playwright-core nicht gefunden' }, async (t) => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  t.after(() => server.close());

  const setups = [
    { name: 'Chromium Desktop', engine: 'chromium', ctx: { viewport: { width: 1440, height: 900 } }, tap: false },
    { name: 'Chromium Mobil (Touch)', engine: 'chromium', ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, tap: true },
    { name: 'WebKit/Safari Desktop', engine: 'webkit', ctx: { viewport: { width: 1280, height: 800 } }, tap: false },
    { name: 'WebKit/Safari Mobil (Touch)', engine: 'webkit', ctx: { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true }, tap: true },
  ];

  for (const setup of setups) {
    await t.test(setup.name, async (tt) => {
      let browser;
      const executablePath = { chromium: process.env.CHROMIUM_PATH, webkit: process.env.WEBKIT_PATH }[setup.engine];
      try { browser = await playwright[setup.engine].launch(executablePath ? { executablePath } : {}); } catch (err) { tt.skip(`${setup.engine} nicht installiert`); return; }
      tt.after(() => browser.close());
      const context = await browser.newContext(setup.ctx);
      const page = await context.newPage();
      // Nur lokale Dateien; Partikel und Leerlauf-Init blockiert → Akkordeon muss ohne sie funktionieren
      await page.route('**/*', (route) => {
        const url = route.request().url();
        if (!url.startsWith(base) || /smy-3d\.js|startseite\.js/.test(url)) return route.abort();
        return route.continue();
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.locator('#leistungen').scrollIntoViewIfNeeded();
      const heads = page.locator('#leistungen .l__kopf');
      const press = (i, opts) => (setup.tap ? heads.nth(i).tap(opts) : heads.nth(i).click(opts));

      // 1) Klick direkt nach dem Laden (ohne startseite.js): Startzustand und Schließen des offenen Eintrags
      await settle(page);
      assertConsistent(await readState(page), 0);
      await press(0);
      await settle(page);
      assertConsistent(await readState(page), -1);

      // 2) Schnelle Mehrfachklicks während der Animation: ungerade Anzahl = offen, gerade = zu
      for (let n = 0; n < 5; n += 1) await press(2, { delay: 0 });
      await settle(page);
      assertConsistent(await readState(page), 2);
      for (let n = 0; n < 4; n += 1) await press(2, { delay: 0 });
      await settle(page);
      assertConsistent(await readState(page), 2);
      await press(2);
      await page.waitForTimeout(ANIMATION_MS / 3); // mitten in der Schließ-Animation umkehren
      await press(2);
      await settle(page);
      assertConsistent(await readState(page), 2);

      // 3) Mehrere Einträge nacheinander öffnen und schließen
      const count = await heads.count();
      for (let i = 0; i < count; i += 1) {
        await press(i);
        await settle(page);
        assertConsistent(await readState(page), i);
      }
      await press(count - 1);
      await settle(page);
      assertConsistent(await readState(page), -1);

      // 4) Tastatur: Enter und Leertaste
      if (!setup.tap) {
        await heads.nth(1).focus();
        await page.keyboard.press('Enter');
        await settle(page);
        assertConsistent(await readState(page), 1);
        await page.keyboard.press('Space');
        await settle(page);
        assertConsistent(await readState(page), -1);
      }

      assert.deepStrictEqual(errors, []);
    });
  }
});
