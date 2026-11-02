// Prüft, was GitHub Pages ausliefert. Ausführen mit: node --test tests/deploy.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const excludes = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8')
  .split('\n').filter((line) => /^\s+- /.test(line)).map((line) => line.replace(/^\s+- /, '').trim());
const SKIP = new Set(['.git', 'gstack', '.gstack', 'node_modules', 'tests', 'scripts', 'videos', 'assets', 'images', 'public']);

const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
  const rel = path.join(dir, entry.name);
  if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : walk(rel);
  return /\.(html|js)$/.test(entry.name) ? [rel] : [];
});

test('Entwicklungs- und Build-Dateien sind ausgeschlossen', () => {
  ['tests/', 'scripts/', 'README.md', 'package*.json', 'data/reviews.js', 'data/references.js'].forEach((entry) => {
    assert.ok(excludes.includes(entry), entry);
  });
});

test('im Browser geladene Dateien sind nicht ausgeschlossen', () => {
  assert.ok(!excludes.some((entry) => entry === 'data/' || entry === 'data/bewerbung-vertrieb.js'));
  const referenced = walk('.').flatMap((file) => {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    return [...source.matchAll(/<script[^>]*\bsrc="\/?([^"]+\.js)"/g)].map((match) => match[1]);
  });
  assert.ok(referenced.includes('data/bewerbung-vertrieb.js'));
  referenced.forEach((src) => assert.ok(!excludes.includes(src), src));
});

test('kein Meta Pixel mehr auf der Website', () => {
  walk('.').forEach((file) => {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(!/fbq\(|fbevents|facebook\.com\/tr|connect\.facebook\.net/.test(source), file);
  });
});

const allPages = () => walk('.').filter((file) => file.endsWith('.html'));

test('keine Requests an Google Fonts oder das Tailwind-CDN', () => {
  allPages().forEach((file) => {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(!/fonts\.(googleapis|gstatic)\.com|cdn\.tailwindcss\.com/.test(source), file);
  });
});

test('lokale Fonts und Tailwind-CSS sind vorhanden und eingebunden', () => {
  const css = fs.readFileSync(path.join(ROOT, 'fonts/fonts.css'), 'utf8');
  const files = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((match) => match[1]);
  assert.ok(files.length > 0);
  files.forEach((file) => assert.ok(fs.existsSync(path.join(ROOT, 'fonts', file)), file));
  ['DM Sans', 'Space Grotesk', 'Space Mono', 'Poppins'].forEach((family) => assert.ok(css.includes(`font-family: '${family}'`), family));
  assert.ok(fs.statSync(path.join(ROOT, 'tailwind.css')).size > 1000);
  ['audit.html', 'datenschutz-socialpro.html', 'leitfaden.html', 'shop.html', 'terms-socialpro.html', 'support.html', 'ugc.html', 'workbook-danke.html', 'website-mieten.html', 'workbook.html']
    .forEach((file) => assert.ok(fs.readFileSync(path.join(ROOT, file), 'utf8').includes('href="/tailwind.css"'), file));
  assert.ok(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('href="/fonts/fonts.css"'));
});
