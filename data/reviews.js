/* ==========================================================================
   ZENTRALE DATENQUELLE: Google-Bewertungen
   Nach jeder Änderung ausführen: node scripts/build-references.js

   Format: { name, sterne, datum, text, quelle: "google", seiten: [...], freigegeben }
     name         wie bei Google angezeigt
     sterne       Zahl von 1 bis 5
     datum        "MM/JJJJ", z. B. "03/2026"
     text         wörtlich aus Google, ohne Anführungszeichen; Kürzungen als […]
     seiten       index.html, leads/index.html, webdesign/index.html, ugc.html,
                  audit.html, leitfaden.html
     freigegeben  erst nach Prüfung auf true setzen; nur dann erscheint die Bewertung

   bisherigeAngabe ist nur eine Zuordnungshilfe und wird nirgends angezeigt.
   ========================================================================== */
window.SMY_REVIEW_PROFILE_URL = 'https://g.page/r/Cb-CsgZPf7TWEAE';

window.SMY_REVIEWS = Object.freeze([
  /* ─── Startseite ─── */
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['index.html'], freigegeben: false, bisherigeAngabe: 'Elli Sterzl, vor einem Monat, Google',
    text: 'Ich habe mir eine Website von SMY Agency anlegen lassen und bin sehr zufrieden, meine Vorstellungen wurden umgesetzt und auch im Prozess entstandene Änderungswünsche angepasst.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['index.html'], freigegeben: false, bisherigeAngabe: 'Fliesen Ideal GmbH, vor einem Monat, Google',
    text: 'Vielen Dank an die SMY Agency für die mega Website und den Messeaufsteller! Die Zusammenarbeit war easy, schnell und professionell.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['index.html'], freigegeben: false, bisherigeAngabe: 'Yasemin Erdem, vor 4 Monaten, Google',
    text: 'Danke an SMY! 🙌 Wir wurden einen Monat lang über Instagram begleitet, haben viel Neues gelernt und richtig tolle Ergebnisse erzielt. Absolute Empfehlung!' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['index.html'], freigegeben: false, bisherigeAngabe: 'Ceetin Klein, vor 4 Monaten, Google',
    text: 'Meine Webseite, die Flyer und das Werbeschild wurden in kürzester Zeit umgesetzt – und das Ergebnis ist wirklich top.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['index.html'], freigegeben: false, bisherigeAngabe: 'Ismayil Bas, vor 5 Monaten, Google',
    text: 'Die Zusammenarbeit war von Anfang an unkompliziert, freundlich und sehr professionell. Meine Wünsche wurden oft sogar mit kreativen Ideen übertroffen.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['index.html'], freigegeben: false, bisherigeAngabe: 'Mubin Ahmetovic, MHM Garten & Landschaftsbau, Google',
    text: 'Besonders beeindruckt war ich von den fairen Preisen und dem 24/7-Support – ich konnte mich jederzeit melden und bekam sofort Hilfe.' },

  /* ─── Leads ─── */
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['leads/index.html'], freigegeben: false, bisherigeAngabe: 'Michael K., Finanzberater, München',
    text: 'Endlich keine stundenlange Recherche mehr. Die Leads sind sauber, aktuell und direkt in mein CRM importierbar. Habe innerhalb von 2 Wochen 3 neue Mandanten gewonnen.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['leads/index.html'], freigegeben: false, bisherigeAngabe: 'Sandra V., Vertriebsleiterin, Versicherung',
    text: 'Wir haben das Professional-Paket für Steuerberater bestellt. Trefferquote war deutlich höher als bei anderen Anbietern. Preis-Leistung top!' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['leads/index.html'], freigegeben: false, bisherigeAngabe: 'Thomas H., Geschäftsführer, Sales-Agentur',
    text: 'Schnelle Lieferung, alle Daten korrekt. Besonders gut: Die regionale Filterung nach PLZ hat uns viel Zeit gespart. Werden definitiv nachbestellen.' },

  /* ─── Webdesign ─── */
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: false, bisherigeAngabe: 'Kundenstimme, Dienstleister',
    text: 'Endlich eine Seite, die auch auf dem Handy funktioniert — und wir bekommen Anfragen direkt übers Formular.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: false, bisherigeAngabe: 'Kundenstimme, Handwerk',
    text: 'Schnell, unkompliziert und der Entwurf saß auf Anhieb. Genau so wollte ich es.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: false, bisherigeAngabe: 'Kundenstimme, Lokal',
    text: 'Wir werden jetzt bei Google gefunden, wo vorher nur die Konkurrenz war.' },

  /* ─── UGC ─── */
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['ugc.html'], freigegeben: false, bisherigeAngabe: 'Basil Flachsmann, Giahí AG',
    text: 'Schnelle Umsetzung, starke UGC-Hooks, spürbar bessere Akquise­kosten. Kommunikation top.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['ugc.html'], freigegeben: false, bisherigeAngabe: 'Philipp Strobel, Jungholz Designprodukte',
    text: 'Strategie einmal auf links gedreht – endlich strukturiertes Varianten-Testing. Bringt uns richtig voran.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['ugc.html'], freigegeben: false, bisherigeAngabe: 'Simone von Rickenbach, Fidea Design',
    text: 'Erste Ergebnisse nach wenigen Tagen positiv. Fokus auf Zielgruppen war goldrichtig.' },

  /* ─── Audit ─── */
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['audit.html'], freigegeben: false, bisherigeAngabe: 'MHM Gartenbau',
    text: 'Website top, Ads laufen – endlich Anfragen im Postfach.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['audit.html'], freigegeben: false, bisherigeAngabe: 'Steuerberater Kavalci',
    text: 'Alles aus einer Hand. Fix, fair, professionell.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['audit.html'], freigegeben: false, bisherigeAngabe: 'Eda Dinc',
    text: 'Mehr Buchungen, weniger Aufwand. Hat sich sofort gelohnt.' },

  /* ─── Leitfaden ─── */
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['leitfaden.html'], freigegeben: false, bisherigeAngabe: 'Laura M., Kosmetikerin',
    text: 'Der Leitfaden war super individuell und hat mir extrem weitergeholfen! Endlich weiß ich, wie ich auf Instagram strategisch posten kann.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['leitfaden.html'], freigegeben: false, bisherigeAngabe: 'Elias K., Personal Trainer',
    text: 'Ich war zuerst skeptisch, aber die PDF war so umfangreich und auf mein Business zugeschnitten – jeden Cent wert!' },
]);
