/* ============================================================
   SMY AGENCY — BEWERBER-FRAGEBOGEN: Logik ohne DOM
   Validierung, Auswertung und E-Mail-Inhalt.
   Tests: node --test tests/bewerbung-vertrieb.test.js
   ============================================================ */
(function () {
  'use strict';

  var WORKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
  var RATE_LIMIT_MAX = 3;
  var RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
  var NO_ANSWER = 'keine Angabe';

  var isEmpty = function (value) {
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === false || String(value).trim() === '';
  };

  var isValidEmail = function (value) {
    return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(String(value).trim());
  };

  var isValidPhone = function (value) {
    var text = String(value).trim();
    var digits = text.replace(/\D/g, '');
    return /^\+?[\d\s()/-]+$/.test(text) && digits.length >= 7 && digits.length <= 15;
  };

  var isFieldVisible = function (field, answers) {
    return !field.showIf || answers[field.showIf.field] === field.showIf.equals;
  };

  var requiredMessage = function (field) {
    if (field.type === 'consent') return 'Bitte stimme zu, damit wir deine Bewerbung bearbeiten können.';
    if (field.type === 'checkboxes') return 'Bitte wähle mindestens eine Option.';
    if (field.type === 'scale' || field.type === 'radios') return 'Bitte wähle eine Antwort.';
    return 'Bitte fülle dieses Feld aus.';
  };

  // Liefert die Fehlermeldung oder einen leeren String. today im Format JJJJ-MM-TT.
  var validateField = function (field, value, today) {
    if (isEmpty(value)) return field.required ? requiredMessage(field) : '';
    if (field.type === 'email' && !isValidEmail(value)) return 'Bitte gib eine gültige E-Mail-Adresse ein.';
    if (field.type === 'tel' && !isValidPhone(value)) return 'Bitte gib eine gültige Telefonnummer ein, z. B. 0151 12345678.';
    if (field.type === 'date' && value < today) return 'Das Datum darf nicht in der Vergangenheit liegen.';
    if (field.maxLength && String(value).length > field.maxLength) return 'Bitte maximal ' + field.maxLength + ' Zeichen.';
    return '';
  };

  var allFields = function (steps) {
    return steps.reduce(function (fields, step) { return fields.concat(step.fields); }, []);
  };

  var computeScore = function (steps, answers) {
    return allFields(steps)
      .filter(function (field) { return field.type === 'scale'; })
      .reduce(function (total, field) {
        return {
          score: total.score + (Number(answers[field.id]) || 0) * field.weight,
          max: total.max + 5 * field.weight
        };
      }, { score: 0, max: 0 });
  };

  var computeFlags = function (answers) {
    var days = answers.tage || [];
    var times = answers.zeiten || [];
    var workdays = days.filter(function (day) { return WORKDAYS.indexOf(day) !== -1; });
    var hasDaytime = times.indexOf('Vormittags') !== -1 || times.indexOf('Nachmittags') !== -1;
    var noEquipment = answers.ruhigerPlatz === 'Nein' || answers.equipment === 'Nur Laptop' || answers.equipment === 'Nein';
    return [workdays.length >= 3 && hasDaytime ? '✅ Passt zeitlich' : '⚠️ Zeitlich eingeschränkt']
      .concat(answers.andererMinijob === 'Ja' ? ['⚠️ Schon Minijob'] : [])
      .concat(noEquipment ? ['⚠️ Kein Equipment'] : []);
  };

  var buildSubject = function (name, result, flags) {
    var cleanName = String(name).replace(/[\r\n]+/g, ' ').trim();
    return 'Bewerbung Vertrieb: ' + cleanName + ', Score ' + result.score + '/' + result.max + ', ' + flags.join(', ');
  };

  var formatAnswer = function (field, value, submittedAt) {
    if (field.type === 'consent') return value ? 'Ja, erteilt am ' + submittedAt : 'Nein';
    if (isEmpty(value)) return NO_ANSWER;
    if (Array.isArray(value)) return value.join(', ');
    if (field.type === 'date') return String(value).split('-').reverse().join('.');
    return String(value).trim();
  };

  // Reihenfolge = Reihenfolge in der E-Mail: erst die Auswertung, dann die Antworten je Schritt.
  var buildPayload = function (config, answers, submittedAt) {
    var result = computeScore(config.steps, answers);
    var flags = computeFlags(answers);
    var head = {
      _subject: buildSubject(answers.name, result, flags),
      Score: result.score + '/' + result.max,
      Flags: flags.join(', ')
    };
    return config.steps.reduce(function (payload, step, index) {
      return step.fields
        .filter(function (field) { return isFieldVisible(field, answers); })
        .reduce(function (entries, field) {
          var key = field.submitName || (index + 1) + '. ' + step.title + ': ' + field.short;
          var entry = {};
          entry[key] = formatAnswer(field, answers[field.id], submittedAt);
          return Object.assign({}, entries, entry);
        }, payload);
    }, head);
  };

  var isRateLimited = function (timestamps, now) {
    var recent = timestamps.filter(function (time) { return now - time < RATE_LIMIT_WINDOW_MS; });
    return recent.length >= RATE_LIMIT_MAX;
  };

  window.SMY_BEWERBUNG_LOGIK = {
    isValidEmail: isValidEmail,
    isValidPhone: isValidPhone,
    isFieldVisible: isFieldVisible,
    validateField: validateField,
    computeScore: computeScore,
    computeFlags: computeFlags,
    buildSubject: buildSubject,
    buildPayload: buildPayload,
    isRateLimited: isRateLimited
  };
})();
