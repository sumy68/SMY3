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

## Offene Punkte

Nicht öffentlich auf der Website, aber im öffentlichen GitHub-Repo sichtbar.

- AV-Vertrag GitHub prüfen
- AV-Vertrag IONOS und aktuelle Firmierung prüfen
- AV-Vertrag Brevo prüfen
- AV-Vertrag Calendly prüfen
- Formspree: Abschluss von AV-Vertrag und Standardvertragsklauseln (SCC) prüfen, Postanschrift fehlt in der Formspree-Erklärung
- Stripe: Rolle (eigener Verantwortlicher oder Auftragsverarbeiter) und mögliche Drittlandübermittlung prüfen
- Cookie-Banner als eigenes Thema, bevor wieder Tracking eingebunden wird

## Bewertungen abgleichen

Jede Bewertung mit dem Google-Profil abgleichen, danach in `data/reviews.js` `reviewsGeprueft` auf `true` setzen und das Build-Skript ausführen. Erst dann heißen die Karten „Google-Bewertung“.

| Nr. | Name | Sterne | Seite | Erster Satz |
|---|---|---|---|---|
| 1 | Elli S. | 5 | index.html | Ich habe mir eine Website von SMY Agency anlegen lassen und bin sehr zufrieden, meine Vorstellungen wurden umgesetzt und auch im Prozess entstandene Änderungswünsche angepasst. |
| 2 | Fliesen Ideal GmbH | 5 | index.html | Vielen Dank an die SMY Agency für die mega Website und den Messeaufsteller! |
| 3 | Yasemin E. | 5 | index.html | Danke an SMY! |
| 4 | Ceetin K. | 5 | index.html | Meine Webseite, die Flyer und das Werbeschild wurden in kürzester Zeit umgesetzt – und das Ergebnis ist wirklich top. |
| 5 | Ismayil B. | 5 | index.html | Die Zusammenarbeit war von Anfang an unkompliziert, freundlich und sehr professionell. |
| 6 | Mubin A. | 5 | index.html | Besonders beeindruckt war ich von den fairen Preisen und dem 24/7-Support – ich konnte mich jederzeit melden und bekam sofort Hilfe. |
| 7 | Michael K. | 5 | leads/index.html | Endlich keine stundenlange Recherche mehr. |
| 8 | Sandra V. | 5 | leads/index.html | Wir haben das Professional-Paket für Steuerberater bestellt. |
| 9 | Thomas H. | 5 | leads/index.html | Schnelle Lieferung, alle Daten korrekt. |
| 10 | Google-Rezension | 5 | webdesign/index.html | Endlich eine Seite, die auch auf dem Handy funktioniert — und wir bekommen Anfragen direkt übers Formular. |
| 11 | Google-Rezension | 5 | webdesign/index.html | Schnell, unkompliziert und der Entwurf saß auf Anhieb. |
| 12 | Google-Rezension | 5 | webdesign/index.html | Wir werden jetzt bei Google gefunden, wo vorher nur die Konkurrenz war. |
| 13 | Basil F. | 5 | ugc.html | Schnelle Umsetzung, starke UGC-Hooks, spürbar bessere Akquisekosten. |
| 14 | Philipp S. | 5 | ugc.html | Strategie einmal auf links gedreht – endlich strukturiertes Varianten-Testing. |
| 15 | Simone R. | 5 | ugc.html | Erste Ergebnisse nach wenigen Tagen positiv. |
| 16 | MHM Gartenbau | 5 | audit.html | Website top, Ads laufen – endlich Anfragen im Postfach. |
| 17 | Yusuf K. | 5 | audit.html | Alles aus einer Hand. |
| 18 | Eda D. | 5 | audit.html | Mehr Buchungen, weniger Aufwand. |
| 19 | Laura M. | 5 | leitfaden.html | Der Leitfaden war super individuell und hat mir extrem weitergeholfen! |
| 20 | Elias K. | 5 | leitfaden.html | Ich war zuerst skeptisch, aber die PDF war so umfangreich und auf mein Business zugeschnitten – jeden Cent wert! |
