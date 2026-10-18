/* Admin portal + editor panel: "Age rating" (18- / 18+) select in the anime form. Additive. */
(function () {
  'use strict';
  if (window.__pdiAdminAdult) return;
  window.__pdiAdminAdult = true;
  var origFetch = window.fetch.bind(window);
  var SEL = 'pdiAdultSelect';
  var $ = function (id) { return document.getElementById(id); };
  function token() { return sessionStorage.getItem('ps_admin_token') || ''; }

  function loadList() {
    return origFetch('/api/admin/anime', { headers: { Authorization: 'Bearer ' + token() }, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('list'); return r.json(); })
      .then(function (rows) { return Array.isArray(rows) ? rows : []; });
  }

  function sync(form, sel) {
    var id = form.elements.animeId && form.elements.animeId.value;
    var slug = form.elements.slug && form.elements.slug.value;
    if (!id && !slug) { sel.value = '0'; sel.dataset.ready = '1'; return; }
    sel.dataset.ready = '0';
    loadList().then(function (list) {
      var cur = list.filter(function (a) {
        return id ? String(a.id) === String(id) : a.slug === slug;
      })[0];
      sel.value = cur && cur.is_adult === true ? '1' : '0';
      sel.dataset.ready = '1';
    }).catch(function () { /* stays not ready: backend keeps the saved value */ });
  }

  function decorate(form) {
    var poster = form.elements.posterUrl && form.elements.posterUrl.closest('.field');
    if (!poster) return;
    var wrap = document.createElement('div');
    wrap.className = 'field wide full';
    wrap.innerHTML = '<label>AGE RATING</label><select id="' + SEL + '"><option value="0" selected>18- (all ages)</option><option value="1">18+ (adult only)</option></select><div class="uploadHint">18+ anime show only when a visitor turns on the 18+ toggle.</div>';
    poster.parentNode.insertBefore(wrap, poster);
    var sel = wrap.querySelector('select');
    sel.dataset.ready = '0';
    sync(form, sel);
    // Editor panel reuses one static form: re-read the saved value whenever Edit is clicked.
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-edit-anime]')) setTimeout(function () { sync(form, sel); }, 60);
    });
    form.addEventListener('reset', function () { sel.dataset.ready = '1'; });
  }

  function check() {
    var f = $('animeForm');
    if (f && !$(SEL)) decorate(f);
  }
  new MutationObserver(check).observe(document.documentElement, { childList: true, subtree: true });
  check();

  // Add isAdult to the anime save request (POST create / PUT update).
  window.fetch = function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      var sel = $(SEL);
      if (sel && sel.dataset.ready === '1' && (method === 'POST' || method === 'PUT') &&
          /\/api\/admin\/anime(\/\d+)?(\?|$)/.test(url) && init && typeof init.body === 'string') {
        var b = JSON.parse(init.body);
        b.isAdult = sel.value === '1';
        init = Object.assign({}, init, { body: JSON.stringify(b) });
      }
    } catch (e) { /* send original request */ }
    return origFetch(input, init);
  };
})();

/* Admin portal: restore the "Manga Library" sidebar button.
   admin-pro.js regroups the sidebar and drops any tab it does not list, so Manga Library vanished. Additive. */
(function () {
  'use strict';
  if (window.__pdiMangaNav) return;
  window.__pdiMangaNav = true;
  function add() {
    var nav = document.querySelector('#sidebar .nav');
    if (!nav || nav.querySelector('button[data-tab="manga"]')) return;
    var ref = nav.querySelector('button[data-tab="studios"]') || nav.querySelector('button[data-tab="episodes"]');
    var b = document.createElement('button');
    b.dataset.tab = 'manga';
    b.dataset.grp = 'Catalog';
    b.innerHTML = '<span class="ico"><i data-lucide="book-open"></i></span>Manga Library';
    b.addEventListener('click', function () { if (window.switchTab) window.switchTab('manga'); });
    if (ref && ref.nextSibling) nav.insertBefore(b, ref.nextSibling); else nav.appendChild(b);
    if (window.lucide) window.lucide.createIcons();
  }
  function start() {
    var nav = document.querySelector('#sidebar .nav');
    if (!nav) return;
    add();
    new MutationObserver(add).observe(nav, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
