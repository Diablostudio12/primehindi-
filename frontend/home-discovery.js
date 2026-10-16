/* Additive homepage discovery sections for Prime Hindi. Uses the existing live anime catalog; no database changes. */
(function () {
  'use strict';
  if (window.__primeHindiDiscoverySections || typeof V === 'undefined' || typeof A === 'undefined') return;
  window.__primeHindiDiscoverySections = true;

  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };
  var card = function (a) {
    var poster = a.posterUrl
      ? '<img src="' + esc(a.posterUrl) + '" alt="' + esc(a.t) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.remove()">'
      : '<b>' + esc((a.t || '?').slice(0, 1)) + '</b>';
    return '<a class="cd" href="#/anime/' + encodeURIComponent(a.i) + '"><div class="po" style="--a:' + esc(a.c && a.c[0] || '#3675ff') + ';--b:' + esc(a.c && a.c[1] || '#111622') + '">' + poster + '<i>★ ' + esc(a.r || '—') + '</i></div><p>' + esc(a.t) + '</p><small>' + esc((a.genres || [a.g || 'Anime']).slice(0, 2).join(' · ')) + '</small></a>';
  };
  var section = function (title, href, body) {
    return '<section class="ph-discovery-section"><div class="sh"><h2>' + esc(title) + '</h2><a href="' + href + '">View all ›</a></div>' + body + '</section>';
  };
  var cards = function (items) {
    return '<div class="rib ph-discovery-rib">' + items.map(card).join('') + '</div>';
  };
  var baseHome = V.home;
  V.home = function () {
    var base = baseHome.apply(this, arguments) || '';
    var all = Array.isArray(A) ? A.slice() : [];
    if (!all.length) return base;
    var extra = '';
    var movies = all.filter(function (a) { return String(a.type || '').toLowerCase() === 'movie'; });
    var rated = all.filter(function (a) { return Number.isFinite(Number(a.r)) && String(a.r) !== '—'; })
      .sort(function (a, b) { return Number(b.r) - Number(a.r); });
    if (movies.length) extra += section('Anime Movies', '#/list/movies', cards(movies.slice(0, 12)));
    if (rated.length) extra += section('Top Rated', '#/list/top-rated', cards(rated.slice(0, 12)));

    var genreNames = [];
    all.forEach(function (a) {
      (Array.isArray(a.genres) && a.genres.length ? a.genres : [a.g || 'Anime']).forEach(function (g) {
        if (g && genreNames.indexOf(g) === -1) genreNames.push(g);
      });
    });
    if (genreNames.length) {
      extra += section('Browse by Genre', '#/categories',
        '<div class="chs ph-genre-chips">' + genreNames.slice(0, 14).map(function (g) {
          return '<a class="chip" href="#/search" data-ph-genre="' + esc(g) + '">' + esc(g) + '</a>';
        }).join('') + '</div>');
    }

    var token = '';
    try { token = localStorage.getItem('pdi_stream_token') || ''; } catch (e) {}
    if (token) {
      var watchlist = [];
      try {
        var raw = JSON.parse(localStorage.getItem('primeHindiWatchlist') || '[]');
        if (Array.isArray(raw)) watchlist = raw.map(function (id) { return all.find(function (a) { return String(a.i) === String(id) || String(a.slug) === String(id); }); }).filter(Boolean);
      } catch (e) {}
      var seed = watchlist[0];
      var preferred = seed && (seed.genres || []).length ? seed.genres : [];
      var recommendations = all.filter(function (a) {
        return (!seed || String(a.i) !== String(seed.i)) && (!preferred.length || (a.genres || []).some(function (g) { return preferred.indexOf(g) !== -1; }));
      }).slice(0, 12);
      if (recommendations.length) extra += section('Recommended For You', '#/browse', cards(recommendations));
    }
    if (!extra) return base;
    var footerIndex = base.lastIndexOf('</section>');
    if (footerIndex >= 0) {
      footerIndex += '</section>'.length;
      return base.slice(0, footerIndex) + extra + base.slice(footerIndex);
    }
    return base + extra;
  };

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('[data-ph-genre]') : null;
    if (!link) return;
    var genre = link.getAttribute('data-ph-genre');
    if (!genre) return;
    event.preventDefault();
    location.hash = '#/search';
    window.setTimeout(function () {
      var q = document.getElementById('q');
      if (q) {
        q.value = genre;
        q.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  });
  /* The main SPA may have rendered once before this late-loaded enhancement arrived. */
  if (typeof route === 'function' && (!location.hash || location.hash === '#' || location.hash.indexOf('#/home') === 0)) route();
})();
