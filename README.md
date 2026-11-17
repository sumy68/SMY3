# SMY Agency Website

Statische Website ohne Dependencies.

## Referenzen, Partner und Bewertungen

Nach Änderung an data/ → `node scripts/build-references.js` ausführen.

Das Skript schreibt das fertige HTML zwischen die Marker in den Seiten. Änderungen zwischen den Markern von Hand gehen beim nächsten Lauf verloren.

- **Kunden und Partner:** `data/references.js`
- **Google-Bewertungen:** `data/reviews.js`. Sichtbar erst mit `freigegeben: true`, Name und Sternen; das Datum ist optional.
- **Bewertungszahlen:** `googleRating` und `reviewsGeprueft` in `data/reviews.js`. Schema und Hero der Startseite nennen die Zahlen erst, wenn der Schalter an ist und `anzahl` und `schnitt` gesetzt sind.
- **Logos:** Feld `logo` in `data/references.js` (die Partner-Logos liegen unter `images/logos/`), sonst `public/clients/<name>.svg` und `public/partners/<name>.svg`, auch `.png` oder `.webp`. Der Dateiname ist der Name in Kleinbuchstaben mit Bindestrichen, z. B. `ci-dienstleistungen.svg`. Fehlt die Datei, erscheint die Wortmarke.

## Tests

`node --test tests/*.test.js`

## Tailwind und Schriften

`tailwind.css` ist fertig gebaut und enthält nur die genutzten Klassen. Nach neuen Tailwind-Klassen in den älteren Seiten neu bauen:

`npx tailwindcss@3.4.17 --content "./{audit,datenschutz-socialpro,leitfaden,shop,terms-socialpro,support,ugc,workbook-danke,website-mieten,workbook}.html,./main.js,./partials/*.html,./scripts/build-references.js" -o tailwind.css --minify`

Schriften liegen in `fonts/` und werden über `fonts/fonts.css` eingebunden.

Interne Notizen liegen lokal.

## Neuer Look (schwarz-rot, Partikel)

- Startseite: `index.html` mit `startseite.js` (Interaktionen) und `smy-3d.js` (Partikel-Hintergrund).
- Unterseiten: `smy-neu.css` wird nach allen anderen Stylesheets geladen und legt den neuen Stil über das Design-System. Dazu `smy-3d.js` für die Partikel.
- three.js liegt lokal unter `assets/three.min.js`, die Schrift Archivo unter `fonts/` – keine externen Requests.
- Logo für dunkle Hintergründe (weiße Schrift): `assets/smy-agency-logo-dunkel.png` / `.webp`. Für helle Hintergründe, Favicon, Schema und Partikel-Form: `assets/smy-agency-logo-hell.png`.

## Bilddateien

Bilder SEO-sprechend benennen: Inhalt + Leistung/Kontext (+ Ort), Kleinbuchstaben, Bindestriche, keine Umlaute. KI-Bilder im Alt-Text (und wo sinnvoll im Namen) als „Symbolbild“ kennzeichnen. Wichtige Bilder je Seite stehen als `image:image` in `sitemap.xml`.

Alt-URLs, die extern verlinkt sein können, bleiben als Kopie liegen, werden aber nirgends verlinkt (GitHub Pages kann keine 301): `assets/logo-header.png`, `assets/logo-dunkel.png`, `assets/logo-dunkel.webp`, `assets/logo.jpg`, `assets/suemi.jpg`, `images/hero.jpg`, `images/logo-signatur.png`. `tests/deploy.test.js` stellt sicher, dass sie nicht wieder verlinkt werden.
