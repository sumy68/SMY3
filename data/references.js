/* ==========================================================================
   ZENTRALE DATENQUELLE: Kundenreferenzen & Vertriebspartner
   Neuer Eintrag = neues Objekt in dieser Liste. Die Seite /projects/ rendert
   daraus automatisch. Leere oder fehlende Felder werden im UI ausgeblendet.

   Pflicht:
     name, typ ("kunde" | "partner"), leistung, featured (true/false), order (Zahl)
   Optional:
     branche, kurzbeschreibung, ergebnis, logo (Pfad), url, testimonial
     bereich  nur Kunden: Spalte in "Alle Projekte" ("web" | "branding" | "marketing")
     tags     nur Kunden: Chips auf den großen Featured-Karten

   Featured-Kunden erscheinen groß oben, alle anderen in "Alle Projekte".
   Partner-Logos: public/partners/<name>.svg. Fehlt die Datei, erscheint die Wortmarke.
   ========================================================================== */
window.SMY_REFERENCES = Object.freeze([
  /* ─── Featured-Kunden ─── */
  {
    name: 'MJ Lernförderung',
    typ: 'kunde',
    branche: 'Bildung',
    leistung: 'Verwaltungsplattform, Website, Branding, Print, Social Media, Google & Meta Ads',
    kurzbeschreibung: 'Rundum-Betreuung für eine Lernförderung in Hannover: eine maßgeschneiderte Verwaltungsplattform (Schüler- & Lehrkraft-Verwaltung, Stundenerfassung mit digitaler Unterschrift, Honorar-Abrechnung per Klick, PDF-/Excel-Nachweise, DSGVO-konform mit EU-Hosting) – plus Website, Logo & Branding, Flyer-Druck, Google-Business-Optimierung sowie laufende Social-Media- und Google-/Meta-Ads-Betreuung.',
    tags: ['Verwaltungsplattform', 'Website', 'Branding', 'Print', 'Google & Meta Ads', 'Social Media', 'DSGVO'],
    featured: true,
    order: 10,
  },
  {
    name: 'Tolgi Versicherung',
    typ: 'kunde',
    branche: 'Versicherung',
    leistung: 'Kfz-Versicherungs-Landingpage & Ads',
    kurzbeschreibung: 'Landingpage für Kfz-Versicherungen und die passenden Ads aus einer Hand.',
    tags: ['Landingpage', 'Ads'],
    featured: true,
    order: 20,
  },
  {
    name: 'Picsart Inc.',
    typ: 'kunde',
    branche: 'Enterprise Tech',
    leistung: 'Entwicklung von 5 hochskalierbaren Plattformen',
    kurzbeschreibung: 'Entwicklung von 5 hochskalierbaren Plattformen: Analytics-Infrastruktur, Live-Kollaboration, Podcast-Hosting, Livestream-Backend und cloudbasierte Video-Editing-Lösung mit GPU-Rendering.',
    tags: ['Backend', 'Cloud Architecture', 'Video Processing'],
    featured: true,
    order: 30,
  },
  {
    name: 'CI Dienstleistungen',
    typ: 'kunde',
    branche: 'Full Service',
    leistung: 'B2B-Akquise & Lead-Generierung, Website, Print, SEO',
    kurzbeschreibung: 'B2B-Akquise und Lead-Generierung, dazu der komplette digitale Auftritt: Website, Printmedien, Spezialanfertigungen (Alu-Dibond), Google Business Setup, SEO-Optimierung und Ticketsystem-Integration.',
    tags: ['B2B-Akquise', 'Lead-Generierung', 'Webdesign', 'Print', 'SEO'],
    featured: true,
    order: 40,
  },

  /* ─── Web & Development ─── */
  { name: 'Nenessa Hotel', typ: 'kunde', bereich: 'web', branche: 'Hotellerie', leistung: 'Website-Erstellung & Google SEO Optimierung', featured: false, order: 100 },
  { name: 'Palace Hotel', typ: 'kunde', bereich: 'web', branche: 'Hotellerie', leistung: 'Website & Google Profil Optimierung', featured: false, order: 110 },
  { name: 'Fastreinigung', typ: 'kunde', bereich: 'web', branche: 'Reinigung', leistung: 'Website-Relaunch mit Webflow', featured: false, order: 120 },
  { name: 'Cleorova Shapewear', typ: 'kunde', bereich: 'web', branche: 'E-Commerce', leistung: 'E-Commerce Website, KI-Produktfotos, Branding & Ads', featured: false, order: 130 },
  { name: 'MHM Garten- & Landschaftsbau', typ: 'kunde', bereich: 'web', branche: 'Garten- & Landschaftsbau', leistung: 'Webdesign & Printdesign', featured: false, order: 140 },
  { name: 'Logikids – Daniela Neuber', typ: 'kunde', bereich: 'web', leistung: 'Webdesign, Flyer & Social Media', featured: false, order: 150 },
  { name: 'Gastpark Hotel', typ: 'kunde', bereich: 'web', branche: 'Hotellerie', leistung: 'Google Unternehmensprofil', featured: false, order: 160 },
  { name: 'Candelized', typ: 'kunde', bereich: 'web', leistung: 'Grafikdesign & Webdesign', featured: false, order: 170 },
  { name: 'Elias Sterzl Gartenbau', typ: 'kunde', bereich: 'web', branche: 'Garten- & Landschaftsbau', leistung: 'Website & Google SEO Optimierung', featured: false, order: 180 },
  { name: 'Uwe Schuster', typ: 'kunde', bereich: 'web', leistung: 'Website, Flyer & Social Media', featured: false, order: 190 },

  /* ─── Branding & Design ─── */
  { name: 'Steuerberater Yusuf Kavalci', typ: 'kunde', bereich: 'branding', branche: 'Steuerberatung', leistung: 'Brand Identity: Logo, Website & Visitenkarten', featured: false, order: 200 },
  { name: 'KFZ-Sachverständiger BAS', typ: 'kunde', bereich: 'branding', branche: 'Kfz-Gutachten', leistung: 'Corporate Design & Website', featured: false, order: 210 },
  { name: 'KG Handel GmbH', typ: 'kunde', bereich: 'branding', branche: 'Handel', leistung: 'Logoerstellung & Firmenstempel', featured: false, order: 220 },
  { name: 'Karise UG', typ: 'kunde', bereich: 'branding', leistung: 'Logo & Brand Identity', featured: false, order: 230 },
  { name: 'DJane Anastasia Chesnocova', typ: 'kunde', bereich: 'branding', branche: 'Musik', leistung: 'Albumcover Design „LIGHTS"', featured: false, order: 240 },

  /* ─── Marketing & Social ─── */
  { name: 'HappINess e. V.', typ: 'kunde', bereich: 'marketing', branche: 'Verein', leistung: 'IT-Betreuung, Website, Print & Social Content', featured: false, order: 300 },
  { name: 'Herbalife Promoter', typ: 'kunde', bereich: 'marketing', leistung: 'Instagram Management & Facebook Ads', featured: false, order: 310 },

  /* ─── Vertriebspartner ─── */
  {
    name: 'PSYNOW',
    typ: 'partner',
    branche: 'Gesundheit',
    leistung: 'Online-Psychologieberatung & Betriebliches Gesundheitsmanagement',
    logo: '/public/partners/psynow.svg',
    url: 'https://psynow.de',
    featured: false,
    order: 10,
  },
  {
    name: 'CI Dienstleistungen',
    typ: 'partner',
    branche: 'Gebäudedienstleistungen',
    leistung: 'Gebäudereinigung & Hausmeisterservice',
    logo: '/public/partners/ci-dienstleistungen.svg',
    featured: false,
    order: 20,
  },
]);
