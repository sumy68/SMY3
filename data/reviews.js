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

  /* ─── Webdesign ─── */
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: false, bisherigeAngabe: 'Kundenstimme, Dienstleister',
    text: 'Endlich eine Seite, die auch auf dem Handy funktioniert — und wir bekommen Anfragen direkt übers Formular.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: false, bisherigeAngabe: 'Kundenstimme, Handwerk',
    text: 'Schnell, unkompliziert und der Entwurf saß auf Anhieb. Genau so wollte ich es.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['webdesign/index.html'], freigegeben: false, bisherigeAngabe: 'Kundenstimme, Lokal',
    text: 'Wir werden jetzt bei Google gefunden, wo vorher nur die Konkurrenz war.' },

  /* ─── Audit ─── */
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['audit.html'], freigegeben: false, bisherigeAngabe: 'MHM Gartenbau',
    text: 'Website top, Ads laufen – endlich Anfragen im Postfach.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['audit.html'], freigegeben: false, bisherigeAngabe: 'Steuerberater Kavalci',
    text: 'Alles aus einer Hand. Fix, fair, professionell.' },
  { name: '[NAME]', sterne: '[STERNE]', datum: '[MM/JJJJ]', quelle: 'google', seiten: ['audit.html'], freigegeben: false, bisherigeAngabe: 'Eda Dinc',
    text: 'Mehr Buchungen, weniger Aufwand. Hat sich sofort gelohnt.' },
]);
