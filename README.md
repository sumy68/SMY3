# SMY Agency Website

Statische Website ohne Dependencies.

## Referenzen, Partner und Bewertungen

Nach Änderung an data/ → `node scripts/build-references.js` ausführen.

Das Skript schreibt das fertige HTML zwischen die Marker in den Seiten. Änderungen zwischen den Markern von Hand gehen beim nächsten Lauf verloren.

- **Kunden und Partner:** `data/references.js`
- **Google-Bewertungen:** `data/reviews.js`. Sichtbar erst mit `freigegeben: true`, Name und Sternen; das Datum ist optional.
- **Bewertungszahlen:** `googleRating` und `reviewsGeprueft` in `data/reviews.js`. Schema und Hero der Startseite nennen die Zahlen erst, wenn der Schalter an ist und `anzahl` und `schnitt` gesetzt sind.
- **Logos:** `public/clients/<name>.svg` und `public/partners/<name>.svg`, auch `.png` oder `.webp`. Der Dateiname ist der Name in Kleinbuchstaben mit Bindestrichen, z. B. `ci-dienstleistungen.svg`. Fehlt die Datei, erscheint die Wortmarke.

## Tests

`node --test tests/*.test.js`

## Tailwind und Schriften

`tailwind.css` ist fertig gebaut und enthält nur die genutzten Klassen. Nach neuen Tailwind-Klassen in den älteren Seiten neu bauen:

`npx tailwindcss@3.4.17 --content "./{audit,datenschutz-socialpro,leitfaden,shop,terms-socialpro,support,ugc,workbook-danke,website-mieten,workbook}.html,./main.js,./partials/*.html,./scripts/build-references.js" -o tailwind.css --minify`

Schriften liegen in `fonts/` und werden über `fonts/fonts.css` eingebunden.

Interne Notizen liegen lokal.
