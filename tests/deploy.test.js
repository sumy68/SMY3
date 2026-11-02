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
