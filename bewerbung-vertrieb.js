/* ============================================================
   SMY AGENCY — BEWERBER-FRAGEBOGEN: Formular im Browser
   Baut die Schritte aus data/bewerbung-vertrieb.js und sendet
   per AJAX an Formspree (gleicher Weg wie die übrigen Formulare).
   ============================================================ */
(function () {
  'use strict';

  var config = window.SMY_BEWERBUNG;
  var logik = window.SMY_BEWERBUNG_LOGIK;
  var form = document.getElementById('bw-form');
  if (!form || !config || !logik) return;

  var STORAGE_KEY = 'smy-bewerbung-sends';
  var CONTACT_EMAIL = 'info@smyagency.de';
  var steps = config.steps;
  var current = 0;

  var progressText = document.getElementById('bw-progress-text');
  var progressBar = document.getElementById('bw-progress');
  var progressFill = document.getElementById('bw-progress-fill');
  var stepsRoot = document.getElementById('bw-steps');
  var backBtn = document.getElementById('bw-back');
  var nextBtn = document.getElementById('bw-next');
  var sendError = document.getElementById('bw-send-error');
  var intro = document.getElementById('bw-intro');
  var formSection = document.getElementById('bw-form-section');
  var thanks = document.getElementById('bw-thanks');

  var el = function (tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  var optionValue = function (option) { return typeof option === 'string' ? option : option.value; };
  var optionLabel = function (option) { return typeof option === 'string' ? option : option.label; };

  var todayString = function () {
    var now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };

  /* ── Felder aufbauen ──────────────────────────────────── */
  var buildChoice = function (field, inputType, option, className) {
    var label = el('label', className);
    var input = el('input');
    input.type = inputType;
    input.name = field.id;
    input.value = optionValue(option);
    label.appendChild(input);
    label.appendChild(el('span', '', optionLabel(option)));
    return label;
  };

  var buildScale = function (field) {
    var wrap = el('div');
    var row = el('div', 'bw-scale');
    [1, 2, 3, 4, 5].forEach(function (value) {
      row.appendChild(buildChoice(field, 'radio', String(value), 'bw-choice'));
    });
    var legend = el('div', 'bw-scale__legend');
    legend.appendChild(el('span', '', '1 = gar nicht'));
    legend.appendChild(el('span', '', '5 = ' + field.maxLabel));
    wrap.appendChild(row);
    wrap.appendChild(legend);
    return wrap;
  };

  var buildGroup = function (field) {
    var group = el('fieldset', 'bw-group');
    var legend = el('legend', 'bw-question', field.label + (field.required ? ' *' : ''));
    group.appendChild(legend);
    if (field.hint) group.appendChild(el('p', 'bw-hint', field.hint));
    if (field.type === 'scale') {
      group.appendChild(buildScale(field));
    } else {
      var inputType = field.type === 'checkboxes' ? 'checkbox' : 'radio';
      var list = el('div', 'bw-choices' + (field.compact ? ' bw-choices--compact' : ''));
      field.options.forEach(function (option) {
        list.appendChild(buildChoice(field, inputType, option, 'bw-choice'));
      });
      group.appendChild(list);
    }
    return group;
  };

  var buildCounter = function (input, max) {
    var counter = el('span', 'bw-counter', '0 / ' + max);
    input.addEventListener('input', function () {
      counter.textContent = input.value.length + ' / ' + max;
    });
    return counter;
  };

  var buildControl = function (field) {
    if (field.type === 'select') {
      var select = el('select');
      select.appendChild(el('option', '', 'Bitte wählen…')).value = '';
      field.options.forEach(function (option) {
        select.appendChild(el('option', '', optionLabel(option))).value = optionValue(option);
      });
      return select;
    }
    if (field.type === 'textarea') {
      var area = el('textarea');
      area.rows = 4;
      return area;
    }
    var input = el('input');
    input.type = field.type;
    if (field.type === 'date') input.min = todayString();
    if (field.type === 'tel') input.inputMode = 'tel';
    return input;
  };

  var buildInputField = function (field) {
    var label = el('label', 'ds-field');
    var caption = el('span', 'bw-question', field.label + (field.required ? ' *' : ''));
    var control = buildControl(field);
    control.name = field.id;
    if (field.autocomplete) control.autocomplete = field.autocomplete;
    if (field.maxLength) control.maxLength = field.maxLength;
    label.appendChild(caption);
    label.appendChild(control);
    if (field.type === 'textarea') label.appendChild(buildCounter(control, field.maxLength));
    return label;
  };

  var buildConsent = function (field) {
    var wrap = el('div', 'bw-consent');
    var label = el('label', 'bw-consent__label');
    var input = el('input');
    input.type = 'checkbox';
    input.name = field.id;
    label.appendChild(input);
    label.appendChild(el('span', '', field.label + ' *'));
    var link = el('a', 'bw-link', field.linkText);
    link.href = field.linkHref;
    link.target = '_blank';
    link.rel = 'noopener';
    wrap.appendChild(label);
    wrap.appendChild(link);
    return wrap;
  };

  var buildField = function (field) {
    var isGroup = ['checkboxes', 'radios', 'scale'].indexOf(field.type) !== -1;
    var wrap = el('div', 'bw-field');
    wrap.dataset.field = field.id;
    if (field.showIf) wrap.hidden = true;
    wrap.appendChild(isGroup ? buildGroup(field) : field.type === 'consent' ? buildConsent(field) : buildInputField(field));
    var error = el('p', 'bw-error');
    error.id = 'bw-error-' + field.id;
    error.hidden = true;
    wrap.appendChild(error);
    return wrap;
  };

  var buildStep = function (step, index) {
    var section = el('section', 'bw-step');
    section.dataset.step = String(index);
    section.hidden = index !== 0;
    var title = el('h2', 'bw-step__title', step.title);
    title.tabIndex = -1;
    section.appendChild(title);
    if (step.hint) section.appendChild(el('p', 'bw-hint', step.hint));
    step.fields.forEach(function (field) { section.appendChild(buildField(field)); });
    return section;
  };

  steps.forEach(function (step, index) { stepsRoot.appendChild(buildStep(step, index)); });

  /* ── Antworten lesen ──────────────────────────────────── */
  var fieldsOf = function (step) { return step.fields; };

  var readAnswers = function () {
    var data = new FormData(form);
    return steps.reduce(function (answers, step) {
      return fieldsOf(step).reduce(function (all, field) {
        var entry = {};
        if (field.type === 'checkboxes') entry[field.id] = data.getAll(field.id);
        else if (field.type === 'consent') entry[field.id] = data.has(field.id);
        else entry[field.id] = data.get(field.id) || '';
        return Object.assign({}, all, entry);
      }, answers);
    }, {});
  };

  var fieldNode = function (field) { return form.querySelector('[data-field="' + field.id + '"]'); };

  var syncConditional = function () {
    var answers = readAnswers();
    steps.forEach(function (step) {
      fieldsOf(step).filter(function (field) { return field.showIf; }).forEach(function (field) {
        fieldNode(field).hidden = !logik.isFieldVisible(field, answers);
      });
    });
  };

  /* ── Validierung ──────────────────────────────────────── */
  var showFieldError = function (field, message) {
    var node = fieldNode(field);
    var error = node.querySelector('.bw-error');
    error.textContent = message;
    error.hidden = !message;
    node.classList.toggle('is-invalid', Boolean(message));
    node.querySelectorAll('input, select, textarea').forEach(function (control) {
      if (message) {
        control.setAttribute('aria-invalid', 'true');
        control.setAttribute('aria-describedby', error.id);
      } else {
        control.removeAttribute('aria-invalid');
        control.removeAttribute('aria-describedby');
      }
    });
  };

  var validateStep = function (step) {
    var answers = readAnswers();
    var today = todayString();
    var invalid = fieldsOf(step).filter(function (field) {
      var message = logik.isFieldVisible(field, answers) ? logik.validateField(field, answers[field.id], today) : '';
      showFieldError(field, message);
      return Boolean(message);
    });
    if (invalid.length) {
      // Mittig scrollen, damit die Frage nicht unter dem festen Header verschwindet
      var node = fieldNode(invalid[0]);
      var control = node.querySelector('input, select, textarea');
      if (control) control.focus({ preventScroll: true });
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return invalid.length === 0;
  };

  /* ── Navigation ───────────────────────────────────────── */
  var isLast = function () { return current === steps.length - 1; };

  var showStep = function (index, moveFocus) {
    current = index;
    form.querySelectorAll('.bw-step').forEach(function (section) {
      section.hidden = Number(section.dataset.step) !== index;
    });
    progressText.textContent = 'Schritt ' + (index + 1) + ' von ' + steps.length;
    progressBar.setAttribute('aria-valuenow', String(index + 1));
    progressFill.style.transform = 'scaleX(' + (index + 1) / steps.length + ')';
    backBtn.hidden = index === 0;
    nextBtn.textContent = isLast() ? 'Bewerbung absenden' : 'Weiter';
    sendError.hidden = true;
    if (moveFocus) {
      form.querySelector('[data-step="' + index + '"] .bw-step__title').focus({ preventScroll: true });
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  backBtn.addEventListener('click', function () { showStep(current - 1, true); });

  form.addEventListener('change', function (event) {
    syncConditional();
    var id = event.target.name;
    var field = steps.reduce(function (found, step) {
      return found || fieldsOf(step).find(function (candidate) { return candidate.id === id; });
    }, null);
    if (field && fieldNode(field).classList.contains('is-invalid')) {
      showFieldError(field, logik.validateField(field, readAnswers()[field.id], todayString()));
    }
  });

  /* ── Rate-Limit (pro Browser) ─────────────────────────── */
  var readSends = function () {
    try {
      var stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(stored) ? stored.filter(function (time) { return typeof time === 'number'; }) : [];
    } catch (error) {
      return [];
    }
  };

  var recordSend = function (time) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readSends().concat(time)));
    } catch (error) {
      // Ohne localStorage (privates Fenster) entfällt nur das Rate-Limit, das Senden klappt trotzdem.
      console.warn('Bewerbung: Rate-Limit nicht speicherbar', error);
    }
  };

  /* ── Absenden ─────────────────────────────────────────── */
  var showSendError = function (message) {
    sendError.textContent = message;
    sendError.hidden = false;
  };

  var showThanks = function () {
    intro.hidden = true;
    formSection.hidden = true;
    thanks.hidden = false;
    window.scrollTo(0, 0);
    thanks.querySelector('h1').focus({ preventScroll: true });
  };

  var submit = function () {
    // Honeypot gefüllt: Bot bekommt die Danke-Seite, es wird nichts gesendet.
    if (form.elements._gotcha.value) {
      showThanks();
      return;
    }
    var now = Date.now();
    if (logik.isRateLimited(readSends(), now)) {
      showSendError('Du hast gerade schon mehrfach abgesendet. Bitte versuch es später noch einmal oder schreib uns an ' + CONTACT_EMAIL + '.');
      return;
    }
    var payload = logik.buildPayload(config, readAnswers(), new Date(now).toISOString());
    var body = Object.keys(payload).reduce(function (data, key) {
      data.append(key, payload[key]);
      return data;
    }, new FormData());

    nextBtn.disabled = true;
    nextBtn.textContent = 'Wird gesendet …';
    sendError.hidden = true;

    fetch(config.endpoint, {
      method: 'POST',
      body: body,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('Formspree ' + res.status);
      recordSend(now);
      showThanks();
    }).catch(function (error) {
      console.error('Bewerbung: Senden fehlgeschlagen', error);
      nextBtn.disabled = false;
      nextBtn.textContent = 'Bewerbung absenden';
      showSendError('Senden hat nicht geklappt. Deine Angaben sind noch da. Bitte versuch es noch einmal oder schreib uns an ' + CONTACT_EMAIL + '.');
    });
  };

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (nextBtn.disabled || !validateStep(steps[current])) return;
    if (isLast()) submit();
    else showStep(current + 1, true);
  });

  showStep(0, false);
})();
