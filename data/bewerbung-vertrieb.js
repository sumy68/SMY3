/* ============================================================
   SMY AGENCY — BEWERBER-FRAGEBOGEN VERTRIEB: Inhalte
   Fragen hier ändern oder ergänzen, das Formular baut sich daraus auf.
   Felder: id (eindeutig), type, label, short (Name in der E-Mail),
   required, options, hint, showIf, weight (nur Skala).
   Typen: text, email, tel, date, select, checkboxes, radios, scale,
   textarea, consent. Neue Skalenfragen zählen automatisch zum Score.
   ============================================================ */
window.SMY_BEWERBUNG = {
  endpoint: 'https://formspree.io/f/movggzpl',
  steps: [
    {
      id: 'kontakt',
      title: 'Kontakt',
      fields: [
        { id: 'name', type: 'text', label: 'Vor- und Nachname', short: 'Name', required: true, maxLength: 100, autocomplete: 'name' },
        { id: 'email', type: 'email', label: 'E-Mail', submitName: 'email', required: true, maxLength: 150, autocomplete: 'email' },
        { id: 'telefon', type: 'tel', label: 'Telefonnummer', short: 'Telefon', required: true, maxLength: 30, autocomplete: 'tel' },
        { id: 'wohnort', type: 'text', label: 'Wohnort', short: 'Wohnort', required: true, maxLength: 100, autocomplete: 'address-level2' }
      ]
    },
    {
      id: 'verfuegbarkeit',
      title: 'Verfügbarkeit',
      fields: [
        {
          id: 'tage', type: 'checkboxes', label: 'An welchen Tagen kannst du arbeiten?', short: 'Tage', required: true, compact: true,
          options: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
        },
        {
          id: 'zeiten', type: 'checkboxes', label: 'Zu welchen Zeiten?', short: 'Zeiten', required: true,
          options: [
            { value: 'Vormittags', label: 'Vormittags (8–12 Uhr)' },
            { value: 'Nachmittags', label: 'Nachmittags (12–17 Uhr)' },
            { value: 'Abends', label: 'Abends (17–20 Uhr)' }
          ]
        },
        {
          id: 'stunden', type: 'select', label: 'Wie viele Stunden pro Woche?', short: 'Stunden pro Woche',
          options: [
            { value: 'bis 5', label: 'bis 5' },
            { value: '5–10', label: '5–10' },
            { value: '10–15', label: '10–15' },
            { value: 'mehr als 15', label: 'mehr als 15' }
          ]
        },
        { id: 'start', type: 'date', label: 'Ab wann kannst du starten?', short: 'Start ab' }
      ]
    },
    {
      id: 'selbsteinschaetzung',
      title: 'Selbsteinschätzung',
      hint: 'Bewerte dich ehrlich von 1 bis 5. Es gibt keine falschen Antworten.',
      fields: [
        { id: 'telefonieren', type: 'scale', label: 'Wie gerne telefonierst du?', short: 'Telefonieren (doppelt gewertet)', required: true, weight: 2, maxLabel: 'sehr gerne' },
        { id: 'kaltakquise', type: 'scale', label: 'Wie gerne rufst du fremde Menschen an (Kaltakquise)?', short: 'Kaltakquise (doppelt gewertet)', required: true, weight: 2, maxLabel: 'sehr gerne' },
        { id: 'nein', type: 'scale', label: 'Wie gut kannst du mit einem „Nein“ umgehen, ohne die Motivation zu verlieren?', short: 'Umgang mit Nein', required: true, weight: 1, maxLabel: 'sehr gut' },
        { id: 'organisation', type: 'scale', label: 'Wie gut organisierst du dich selbst im Homeoffice?', short: 'Selbstorganisation', required: true, weight: 1, maxLabel: 'sehr gut' },
        { id: 'emails', type: 'scale', label: 'Wie sicher bist du beim Schreiben professioneller E-Mails?', short: 'E-Mails schreiben', required: true, weight: 1, maxLabel: 'sehr gut' }
      ]
    },
    {
      id: 'erfahrung',
      title: 'Erfahrung & Rahmen',
      fields: [
        { id: 'erfahrung', type: 'radios', label: 'Hast du schon im Vertrieb, Callcenter oder Kundenservice gearbeitet?', short: 'Erfahrung', options: ['Ja', 'Nein'] },
        {
          id: 'erfahrungDauer', type: 'radios', label: 'Wie lange?', short: 'Erfahrung, Dauer',
          showIf: { field: 'erfahrung', equals: 'Ja' },
          options: ['unter 6 Monate', '6–12 Monate', '1–3 Jahre', 'mehr als 3 Jahre']
        },
        {
          id: 'erfahrungArt', type: 'radios', label: 'B2B, B2C oder beides?', short: 'Erfahrung, Bereich',
          showIf: { field: 'erfahrung', equals: 'Ja' },
          options: ['B2B', 'B2C', 'Beides']
        },
        { id: 'andererMinijob', type: 'radios', label: 'Hast du aktuell bereits einen anderen Minijob?', short: 'Anderer Minijob', required: true, hint: 'Wichtig für die Verdienstgrenze', options: ['Ja', 'Nein'] },
        { id: 'ruhigerPlatz', type: 'radios', label: 'Hast du einen ruhigen Arbeitsplatz zum Telefonieren?', short: 'Ruhiger Arbeitsplatz', required: true, options: ['Ja', 'Nein'] },
        { id: 'equipment', type: 'radios', label: 'Hast du Laptop/PC und Headset?', short: 'Laptop/PC und Headset', required: true, options: ['Ja', 'Nur Laptop', 'Nein'] }
      ]
    },
    {
      id: 'motivation',
      title: 'Motivation & Rückruf',
      fields: [
        { id: 'motivation', type: 'textarea', label: 'Warum Vertrieb?', short: 'Warum Vertrieb', maxLength: 300 },
        { id: 'rueckruf', type: 'checkboxes', label: 'Wann dürfen wir dich anrufen?', short: 'Rückruf', required: true, options: ['Vormittags', 'Nachmittags', 'Abends'] },
        {
          id: 'datenschutz', type: 'consent', short: 'Datenschutz-Einwilligung', required: true,
          label: 'Ich willige ein, dass SMY Agency meine Angaben zur Bearbeitung meiner Bewerbung speichert und verarbeitet. Die Daten werden spätestens 6 Monate nach Abschluss des Bewerbungsverfahrens gelöscht.',
          linkText: 'Zur Datenschutzerklärung',
          linkHref: '/datenschutz/'
        },
        {
          id: 'talentpool', type: 'consent', submitName: 'Talentpool', yesNo: true,
          label: 'Optional: Ich möchte in den SMY-Talentpool aufgenommen werden. Dafür dürfen meine Angaben bis zu 12 Monate gespeichert werden, damit ihr mich bei passenden Stellen erneut kontaktieren könnt. Diese Einwilligung kann ich jederzeit per E-Mail an info@smyagency.de widerrufen.'
        }
      ]
    }
  ]
};
