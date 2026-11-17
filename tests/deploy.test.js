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
  // Startseite: Archivo inline per @font-face (spart render-blockierendes fonts.css) + Preload der Hero-Schrift
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(index.includes('rel="preload" href="/fonts/archivo-latin.woff2"'), 'Preload Hero-Schrift');
  const indexFonts = [...index.matchAll(/url\((\/fonts\/[^)]+\.woff2)\)/g)].map((match) => match[1]);
  assert.ok(indexFonts.length >= 2, 'Archivo @font-face inline');
  indexFonts.forEach((file) => assert.ok(fs.existsSync(path.join(ROOT, file)), file));
  assert.ok(/font-display:\s*swap/.test(index), 'font-display: swap');
});

test('Logo-Originale gehen nicht live, die zugeschnittenen schon', () => {
  assert.ok(excludes.includes('images/logos/*-original.png'));
  ['ci-dienstleistungen-logo-gebaeudereinigung', 'psynow-logo-online-psychologieberatung'].forEach((name) => {
    assert.ok(fs.existsSync(path.join(ROOT, `images/logos/${name}-original.png`)), name);
    assert.ok(fs.existsSync(path.join(ROOT, `images/logos/${name}.png`)), name);
  });
});

/* ─── Bilddateien: SEO-sprechende Namen, keine toten Verweise, Alt-URLs nur als Kopie ─── */
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i;
const LEGACY_IMAGES = [
  'assets/logo-header.png', 'assets/logo-dunkel.png', 'assets/logo-dunkel.webp', 'assets/logo.jpg',
  'assets/suemi.jpg', 'images/hero.jpg', 'images/logo-signatur.png',
];
const IMAGE_DIRS = ['assets', 'images', 'public'];
const listImages = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
  const rel = path.posix.join(dir, entry.name);
  if (entry.isDirectory()) return listImages(rel);
  return IMAGE_EXT.test(entry.name) ? [rel] : [];
});
const sourcesWithImages = () => [...walk('.'), 'sitemap.xml', ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.css'))];
const referencedImages = () => sourcesWithImages().flatMap((file) => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return [...source.matchAll(/(?:https:\/\/smyagency\.de)?\/?((?:assets|images|public)\/[\w./-]+\.(?:png|jpe?g|webp|avif|gif|svg|ico))/gi)]
    .map((match) => ({ file, src: match[1] }));
});

test('alle Bilddateien sind SEO-sprechend benannt (klein, Bindestriche, keine Umlaute)', () => {
  IMAGE_DIRS.flatMap(listImages).filter((file) => !LEGACY_IMAGES.includes(file)).forEach((file) => {
    assert.match(path.basename(file), /^[a-z0-9]+(?:-[a-z0-9]+)+\.(png|jpe?g|webp|avif|gif|svg|ico)$/, file);
  });
});

test('jedes verlinkte Bild existiert', () => {
  const refs = referencedImages();
  assert.ok(refs.length > 20);
  refs.forEach(({ file, src }) => assert.ok(fs.existsSync(path.join(ROOT, src)), `${file}: ${src}`));
});

test('alte Bild-URLs bleiben erreichbar, werden aber nirgends mehr verlinkt', () => {
  LEGACY_IMAGES.forEach((legacy) => assert.ok(fs.existsSync(path.join(ROOT, legacy)), legacy));
  referencedImages().forEach(({ file, src }) => assert.ok(!LEGACY_IMAGES.includes(src), `${file}: ${src}`));
});

test('sitemap.xml führt die wichtigsten Bilder als image:image', () => {
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
  ['assets/smy-agency-logo-dunkel.png', 'assets/suemeyye-abur-gruenderin-smy-agency.jpg',
    'images/logos/psynow-logo-online-psychologieberatung.png', 'images/logos/ci-dienstleistungen-logo-gebaeudereinigung.png']
    .forEach((img) => assert.ok(sitemap.includes(`<image:loc>https://smyagency.de/${img}</image:loc>`), img));
});
