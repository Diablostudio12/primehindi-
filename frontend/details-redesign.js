/* Anime details page header redesign (poster + centered title + chips + Overview card + Genres).
   Additive: replaces only the top .hero block of V.anime; cast, episodes, comments etc. stay below as before. */
(function () {
  'use strict';
  if (window.__pdiDetailsRedesign || typeof V === 'undefined' || typeof V.anime !== 'function') return;
  window.__pdiDetailsRedesign = true;

  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var css = document.createElement('style');
  css.textContent =
    '.dx{position:relative;margin:0 -18px 8px;padding:22px 18px 8px;overflow:hidden;text-align:center}' +
    '.dx-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.28;filter:blur(2px);transform:scale(1.05)}' +
    '.dx-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(10,13,20,.35),var(--bg) 92%)}' +
    '.dx>*:not(.dx-bg){position:relative}' +
    '.dx-poster{width:min(62vw,260px);aspect-ratio:2/3;margin:6px auto 0;border-radius:18px;overflow:hidden;background:linear-gradient(150deg,var(--a),var(--b));box-shadow:0 18px 40px rgba(0,0,0,.55);display:grid;place-items:center}' +
    '.dx-poster img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.dx-poster b{font-size:72px;color:#fff;opacity:.85}' +
    '.dx h1{font-size:clamp(22px,6vw,32px);line-height:1.25;margin:22px 8px 6px;color:var(--sv);font-weight:700}' +
    '.dx-alt{color:var(--mu);font-size:13px;margin:0 8px 12px}' +
    '.dx-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:14px 0 16px}' +
    '.dx-chip{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;background:rgba(30,37,54,.75);border:1px solid var(--ln);color:var(--sv);font-size:14px}' +
    '.dx-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin:4px 0 18px}' +
    '.dx-card{text-align:left;background:var(--cd);border:1px solid var(--ln);border-radius:20px;padding:20px;margin:0 0 16px}' +
    '.dx-card h2{display:flex;align-items:center;gap:10px;font-size:20px;margin:0 0 12px;color:var(--tx)}' +
    '.dx-card h2 i{color:#a855f7;font-style:normal}' +
    '.dx-ov{color:var(--sv);font-size:16px;line-height:1.65;margin:0;overflow:hidden;max-height:5.1em;position:relative;transition:max-height .25s}' +
    '.dx-ov.open{max-height:none}' +
    '.dx-ov:not(.open).long:after{content:"";position:absolute;left:0;right:0;bottom:0;height:2.2em;background:linear-gradient(to bottom,transparent,var(--cd))}' +
    '.dx-more{display:block;margin:14px auto 4px;background:none;border:0;color:#a855f7;font-size:17px;font-weight:600;cursor:pointer}' +
    '.dx-gl{font-weight:700;color:var(--sv);margin:18px 0 10px;font-size:17px}' +
    '.dx-gen{display:flex;flex-wrap:wrap;gap:8px}' +
    '.dx-gen span{padding:6px 12px;border-radius:999px;background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.45);color:#b66dff;font-size:14px}' +
    '@media(min-width:760px){.dx{margin:0;border-radius:20px;padding:32px}.dx-card{padding:24px}}';
  document.head.appendChild(css);

  function header(a) {
    var img = a.posterUrl || a.bannerUrl || '';
    var bg = a.bannerUrl || a.posterUrl || '';
    var title = String(a.t || '');
    var chips = [];
    if (a.r && a.r !== '\u2014') chips.push('<span class="dx-chip">&#9733; ' + esc(a.r) + '</span>');
    if (a.y) chips.push('<span class="dx-chip">&#128197; ' + esc(a.y) + '</span>');
    if (a.s) chips.push('<span class="dx-chip">' + esc(a.s) + '</span>');
    chips.push('<span class="dx-chip">' + esc(a.n || 0) + ' episodes</span>');
    if (a.studioName) chips.push('<span class="dx-chip">' + esc(a.studioName) + '</span>');
    var genres = (Array.isArray(a.genres) && a.genres.length ? a.genres : (a.g ? [a.g] : []));
    var desc = String(a.description || (typeof SY !== 'undefined' ? SY : '') || '');
    var long = desc.length > 170;
    return '<div class="dx" ' + (typeof st === 'function' ? st(a) : '') + '>' +
      (bg ? '<div class="dx-bg" style="background-image:url(&quot;' + esc(bg) + '&quot;)"></div>' : '') +
      '<div class="dx-poster">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(title) + '" onerror="this.remove()">' : '<b>' + esc(title.charAt(0)) + '</b>') + '</div>' +
      '<h1>' + esc(title) + '</h1>' +
      (a.altTitle ? '<p class="dx-alt">' + esc(a.altTitle) + '</p>' : '') +
      '<div class="dx-chips">' + chips.join('') + '</div>' +
      '<div class="dx-actions"><a class="btn" href="#/watch/' + a.i + '/1">&#9654; Watch now</a> <button class="btn g" data-wl>+ Add to watchlist</button></div>' +
      '<div class="dx-card"><h2><i>&#127908;</i> Overview</h2>' +
      '<p class="dx-ov' + (long ? ' long' : '') + '">' + esc(desc) + '</p>' +
      (long ? '<button class="dx-more" type="button" data-dx-more>Read More</button>' : '') +
      (genres.length ? '<div class="dx-gl">Genres</div><div class="dx-gen">' + genres.map(function (g) { return '<span>' + esc(g) + '</span>'; }).join('') + '</div>' : '') +
      '</div></div>';
  }

  var orig = V.anime;
  V.anime = function (p) {
    var html = orig.apply(this, arguments);
    try {
      var a = A.find(function (x) { return String(x.i) === String(p); }) || A[+p || 0];
      if (!a) return html;
      var tpl = document.createElement('template');
      tpl.innerHTML = html;
      var old = tpl.content.querySelector('.hero');
      if (!old) return html;
      old.insertAdjacentHTML('afterend', header(a));
      old.remove();
      return tpl.innerHTML;
    } catch (e) {
      console.warn('Details redesign skipped', e);
      return html;
    }
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-dx-more]');
    if (!b) return;
    var ov = b.parentNode.querySelector('.dx-ov');
    if (!ov) return;
    var open = ov.classList.toggle('open');
    b.textContent = open ? 'Show Less' : 'Read More';
  });
})();
