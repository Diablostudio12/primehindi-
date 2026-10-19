/* Watch page: "Download" button, shown only for anime the admin allowed downloads for. Additive. */
(function () {
  'use strict';
  if (window.__pdiDownload) return;
  window.__pdiDownload = true;
  var allow = null;
  var loading = false;

  function loadAllow(cb) {
    if (allow) { cb(); return; }
    if (loading) return;
    loading = true;
    fetch('/api/anime', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        allow = {};
        (Array.isArray(rows) ? rows : []).forEach(function (r) { allow[String(r.id)] = r.allow_download === true; });
      })
      .catch(function () { allow = {}; })
      .then(function () { loading = false; cb(); });
  }

  function run() {
    var old = document.getElementById('pdiDl');
    var m = location.hash.match(/^#\/watch\/([^\/]+)\/?(\d+)?/);
    if (!m) { if (old) old.remove(); return; }
    var report = document.querySelector('[data-report-video]');
    if (!report) return;
    var id = m[1];
    var n = +m[2] || 1;
    var key = id + '/' + n;
    if (old && old.dataset.k === key) return;
    if (old) old.remove();
    loadAllow(function () {
      if (!allow || !allow[id]) return;
      if (document.getElementById('pdiDl')) return;
      var rep = document.querySelector('[data-report-video]');
      var cur = location.hash.match(/^#\/watch\/([^\/]+)\/?(\d+)?/);
      if (!rep || !cur || cur[1] !== id || (+cur[2] || 1) !== n) return;
      var a;
      try { a = A.find(function (x) { return String(x.i) === String(id); }); } catch (e) { return; }
      var ep = a && (a.episodes || []).find(function (x) {
        return Number(x.episodeNumber != null ? x.episodeNumber : x.episode_number) === n;
      });
      var url = ep ? String(ep.video_url || '').replace(/^__PDI_(?:PROVIDER|CUSTOM)__:/, '') : '';
      if (!url) return;
      var b = document.createElement('a');
      b.id = 'pdiDl';
      b.dataset.k = key;
      b.className = 'btn g';
      b.href = url;
      b.target = '_blank';
      b.rel = 'noopener noreferrer';
      b.setAttribute('download', '');
      b.innerHTML = '&#11015; Download';
      rep.parentNode.insertBefore(b, rep);
    });
  }

  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', function () { setTimeout(run, 50); });
  run();
})();
