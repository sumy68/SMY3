# SMY Agency Website

Statische Website ohne Dependencies.

## Referenzen, Partner und Bewertungen

Nach Änderung an data/ → `node scripts/build-references.js` ausführen.

Das Skript schreibt das fertige HTML zwischen die Marker in den Seiten. Änderungen zwischen den Markern von Hand gehen beim nächsten Lauf verloren.

- **Kunden und Partner:** `data/references.js`
- **Google-Bewertungen:** `data/reviews.js`. Sichtbar erst mit `freigegeben: true`, Name und Sternen; das Datum ist optional.
- **Bewertungszahlen:** `googleRating` in `data/reviews.js`. Schema und Hero der Startseite erscheinen erst, wenn `anzahl` und `schnitt` gesetzt sind.
- **Logos:** `public/clients/<name>.svg` und `public/partners/<name>.svg`, auch `.png` oder `.webp`. Der Dateiname ist der Name in Kleinbuchstaben mit Bindestrichen, z. B. `ci-dienstleistungen.svg`. Fehlt die Datei, erscheint die Wortmarke.

## Tests

`node --test tests/*.test.js`
