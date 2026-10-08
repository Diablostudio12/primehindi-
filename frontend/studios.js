/* Studios row on home + studio page (#/studio/<slug>). Additive: hidden when there are no studios. */
(function () {
  'use strict';
  if (window.__pdiStudios || typeof V === 'undefined') return;
  window.__pdiStudios = true;
  var studios = [], pageToken = 0;
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var css = document.createElement('style');
  css.textContent =
    '.stRow{display:flex;gap:16px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x proximity}' +
    '.stItem{flex:0 0 84px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;scroll-snap-align:start}' +
    '.stLogo{width:72px;height:72px;border-radius:50%;background:var(--cd);border:1px solid var(--ln);display:grid;place-items:center;overflow:hidden;position:relative;flex:0 0 auto;transition:transform .15s}' +
    '.stLogo img{width:100%;height:100%;object-fit:cover}.stLogo b{font-size:26px;color:var(--ac)}' +
    '.stItem:active .stLogo{transform:scale(.94)}' +
    '.stName{font-size:12px;color:var(--tx);line-height:1.25;max-width:84px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
    '.stHead{display:flex;align-items:center;gap:14px;margin:14px 0 18px}.stHead .stLogo{width:64px;height:64px}.stHead h1{font-size:24px;margin:0}';
  document.head.appendChild(css);

  function logo(s) {
    return '<span class="stLogo">' + (s.logo_url
      ? '<img src="' + esc(s.logo_url) + '" alt="" loading="lazy" onerror="this.remove()">'
      : '<b>' + esc((s.name || '?').charAt(0).toUpperCase()) + '</b>') + '</span>';
  }
  function rowHtml() {
    if (!studios.length) return '';
    return '<section><div class="sh"><h2>Studios</h2></div><div class="stRow">' + studios.map(function (s) {
      return '<a class="stItem" href="#/studio/' + encodeURIComponent(s.slug) + '">' + logo(s) + '<span class="stName">' + esc(s.name) + '</span></a>';
    }).join('') + '</div></section>';
  }

  var origHome = V.home;
  V.home = function () {
    var h = origHome.apply(this, arguments), r = rowHtml();
    if (!r) return h;
    var i = h.indexOf('<section><div class="sh"><h2>Trending now</h2>');
    return i < 0 ? h : h.slice(0, i) + r + h.slice(i);
  };

  V.studio = function (slug) {
    var token = ++pageToken;
    setTimeout(function () { load(slug, token); }, 0);
    return '<div class="stPage"><button class="btn g" id="stBack" type="button">&larr; Back</button><div id="stBody"><p class="mu" style="margin-top:14px">Loading studio…</p></div></div>';
  };

  function load(slug, token) {
    var back = document.getElementById('stBack');
    if (back) back.onclick = function () { if (history.length > 1) history.back(); else location.hash = '#/'; };
    fetch('/api/studios/' + encodeURIComponent(slug), { cache: 'no-store' }).then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('failed');
      return r.json();
    }).then(function (d) {
      if (token !== pageToken) return;
      var body = document.getElementById('stBody');
      if (!body) return;
      if (!d) { body.innerHTML = '<p class="mu" style="margin-top:14px">Studio not found.</p>'; return; }
      var list = (d.anime || []).map(fromApiAnime);
      body.innerHTML = '<div class="stHead">' + logo(d) + '<div><h1>' + esc(d.name) + '</h1><p class="mu">' + list.length + ' title' + (list.length === 1 ? '' : 's') + '</p></div></div>' +
        (list.length ? grid(list) : '<p class="mu">No anime added for this studio yet.</p>');
    }).catch(function () {
      var body = document.getElementById('stBody');
      if (token === pageToken && body) body.innerHTML = '<p class="mu" style="margin-top:14px">Could not load this studio. Please try again.</p>';
    });
  }

  fetch('/api/studios', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
    studios = Array.isArray(rows) ? rows : [];
    var h = location.hash.replace(/^#\/?/, '').split('/')[0];
    if (studios.length && (h === '' || h === 'home') && catalogReady) route();
  }).catch(function () {});
})();
