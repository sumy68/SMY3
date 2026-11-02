/* ==========================================================================
   ZENTRALE DATENQUELLE: Google-Bewertungen
   Nach jeder Änderung ausführen: node scripts/build-references.js

   Format: { name, sterne, text, quelle: "google", seiten: [...], freigegeben, datum (optional) }
     name         Vorname und Initial oder Firmenname
     sterne       Zahl von 1 bis 5
     datum        optional, "MM/JJJJ", z. B. "03/2026"; fehlt es, wird kein Datum angezeigt
     text         wörtlich aus Google, ohne Anführungszeichen; Kürzungen als […]
     seiten       index.html, leads/index.html, webdesign/index.html, ugc.html,
                  audit.html, leitfaden.html
     freigegeben  erst nach Prüfung auf true setzen; nur dann erscheint die Bewertung

   ========================================================================== */
/* Echte Werte aus dem Google-Profil. Solange anzahl oder schnitt null ist, erscheinen
   weder aggregateRating im Schema noch die Hero-Zeile. schnitt als Zahl, z. B. 4.9. */
window.googleRating = Object.freeze({ anzahl: 120, schnitt: 5.0, profilUrl: 'https://g.page/r/Cb-CsgZPf7TWEAE' });

/* Auf true setzen, sobald alle Bewertungen mit dem Google-Profil abgeglichen sind (Liste in der README).
   Erst dann heißen die Karten "Google-Bewertung" und zeigen Hinweis und Profil-Link. */
window.reviewsGeprueft = false;

window.SMY_REVIEWS = Object.freeze([
  /* ─── Startseite ─── */
  { name: 'Elli S.', sterne: 5, quelle: 'google', seiten: ['index.html'], freigegeben: true,
    text: 'Ich habe mir eine Website von SMY Agency anlegen lassen und bin sehr zufrieden, meine Vorstellungen wurden umgesetzt und auch im Prozess entstandene Änderungswünsche angepasst.' },
  { name: 'Fliesen Ideal GmbH', sterne: 5, quelle: 'google', seiten: ['index.html'], freigegeben: true,
    text: 'Vielen Dank an die SMY Agency für die mega Website und den Messeaufsteller! Die Zusammenarbeit war easy, schnell und professionell.' },
  { name: 'Yasemin E.', sterne: 5, quelle: 'google', seiten: ['index.html'], freigegeben: true,
    text: 'Danke an SMY! 🙌 Wir wurden einen Monat lang über Instagram begleitet, haben viel Neues gelernt und richtig tolle Ergebnisse erzielt. Absolute Empfehlung!' },
  { name: 'Ceetin K.', sterne: 5, quelle: 'google', seiten: ['index.html'], freigegeben: true,
    text: 'Meine Webseite, die Flyer und das Werbeschild wurden in kürzester Zeit umgesetzt – und das Ergebnis ist wirklich top.' },
  { name: 'Ismayil B.', sterne: 5, quelle: 'google', seiten: ['index.html'], freigegeben: true,
    text: 'Die Zusammenarbeit war von Anfang an unkompliziert, freundlich und sehr professionell. Meine Wünsche wurden oft sogar mit kreativen Ideen übertroffen.' },
  { name: 'Mubin A.', sterne: 5, quelle: 'google', seiten: ['index.html'], freigegeben: true,
    text: 'Besonders beeindruckt war ich von den fairen Preisen und dem 24/7-Support – ich konnte mich jederzeit melden und bekam sofort Hilfe.' },

  /* ─── Leads ─── */
  { name: 'Michael K.', sterne: 5, quelle: 'google', seiten: ['leads/index.html'], freigegeben: true,
    text: 'Endlich keine stundenlange Recherche mehr. Die Leads sind sauber, aktuell und direkt in mein CRM importierbar. Habe innerhalb von 2 Wochen 3 neue Mandanten gewonnen.' },
  { name: 'Sandra V.', sterne: 5, quelle: 'google', seiten: ['leads/index.html'], freigegeben: true,
    text: 'Wir haben das Professional-Paket für Steuerberater bestellt. Trefferquote war deutlich höher als bei anderen Anbietern. Preis-Leistung top!' },
  { name: 'Thomas H.', sterne: 5, quelle: 'google', seiten: ['leads/index.html'], freigegeben: true,
    text: 'Schnelle Lieferung, alle Daten korrekt. Besonders gut: Die regionale Filterung nach PLZ hat uns viel Zeit gespart. Werden definitiv nachbestellen.' },

  /* ─── Webdesign ─── */
  { name: 'Google-Rezension', sterne: 5, quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: true,
    text: 'Endlich eine Seite, die auch auf dem Handy funktioniert — und wir bekommen Anfragen direkt übers Formular.' },
  { name: 'Google-Rezension', sterne: 5, quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: true,
    text: 'Schnell, unkompliziert und der Entwurf saß auf Anhieb. Genau so wollte ich es.' },
  { name: 'Google-Rezension', sterne: 5, quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: true,
    text: 'Wir werden jetzt bei Google gefunden, wo vorher nur die Konkurrenz war.' },

  /* ─── UGC ─── */
  { name: 'Basil F.', sterne: 5, quelle: 'google', seiten: ['ugc.html'], freigegeben: true,
    text: 'Schnelle Umsetzung, starke UGC-Hooks, spürbar bessere Akquise­kosten. Kommunikation top.' },
  { name: 'Philipp S.', sterne: 5, quelle: 'google', seiten: ['ugc.html'], freigegeben: true,
    text: 'Strategie einmal auf links gedreht – endlich strukturiertes Varianten-Testing. Bringt uns richtig voran.' },
  { name: 'Simone R.', sterne: 5, quelle: 'google', seiten: ['ugc.html'], freigegeben: true,
    text: 'Erste Ergebnisse nach wenigen Tagen positiv. Fokus auf Zielgruppen war goldrichtig.' },

  /* ─── Audit ─── */
  { name: 'MHM Gartenbau', sterne: 5, quelle: 'google', seiten: ['audit.html'], freigegeben: true,
    text: 'Website top, Ads laufen – endlich Anfragen im Postfach.' },
  { name: 'Yusuf K.', sterne: 5, quelle: 'google', seiten: ['audit.html'], freigegeben: true,
    text: 'Alles aus einer Hand. Fix, fair, professionell.' },
  { name: 'Eda D.', sterne: 5, quelle: 'google', seiten: ['audit.html'], freigegeben: true,
    text: 'Mehr Buchungen, weniger Aufwand. Hat sich sofort gelohnt.' },

  /* ─── Leitfaden ─── */
  { name: 'Laura M.', sterne: 5, quelle: 'google', seiten: ['leitfaden.html'], freigegeben: true,
    text: 'Der Leitfaden war super individuell und hat mir extrem weitergeholfen! Endlich weiß ich, wie ich auf Instagram strategisch posten kann.' },
  { name: 'Elias K.', sterne: 5, quelle: 'google', seiten: ['leitfaden.html'], freigegeben: true,
    text: 'Ich war zuerst skeptisch, aber die PDF war so umfangreich und auf mein Business zugeschnitten – jeden Cent wert!' },
]);
