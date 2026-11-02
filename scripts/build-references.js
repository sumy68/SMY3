#!/usr/bin/env node
/* ==========================================================================
   Schreibt Referenzen, Partner und Google-Bewertungen als statisches HTML in
   die Seiten, jeweils zwischen die START-/END-Marker.
   Ausführen nach jeder Änderung an data/: node scripts/build-references.js
   ========================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const LOGO_EXTENSIONS = ['svg', 'png', 'webp'];
const LOGO_DIRS = { kunde: 'public/clients', partner: 'public/partners' };
const MAX_REVEAL_DELAY = 3;
const COLUMNS = [
  { bereich: 'web', title: 'Web & Development' },
  { bereich: 'branding', title: 'Branding & Design' },
  { bereich: 'marketing', title: 'Marketing & Social' },
];
const PARTNER_SUBLINE = 'Mit unseren Vertriebspartnern bieten wir Ihnen Lösungen über unser eigenes Leistungsportfolio hinaus.';
const REVIEW_NOTE = 'Auszüge aus öffentlichen Google-Bewertungen unseres Unternehmensprofils.';
const PLACEHOLDER = /\[(NAME|STERNE|MM\/JJJJ)\]/;
const SCHEMA_ORG_ID = 'https://smyagency.de/#organization';
const HERO_NEUTRAL = 'Kundenstimmen aus Projekten in ganz Deutschland';
const ANONYMOUS_REVIEW = 'Google-Rezension';
const UNVERIFIED_LABEL = 'Kundenstimme';
const ELEVATED = 'background: var(--bg-elevated); border-block: 1px solid var(--border-subtle);';

/* Rahmen je Seite: Überschriften und Abschlüsse bleiben seitenindividuell.
   Ohne freigegebene Bewertung entfällt der gesamte Block samt Rahmen. */
const REVIEW_PAGES = {
  'index.html': {
    variante: 'ds',
    vor: `<section class="ds-section" id="reviews" style="${ELEVATED}">
      <div class="ds-container">
        <span class="ds-eyebrow reveal">Was unsere Kunden sagen</span>
        <h2 class="ds-section-title reveal" data-delay="1">Bewertungen, die <span class="ds-accent">für sich sprechen</span>.</h2>`,
    nach: (rating) => `<div class="ds-reviews__summary reveal">
          ${ratingSummary(rating)}
          <a href="${esc(rating.profilUrl)}/review" target="_blank" rel="noopener noreferrer" class="btn btn--ghost" data-magnetic>Bewertung schreiben</a>
        </div>
      </div>
    </section>`,
  },
  'leads/index.html': {
    variante: 'ds',
    vor: `<section class="ds-section">
      <div class="ds-container">
        <span class="ds-eyebrow reveal">Kundenstimmen</span>
        <h2 class="ds-section-title reveal" data-delay="1">Das sagen unsere <span class="ds-accent">Kunden</span>.</h2>`,
    nach: `</div>
    </section>`,
  },
  'webdesign/index.html': {
    variante: 'ds',
    vor: `<section class="ds-section" style="${ELEVATED}">
      <div class="ds-container">
        <span class="ds-eyebrow reveal" style="justify-content:center; display:flex;">Social Proof</span>
        <h2 class="ds-section-title reveal" data-delay="1" style="margin-inline:auto; text-align:center;">Das sagen Kunden</h2>`,
    nach: `<p class="wd-proof-note reveal" data-delay="2">Echte Referenzen &amp; Vorher/Nachher-Beispiele zeigen wir Ihnen gerne im Erstgespräch.</p>
      </div>
    </section>`,
  },
  'ugc.html': {
    variante: 'legacy',
    theme: 'dark',
    vor: `<section class="py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10 will-animate">
        <h3 class="text-2xl sm:text-3xl font-extrabold">Sind unsere Creatives auch für dich der größte Hebel für mehr Umsatz?</h3>
        <p class="mt-2 text-[var(--text-muted)]">Wir lassen neue Creatives 14 Tage mit deinen Zielgruppen und Budgets laufen – und vergleichen fair gegen bestehende Creatives.</p>
      </div>`,
    nach: `</div>
  </section>`,
  },
  'audit.html': {
    variante: 'legacy',
    vor: `<section id="socialproof" class="bg-white py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h3 class="text-2xl sm:text-3xl font-extrabold">Was unsere Kunden sagen</h3>
      </div>`,
    nach: `</div>
  </section>`,
  },
  'leitfaden.html': {
    variante: 'legacy',
    vor: `<section class="mt-16 max-w-3xl mx-auto text-center">
      <h3 class="text-2xl font-bold mb-6 gold-text">Was unsere Kunden sagen</h3>`,
    nach: '</section>',
  },
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isRatingSet(rating) {
  return rating.anzahl !== null && rating.anzahl !== undefined && rating.schnitt !== null && rating.schnitt !== undefined;
}

function formatSchnitt(rating) {
  return rating.schnitt.toFixed(1);
}

function ratingSummary(rating) {
  if (!isRatingSet(rating)) return '';
  return `<div>
            <div class="ds-reviews__num">${formatSchnitt(rating)}</div>
            <div class="ds-reviews__sumstars">${'★'.repeat(Math.round(rating.schnitt))}</div>
            <div class="ds-reviews__sumtext">Basierend auf ${rating.anzahl} Google-Bewertungen</div>
          </div>`;
}

/* Google-Zahlen erscheinen erst nach dem Abgleich mit dem Google-Profil. */
function visibleRating(rating, geprueft) {
  return geprueft ? rating : { ...rating, anzahl: null, schnitt: null };
}

function renderHeroRating(rating) {
  if (!isRatingSet(rating)) return `<span>${HERO_NEUTRAL}</span>`;
  return `<span>★ ${formatSchnitt(rating)} aus ${rating.anzahl} Google-Bewertungen</span>`;
}

/* Setzt oder entfernt aggregateRating im Schema, andere Knoten bleiben unverändert. */
function applyRatingToSchema(html, rating) {
  const pattern = /(<script type="application\/ld\+json">\n)([\s\S]*?)(\n\s*<\/script>)/;
  const match = html.match(pattern);
  if (!match) throw new Error('index.html: Schema-Block fehlt');
  const schema = JSON.parse(match[2]);
  const graph = schema['@graph'].map((node) => {
    if (node['@id'] !== SCHEMA_ORG_ID) return node;
    const { aggregateRating, ...rest } = node;
    if (!isRatingSet(rating)) return rest;
    return {
      ...rest,
      aggregateRating: { '@type': 'AggregateRating', ratingValue: formatSchnitt(rating), reviewCount: String(rating.anzahl) },
    };
  });
  const json = JSON.stringify({ ...schema, '@graph': graph }, null, 2).replace(/^/gm, '  ');
  return html.replace(pattern, (_, open, __, close) => `${open}${json}${close}`);
}

function loadData(root) {
  const sandbox = { window: {} };
  ['references', 'reviews'].forEach((name) => {
    const file = path.join(root, 'data', `${name}.js`);
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  });
  return {
    references: Array.from(sandbox.window.SMY_REFERENCES),
    reviews: Array.from(sandbox.window.SMY_REVIEWS),
    googleRating: sandbox.window.googleRating,
    reviewsGeprueft: sandbox.window.reviewsGeprueft === true,
    profileUrl: sandbox.window.googleRating.profilUrl,
  };
}

function validateReferences(entries) {
  return entries.flatMap((entry) => {
    const label = entry.name || '(ohne Name)';
    const errors = [];
    if (!entry.name) errors.push(`${label}: name fehlt`);
    if (!LOGO_DIRS[entry.typ]) errors.push(`${label}: typ muss "kunde" oder "partner" sein`);
    if (!entry.leistung) errors.push(`${label}: leistung fehlt`);
    if (typeof entry.featured !== 'boolean') errors.push(`${label}: featured muss true/false sein`);
    if (typeof entry.order !== 'number') errors.push(`${label}: order muss eine Zahl sein`);
    if (entry.url && !/^https?:\/\//.test(entry.url)) errors.push(`${label}: url muss mit http(s):// beginnen`);
    if (entry.logo && !/^\/public\/[\w./-]+$/.test(entry.logo)) errors.push(`${label}: logo muss unter /public/ liegen`);
    if (entry.typ === 'kunde' && !entry.featured && !COLUMNS.some((c) => c.bereich === entry.bereich)) {
      errors.push(`${label}: bereich muss web, branding oder marketing sein`);
    }
    return errors;
  });
}

function validateRating(rating) {
  const errors = [];
  if (!/^https:\/\//.test(rating.profilUrl || '')) errors.push('googleRating.profilUrl muss mit https:// beginnen');
  if (rating.anzahl !== null && (!Number.isInteger(rating.anzahl) || rating.anzahl < 1)) errors.push('googleRating.anzahl muss eine ganze Zahl ab 1 oder null sein');
  if (rating.schnitt !== null && (typeof rating.schnitt !== 'number' || rating.schnitt < 1 || rating.schnitt > 5)) errors.push('googleRating.schnitt muss eine Zahl von 1 bis 5 oder null sein');
  return errors;
}

function validateReviews(reviews, profileUrl) {
  const errors = /^https:\/\//.test(profileUrl || '') ? [] : ['Profil-URL fehlt oder ist ungültig'];
  return errors.concat(reviews.flatMap((review, index) => {
    const label = `Bewertung ${index + 1} ("${String(review.text || '').slice(0, 30)}…")`;
    const list = [];
    if (!review.text) list.push(`${label}: text fehlt`);
    if (review.quelle !== 'google') list.push(`${label}: quelle muss "google" sein`);
    if (typeof review.freigegeben !== 'boolean') list.push(`${label}: freigegeben muss true/false sein`);
    if (!Array.isArray(review.seiten) || !review.seiten.length) list.push(`${label}: seiten fehlt`);
    else review.seiten.filter((s) => !REVIEW_PAGES[s]).forEach((s) => list.push(`${label}: unbekannte Seite ${s}`));
    if (review.freigegeben === true) {
      if (!review.name || PLACEHOLDER.test(review.name)) list.push(`${label}: Name fehlt für die Freigabe`);
      if (!Number.isInteger(review.sterne) || review.sterne < 1 || review.sterne > 5) list.push(`${label}: sterne muss 1 bis 5 sein`);
      if (review.datum !== undefined && !/^(0[1-9]|1[0-2])\/\d{4}$/.test(review.datum)) list.push(`${label}: datum muss MM/JJJJ sein`);
    }
    return list;
  }));
}

function slug(name) {
  return name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* Liefert den Web-Pfad des Logos, falls die Datei wirklich existiert. */
function findLogo(entry, root) {
  const candidates = entry.logo
    ? [entry.logo]
    : LOGO_EXTENSIONS.map((ext) => `/${LOGO_DIRS[entry.typ]}/${slug(entry.name)}.${ext}`);
  return candidates.find((web) => fs.existsSync(path.join(root, web))) || '';
}

function revealAttrs(index) {
  const delay = index % (MAX_REVEAL_DELAY + 1);
  return delay ? ` data-delay="${delay}"` : '';
}

function logoImg(entry, logo, className) {
  return `<img class="${className}" src="${esc(logo)}" alt="Logo ${esc(entry.name)}" loading="lazy" decoding="async" />`;
}

function externalLink(url, inner, className) {
  const cls = className ? ` class="${className}"` : '';
  return `<a${cls} href="${esc(url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
}

function nameHtml(entry) {
  return entry.url ? externalLink(entry.url, esc(entry.name)) : esc(entry.name);
}

function clientLogo(entry, logoFor) {
  const logo = logoFor(entry);
  return logo ? `<span class="ds-ref-logo">${logoImg(entry, logo, 'ds-ref-logo__img')}</span>` : '';
}

function featuredCard(entry, index, logoFor) {
  const parts = [
    clientLogo(entry, logoFor),
    entry.branche ? `<div class="ds-featured__tag">${esc(entry.branche)}</div>` : '',
    `<h3>${nameHtml(entry)}</h3>`,
    `<p>${esc(entry.kurzbeschreibung || entry.leistung)}</p>`,
    entry.ergebnis ? `<p class="ds-ref-result">${esc(entry.ergebnis)}</p>` : '',
    entry.testimonial ? `<blockquote class="ds-ref-quote">${esc(entry.testimonial)}</blockquote>` : '',
    entry.tags && entry.tags.length
      ? `<div class="ds-featured__tags">${entry.tags.map((t) => `<span class="ds-chip">${esc(t)}</span>`).join('')}</div>`
      : '',
  ];
  return `<article class="ds-featured reveal"${revealAttrs(index)}>${parts.join('')}</article>`;
}

function listItem(entry, logoFor) {
  const result = entry.ergebnis ? `<p class="ds-ref-result">${esc(entry.ergebnis)}</p>` : '';
  return `<div class="ds-projitem">${clientLogo(entry, logoFor)}<h4>${nameHtml(entry)}</h4><p>${esc(entry.leistung)}</p>${result}</div>`;
}

function partnerCard(entry, index, logoFor) {
  const logo = logoFor(entry);
  const inner = logo
    ? `<span class="ds-vp__mark has-logo">${logoImg(entry, logo, 'ds-vp__logo')}</span>`
    : `<span class="ds-vp__mark"><span class="ds-vp__wordmark">${esc(entry.name)}</span></span>`;
  const mark = entry.url ? externalLink(entry.url, inner, 'ds-vp__link') : inner;
  return `<li class="ds-vp__item reveal"${revealAttrs(index)}>${mark}<p class="ds-vp__service">${esc(entry.leistung)}</p></li>`;
}

function featuredSection(entries, logoFor) {
  if (!entries.length) return '';
  return `<section class="ds-section" style="${ELEVATED}">
      <div class="ds-container">
        <span class="ds-eyebrow reveal">Featured Work</span>
        <h2 class="ds-section-title reveal" data-delay="1">Projekte, auf die wir <span class="ds-accent">stolz sind</span>.</h2>
        <div class="ds-featured-grid" id="refFeatured">
          ${entries.map((e, i) => featuredCard(e, i, logoFor)).join('\n          ')}
        </div>
      </div>
    </section>`;
}

function listSection(entries, logoFor) {
  const columns = COLUMNS
    .map((c) => ({ title: c.title, items: entries.filter((e) => e.bereich === c.bereich) }))
    .filter((c) => c.items.length);
  if (!columns.length) return '';
  const html = columns.map((c, i) => `<div class="ds-projcat reveal"${revealAttrs(i)}>
            <h3 class="ds-projcat__title">${esc(c.title)}</h3>
            ${c.items.map((e) => listItem(e, logoFor)).join('\n            ')}
          </div>`).join('\n          ');
  return `<section class="ds-section">
      <div class="ds-container">
        <span class="ds-eyebrow reveal">Alle Projekte</span>
        <div class="ds-projcols">
          ${html}
        </div>
      </div>
    </section>`;
}

function partnerSection(entries, logoFor) {
  if (!entries.length) return '';
  return `<section class="ds-section ds-vp" id="vertriebspartner">
      <div class="ds-container">
        <div class="ds-vp__head">
          <span class="ds-eyebrow reveal">Partner</span>
          <h2 class="ds-section-title reveal" data-delay="1">Unsere <span class="ds-accent">Vertriebspartner</span></h2>
          <p class="ds-lead reveal" data-delay="1">${esc(PARTNER_SUBLINE)}</p>
        </div>
        <ul class="ds-vp__grid">
          ${entries.map((e, i) => partnerCard(e, i, logoFor)).join('\n          ')}
        </ul>
      </div>
    </section>`;
}

function renderReferences(entries, logoFor) {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const customers = sorted.filter((e) => e.typ === 'kunde');
  return [
    featuredSection(customers.filter((e) => e.featured), logoFor),
    listSection(customers.filter((e) => !e.featured), logoFor),
    partnerSection(sorted.filter((e) => e.typ === 'partner'), logoFor),
  ].filter(Boolean).join('\n\n    ');
}

function starsHtml(sterne, className) {
  const label = `${sterne} von 5 Sternen`;
  return `<div class="${className}" role="img" aria-label="${label}">${'★'.repeat(sterne)}${'☆'.repeat(5 - sterne)}</div>`;
}

/* Vor dem Abgleich mit dem Google-Profil nennt keine Karte Google als Quelle. */
function reviewView(review, geprueft) {
  if (geprueft) return { ...review, label: 'Google-Bewertung' };
  const anonymous = review.name === ANONYMOUS_REVIEW;
  return { ...review, name: anonymous ? UNVERIFIED_LABEL : review.name, label: anonymous ? '' : UNVERIFIED_LABEL };
}

function reviewMeta(review) {
  return [review.datum && esc(review.datum), review.label].filter(Boolean).join(' · ');
}

function dsReview(review, index) {
  return `<article class="ds-review reveal"${revealAttrs(index)}>
            ${starsHtml(review.sterne, 'ds-review__stars')}
            <p class="ds-review__text">„${esc(review.text)}“</p>
            <div class="ds-review__footer">
              <div class="ds-review__avatar">${esc(Array.from(review.name)[0])}</div>
              <div><div class="ds-review__name">${esc(review.name)}</div><div class="ds-review__meta">${reviewMeta(review)}</div></div>
            </div>
          </article>`;
}

function legacyReview(review) {
  return `<figure class="rv-card">
          ${starsHtml(review.sterne, 'rv-stars')}
          <blockquote class="rv-text">„${esc(review.text)}“</blockquote>
          <figcaption class="rv-meta"><strong>${esc(review.name)}</strong>${reviewMeta(review) ? `<br>${reviewMeta(review)}` : ''}</figcaption>
        </figure>`;
}

function reviewNote(profileUrl) {
  return `<p class="rv-note">${esc(REVIEW_NOTE)} ${externalLink(profileUrl, 'Alle Bewertungen ansehen')}</p>`;
}

function renderReviews(page, reviews, profileUrl, rating = { anzahl: null, schnitt: null, profilUrl: profileUrl }, geprueft = true) {
  const visible = reviews
    .filter((r) => r.freigegeben === true && r.seiten.includes(page))
    .map((r) => reviewView(r, geprueft));
  if (!visible.length) return '';
  const config = REVIEW_PAGES[page];
  const grid = config.variante === 'ds'
    ? `<div class="ds-reviews-grid">\n          ${visible.map(dsReview).join('\n          ')}\n        </div>`
    : `<div class="rv-block${config.theme === 'dark' ? ' rv-block--dark' : ''}">
        <div class="rv-grid">
        ${visible.map(legacyReview).join('\n        ')}
        </div>
        ${geprueft ? reviewNote(profileUrl) : ''}
      </div>`;
  const note = config.variante === 'ds' && geprueft ? `\n        ${reviewNote(profileUrl)}` : '';
  const nach = typeof config.nach === 'function' ? config.nach(rating) : config.nach;
  return [config.vor, `${grid}${note}`, nach].filter(Boolean).join('\n        ');
}

function replaceBetween(html, name, content, file) {
  const start = `<!-- ${name}:START -->`;
  const end = `<!-- ${name}:END -->`;
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from === -1 || to === -1 || to < from || html.indexOf(start, from + 1) !== -1) {
    throw new Error(`${file}: Marker ${start} und ${end} fehlen oder sind ungültig`);
  }
  const body = content ? `\n    ${content}\n    ` : '\n    ';
  return html.slice(0, from + start.length) + body + html.slice(to);
}

/* Liefert { datei: neuer Inhalt }, ohne etwas zu schreiben. */
function buildPages(root) {
  const { references, reviews, profileUrl, googleRating, reviewsGeprueft } = loadData(root);
  const errors = [...validateReferences(references), ...validateReviews(reviews, profileUrl), ...validateRating(googleRating)];
  if (errors.length) throw new Error(`Ungültige Daten:\n- ${errors.join('\n- ')}`);

  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
  const logoFor = (entry) => findLogo(entry, root);
  const rating = visibleRating(googleRating, reviewsGeprueft);
  const pages = {
    'projects/index.html': replaceBetween(read('projects/index.html'), 'REFERENCES', renderReferences(references, logoFor), 'projects/index.html'),
  };
  Object.keys(REVIEW_PAGES).forEach((page) => {
    pages[page] = replaceBetween(read(page), 'REVIEWS', renderReviews(page, reviews, profileUrl, rating, reviewsGeprueft), page);
  });
  pages['index.html'] = applyRatingToSchema(
    replaceBetween(pages['index.html'], 'GOOGLE_RATING', renderHeroRating(rating), 'index.html'),
    rating,
  );
  return pages;
}

function main() {
  const pages = buildPages(ROOT);
  Object.entries(pages).forEach(([file, html]) => fs.writeFileSync(path.join(ROOT, file), html));

  const { references, reviews } = loadData(ROOT);
  const missing = references.filter((e) => !findLogo(e, ROOT)).length;
  const released = reviews.filter((r) => r.freigegeben === true).length;
  console.log(`${Object.keys(pages).length} Seiten geschrieben.`);
  console.log(`Bewertungen: ${released} von ${reviews.length} freigegeben.`);
  console.log(`Logos: ${references.length - missing} vorhanden, ${missing} mit Wortmarke.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  REVIEW_PAGES, applyRatingToSchema, buildPages, findLogo, isRatingSet, loadData, renderHeroRating, renderReferences,
  renderReviews, replaceBetween, slug, validateRating, validateReferences, validateReviews, visibleRating,
};
