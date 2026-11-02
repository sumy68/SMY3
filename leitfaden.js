/* Setzt beim Absenden den Betreff der Leitfaden-Fragebogen-Mail mit dem Namen. */
(function () {
  var form = document.getElementById('leitfaden-form');
  if (!form) return;
  form.addEventListener('submit', function () {
    form.elements._subject.value = 'Leitfaden-Fragebogen: ' + form.elements.name.value.trim();
  });
})();
