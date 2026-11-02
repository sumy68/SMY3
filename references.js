/* ==========================================================================
   Rendert Kundenreferenzen & Vertriebspartner aus data/references.js.
   Muss vor design-demo.js laden, damit die Reveal-Animation die Elemente findet.
   ========================================================================== */
(function () {
  'use strict';

  var COLUMNS = [
    { bereich: 'web', title: 'Web & Development' },
    { bereich: 'branding', title: 'Branding & Design' },
    { bereich: 'marketing', title: 'Marketing & Social' },
  ];
  var MAX_REVEAL_DELAY = 3;

  var entries = window.SMY_REFERENCES || [];

  function byOrder(a, b) { return a.order - b.order; }

  function select(predicate) {
    return entries.filter(predicate).sort(byOrder);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function safeUrl(url) {
    return /^https?:\/\//i.test(url || '') ? url : '';
  }

  function externalLink(url, className) {
    var link = el('a', className);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  /* Name, bei vorhandener URL als externer Link */
  function nameNode(entry) {
    var url = safeUrl(entry.url);
    if (!url) return document.createTextNode(entry.name);
    var link = externalLink(url);
    link.textContent = entry.name;
    return link;
  }

  function reveal(node, index) {
    node.classList.add('reveal');
    var delay = index % (MAX_REVEAL_DELAY + 1);
    if (delay) node.dataset.delay = String(delay);
    return node;
  }

  function featuredCard(entry, index) {
    var card = reveal(el('article', 'ds-featured'), index);
    if (entry.branche) card.appendChild(el('div', 'ds-featured__tag', entry.branche));

    var title = el('h3');
    title.appendChild(nameNode(entry));
    card.appendChild(title);

    card.appendChild(el('p', '', entry.kurzbeschreibung || entry.leistung));
    if (entry.ergebnis) card.appendChild(el('p', 'ds-ref-result', entry.ergebnis));
    if (entry.testimonial) card.appendChild(el('blockquote', 'ds-ref-quote', entry.testimonial));

    if (entry.tags && entry.tags.length) {
      var tags = el('div', 'ds-featured__tags');
      entry.tags.forEach(function (tag) { tags.appendChild(el('span', 'ds-chip', tag)); });
      card.appendChild(tags);
    }
    return card;
  }

  function listItem(entry) {
    var item = el('div', 'ds-projitem');
    var title = el('h4');
    title.appendChild(nameNode(entry));
    item.appendChild(title);
    item.appendChild(el('p', '', entry.leistung));
    if (entry.ergebnis) item.appendChild(el('p', 'ds-ref-result', entry.ergebnis));
    return item;
  }

  /* Wortmarke steht sofort; das Logo ersetzt sie erst nach erfolgreichem Laden.
     So erscheint bei fehlender Datei nie ein kaputtes Bild. */
  function partnerMark(entry) {
    var mark = el('span', 'ds-vp__mark');
    mark.appendChild(el('span', 'ds-vp__wordmark', entry.name));

    if (entry.logo) {
      var img = el('img', 'ds-vp__logo');
      img.alt = 'Logo ' + entry.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('load', function () { mark.classList.add('has-logo'); });
      img.addEventListener('error', function () { img.remove(); });
      img.src = entry.logo;
      mark.appendChild(img);
    }
    return mark;
  }

  function partnerCard(entry, index) {
    var card = reveal(el('li', 'ds-vp__item'), index);
    var url = safeUrl(entry.url);
    var mark = partnerMark(entry);

    if (url) {
      var link = externalLink(url, 'ds-vp__link');
      link.appendChild(mark);
      card.appendChild(link);
    } else {
      card.appendChild(mark);
    }
    if (entry.leistung) card.appendChild(el('p', 'ds-vp__service', entry.leistung));
    return card;
  }

  function appendAll(root, nodes) {
    nodes.forEach(function (node) { root.appendChild(node); });
  }

  function renderFeatured() {
    var root = document.getElementById('refFeatured');
    if (!root) return;
    var customers = select(function (e) { return e.typ === 'kunde' && e.featured; });
    if (!customers.length) {
      root.closest('section').hidden = true;
      return;
    }
    appendAll(root, customers.map(featuredCard));
  }

  function renderList() {
    var root = document.getElementById('refList');
    if (!root) return;
    var columns = COLUMNS.map(function (column) {
      return {
        title: column.title,
        items: select(function (e) { return e.typ === 'kunde' && !e.featured && e.bereich === column.bereich; }),
      };
    }).filter(function (column) { return column.items.length; });

    if (!columns.length) {
      root.closest('section').hidden = true;
      return;
    }
    appendAll(root, columns.map(function (column, index) {
      var node = reveal(el('div', 'ds-projcat'), index);
      node.appendChild(el('h3', 'ds-projcat__title', column.title));
      appendAll(node, column.items.map(listItem));
      return node;
    }));
  }

  function renderPartners() {
    var root = document.getElementById('refPartners');
    if (!root) return;
    var partners = select(function (e) { return e.typ === 'partner'; });
    if (!partners.length) {
      root.closest('section').hidden = true;
      return;
    }
    appendAll(root, partners.map(partnerCard));
  }

  renderFeatured();
  renderList();
  renderPartners();
})();
