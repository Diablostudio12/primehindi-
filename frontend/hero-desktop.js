/* Prime Hindi home polish (loaded as /hero-desktop.js by server.js; replaces the old desktop-only hero).
   Smooth crossfade hero slider, clean home sections, "View all" pages, desktop header search + avatar,
   notifications docked in header, no bottom tabs on desktop, footer fit. Additive: index.html untouched. */
(function () {
  'use strict';
  if (window.__pnPolish || typeof V === 'undefined' || typeof A === 'undefined') return;
  window.__pnPolish = true;

  var css = [
    /* ---------- layout / chrome ---------- */
    '@media(min-width:800px){#primeHindiBottomNav{display:none!important}body{padding-bottom:0!important}}',
    '@media(min-width:1200px){main:has(.hs),main:has(.pn-all){max-width:1480px}}',
    /* header search (desktop) */
    '.pn-hs{display:none}',
    '@media(min-width:800px){.pn-hs{display:flex;align-items:center;gap:8px;flex:0 1 320px;min-width:170px;height:40px;padding:0 14px;background:var(--cd);border:1px solid var(--ln);border-radius:999px;color:var(--mu)}',
    '.pn-hs input{flex:1;min-width:0;height:100%;padding:0;background:none;border:0;border-radius:0;color:var(--tx);font:14px Inter,system-ui,sans-serif}.pn-hs input:focus{outline:0}',
    '.pn-hs:focus-within{border-color:var(--ac);box-shadow:0 0 0 3px rgba(47,107,255,.2)}.pn-hs svg{flex:0 0 auto}}',
    /* account avatar */
    '.signin-btn.account-signed-in{display:inline-flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;border-radius:999px;background:var(--cd);border:1px solid var(--ln);color:var(--tx)}',
    '.pn-av{width:30px;height:30px;flex:0 0 auto;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#7c5cff,#2f6bff);color:#fff;font:700 14px Sora,Inter,sans-serif}',
    '.pn-an{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}',
    '@media(max-width:699px){.pn-an{display:none}.signin-btn.account-signed-in{padding:4px;max-width:none!important}}',
    /* notifications docked in header */
    'header #pdiNotificationWidget{position:relative!important;right:auto!important;left:auto!important;bottom:auto!important;max-width:none!important;z-index:60!important;flex:0 0 auto}',
    'header #pdiNotificationWidget:empty{display:none}',
    'header #pdiNotifToggle{width:40px;height:40px;padding:0!important;font-size:0!important;border-radius:50%!important;display:grid;place-items:center;box-shadow:none!important}',
    'header #pdiNotifToggle:before{content:"\\1F514";font-size:18px;line-height:1}',
    'header #pdiNotifPanel{position:absolute;right:0;top:calc(100% + 12px);width:min(360px,calc(100vw - 24px))}',
    /* ---------- hero slider ---------- */
    '.hs{--hs-t:7s;position:relative;overflow:hidden;margin:0 -18px 8px;height:min(520px,78vh);min-height:430px;border-radius:0 0 22px 22px;background:var(--cd);touch-action:pan-y;isolation:isolate}',
    '.hs-sl{position:absolute;inset:0;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .8s ease,visibility 0s linear .8s}',
    '.hs-sl.on{opacity:1;visibility:visible;pointer-events:auto;z-index:1;transition:opacity .8s ease}',
    '.hs-bg{position:absolute;inset:0;background-size:cover;background-position:center 20%;transform:scale(1.1);will-change:transform}',
    '.hs-sl:not(.on) .hs-bg{transition:transform 0s linear .8s}.hs-sl.on .hs-bg{transform:scale(1);transition:transform 9s ease-out}',
    '.hs-sh{position:absolute;inset:0;background:linear-gradient(0deg,var(--bg) 6%,rgba(10,13,20,.78) 42%,rgba(10,13,20,.12) 100%)}',
    '.hs-in{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:space-between;gap:32px;max-width:1480px;margin:0 auto;padding:0 20px 54px}',
    '.hs-l{min-width:0;max-width:640px}',
    '.hs-l>*{opacity:0;transform:translateY(16px);transition:opacity .55s ease,transform .55s ease}',
    '.hs-sl.on .hs-l>*{opacity:1;transform:none}',
    '.hs-sl.on .hs-l>:nth-child(1){transition-delay:.15s}.hs-sl.on .hs-l>:nth-child(2){transition-delay:.25s}.hs-sl.on .hs-l>:nth-child(3){transition-delay:.35s}.hs-sl.on .hs-l>:nth-child(4){transition-delay:.45s}.hs-sl.on .hs-l>:nth-child(5){transition-delay:.55s}.hs-sl.on .hs-l>:nth-child(6){transition-delay:.65s}',
    '.hs-c{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.hs-c span{font:700 11px Inter,sans-serif;letter-spacing:.04em;padding:4px 10px;border-radius:999px;border:1px solid}',
    '.hs-c .a{color:#34d399;background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.4)}.hs-c .b{color:#a78bfa;background:rgba(167,139,250,.14);border-color:rgba(167,139,250,.4)}.hs-c .c{color:#60a5fa;background:rgba(96,165,250,.14);border-color:rgba(96,165,250,.4)}.hs-c .d{color:#fbbf24;background:rgba(251,191,36,.14);border-color:rgba(251,191,36,.4)}',
    '.hs-t{font:800 clamp(28px,6vw,58px)/1.06 Sora,Inter,sans-serif;margin:0 0 12px;letter-spacing:-.01em;text-shadow:0 2px 24px rgba(0,0,0,.5);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}',
    '.hs-m{display:flex;flex-wrap:wrap;gap:6px 18px;color:var(--sv);font-size:13.5px;margin-bottom:12px}',
    '.hs-d{color:var(--sv);font-size:14.5px;line-height:1.6;max-width:560px;margin:0 0 14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.hs-g{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}.hs-g span{background:rgba(124,92,255,.16);border:1px solid rgba(124,92,255,.35);color:#c4b5fd;border-radius:999px;padding:4px 12px;font-size:12px}',
    '.hs-b{display:flex;gap:10px;flex-wrap:wrap}.hs-b a{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:999px;font:600 14px Inter,sans-serif;color:#fff;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:border-color .2s,transform .2s}',
    '.hs-b a:hover{border-color:#a78bfa;transform:translateY(-2px)}.hs-b a.p{background:linear-gradient(90deg,#8b5cf6,#d946ef);border:0;box-shadow:0 8px 28px rgba(139,92,246,.4)}',
    '.hs-p{display:none;flex:0 0 auto;width:230px;aspect-ratio:2/3;border-radius:16px;border:2px solid rgba(167,139,250,.55);box-shadow:0 18px 50px rgba(0,0,0,.6);background:var(--cd) center/cover no-repeat;opacity:0;transform:translateX(28px) scale(.96);transition:opacity .7s ease .3s,transform .7s ease .3s}',
    '.hs-sl.on .hs-p{opacity:1;transform:none}',
    '.hs-ar{display:none;position:absolute;top:50%;transform:translateY(-50%);z-index:5;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(10,13,20,.6);color:#fff;font-size:24px;line-height:1;cursor:pointer;place-items:center;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .2s}',
    '.hs-ar:hover{background:#8b5cf6}.hs-ar.l{left:16px}.hs-ar.r{right:16px}',
    '.hs-dots{position:absolute;left:20px;bottom:18px;z-index:5;display:flex;gap:6px}',
    '.hs-dots button{width:28px;height:20px;padding:0;border:0;background:none;cursor:pointer;position:relative}.hs-dots button:after{content:"";position:absolute;left:0;right:0;top:8px;height:4px;border-radius:2px;background:rgba(255,255,255,.28);transition:background .3s}.hs-dots button.on:after{background:#fff}',
    '.hs-n{display:none;position:absolute;right:28px;bottom:18px;z-index:5;color:var(--mu);font-size:13px}.hs-n b{color:#fff}',
    '.hs-pr{position:absolute;left:0;right:0;bottom:0;height:3px;z-index:5;background:rgba(255,255,255,.1)}',
    '.hs-pr i{display:block;height:100%;transform-origin:left;transform:scaleX(0);background:linear-gradient(90deg,#8b5cf6,#d946ef);animation:hsPr var(--hs-t) linear forwards}',
    '.hs.is-paused .hs-pr i{animation-play-state:paused}@keyframes hsPr{to{transform:scaleX(1)}}',
    '@media(min-width:700px){.hs-ar{display:grid}.hs-n{display:block}.hs-in{padding:0 52px 56px}.hs-dots{left:52px}.hs-d{-webkit-line-clamp:3}}',
    '@media(min-width:900px){.hs{margin:0 0 8px;border-radius:22px;height:min(560px,72vh);min-height:480px}.hs-p{display:block}.hs-in{padding:0 96px 64px}.hs-dots{left:96px;bottom:24px}.hs-n{right:36px;bottom:24px}.hs-sh{background:linear-gradient(90deg,var(--bg) 2%,rgba(10,13,20,.78) 38%,rgba(10,13,20,.1) 78%),linear-gradient(0deg,var(--bg) 2%,transparent 40%)}.hs-d{font-size:15px}.hs-b a{padding:13px 28px;font-size:15px}}',
    /* Slider frame: use the full main container width instead of compensating with negative margins. */
    '@media(min-width:700px){main:has(.hs){width:100%;max-width:1480px;padding-left:0;padding-right:0;box-sizing:border-box}.hs{width:100%;margin-left:0;margin-right:0;border-radius:22px}}',
    '@media(prefers-reduced-motion:reduce){.hs-bg,.hs-l>*,.hs-p{transition:none!important;transform:none!important}.hs-sl{transition:opacity .2s!important}}',
    /* Hide extra slide details and poster without altering the original animated transitions. */
    '.hs-c,.hs-m,.hs-d,.hs-g,.hs-p{display:none!important}.hs-sl{cursor:pointer}.hs-l{max-width:760px}',
    /* ---------- sections / cards ---------- */
    '.pn-sec{margin:30px 0 0}.pn-sh{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 14px}.pn-sh h2{font:700 20px Sora,Inter,sans-serif}.pn-sh a{color:var(--mu);font-size:13px;transition:color .2s}.pn-sh a:hover{color:#fff}',
    '.pn-g{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin:0 -18px;padding:2px 18px 10px}.pn-g::-webkit-scrollbar{display:none}',
    '.pn-g .cd{flex:0 0 138px!important;width:138px!important;min-width:138px!important;max-width:138px!important;scroll-snap-align:start;overflow:visible}',
    '.pn-g.w .cd{flex-basis:236px!important;width:236px!important;min-width:236px!important;max-width:236px!important}',
    '.pn-all{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:20px 14px}.pn-all.w{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}.pn-all .cd{width:100%!important;min-width:0!important;max-width:none!important;flex:none!important;overflow:visible}',
    '@media(min-width:800px){',
    '.pn-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));grid-template-rows:auto;grid-auto-rows:0;gap:0 20px;overflow:hidden;margin:-10px;padding:10px 10px 6px;scroll-snap-type:none}',
    '.pn-g .cd{width:100%!important;min-width:0!important;max-width:none!important;flex:none!important}',
    '.pn-g.w{grid-template-columns:repeat(auto-fill,minmax(260px,1fr));grid-auto-rows:auto;gap:22px 20px;overflow:visible}',
    '.pn-all{grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:26px 20px}.pn-all.w{grid-template-columns:repeat(auto-fill,minmax(270px,1fr))}',
    '.cd p{font-size:15px}}',
    '.pn-ep small{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '@media(hover:hover){.gr .cd .po img,.rib .cd .po img,.pn-g .cd .po img,.pn-all .cd .po img{transition:transform .45s cubic-bezier(.2,.8,.2,1)}',
    '.gr .cd:hover .po img,.rib .cd:hover .po img,.pn-g .cd:hover .po img,.pn-all .cd:hover .po img{transform:scale(1.08)}',
    '.gr .cd .po:after,.rib .cd .po:after,.pn-g .cd .po:after,.pn-all .cd .po:after{content:"\\25B6";position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(124,92,255,.92);color:#fff;display:grid;place-items:center;font-size:18px;padding-left:3px;opacity:0;transform:scale(.7);transition:opacity .25s,transform .25s;box-shadow:0 8px 28px rgba(124,92,255,.5);pointer-events:none}',
    '.gr .cd:hover .po:after,.rib .cd:hover .po:after,.pn-g .cd:hover .po:after,.pn-all .cd:hover .po:after{opacity:1;transform:none}',
    '.pn-g .cd,.pn-all .cd,.gr .cd{transition:transform .25s}.pn-g .cd:hover,.pn-all .cd:hover,.gr .cd:hover{transform:translateY(-4px)}}',
    /* ---------- footer ---------- */
    '@media(min-width:800px){footer{min-height:0!important;padding:44px 28px 26px!important}',
    'footer .fi{max-width:1480px!important;grid-template-columns:1.6fr 1fr 1fr!important;padding-right:clamp(260px,26vw,420px)!important;min-height:300px;align-content:start}',
    'footer .fi>div{max-width:none!important}',
    'footer .fnp{right:max(24px,calc((100vw - 1480px)/2 + 24px))!important;bottom:0;height:min(calc(100% - 12px),420px)!important;width:auto;max-width:clamp(240px,24vw,380px)!important;object-fit:contain;object-position:bottom right}',
    'footer:before{right:max(0px,calc((100vw - 1480px)/2))!important}footer>p{max-width:1480px!important}}'
  ].join('');
  var style = document.createElement('style');
  style.id = 'pnPolishCss';
  style.textContent = css;
  document.head.appendChild(style);

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function url(u) { return esc(String(u).replace(/'/g, '%27')); }

  /* ---------- data helpers ---------- */
  var PLACEHOLDER = /can be updated from the admin portal/i;
  function syn(a) { var d = String(a.description || '').trim(); return !d || PLACEHOLDER.test(d) ? '' : d; }
  function good(a) { return !!(a.posterUrl || a.bannerUrl || a.n > 0); }
  function epNum(e) { return Number(e.episodeNumber != null ? e.episodeNumber : e.episode_number); }
  function episodes() {
    var out = [], idx = 0;
    A.forEach(function (a) {
      (a.episodes || []).forEach(function (e) {
        var n = epNum(e);
        idx++;
        if (!(n > 0) || (!e.video_url && !e.thumbnail_url)) return;
        out.push({ a: a, e: e, n: n, i: idx, t: Date.parse(e.created_at || e.createdAt || e.updated_at || '') || 0 });
      });
    });
    out.sort(function (x, y) { return (y.t - x.t) || (y.i - x.i); });
    return out;
  }
  function epCard(x) {
    var a = x.a, e = x.e, img = e.thumbnail_url || a.bannerUrl || a.posterUrl || '';
    return '<a class="cd pn-ep" href="#/watch/' + a.i + '/' + x.n + '"><div class="po wd" ' + st(a) + '>' +
      (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.remove()">' : '') +
      '<i>EP ' + x.n + '</i></div><p>' + esc(a.t) + '</p><small>' + esc(e.title || ('Episode ' + x.n)) + '</small></a>';
  }
  function ratingOf(a) { var r = parseFloat(a.r); return isNaN(r) ? -1 : r; }
  function lists(g) {
    return {
      trending: { t: 'Trending now', l: g },
      popular: { t: 'Popular this week', l: g.slice().sort(function (x, y) { return ratingOf(y) - ratingOf(x); }) },
      airing: { t: 'Top airing', l: g.filter(function (a) { return a.s === 'Airing'; }) },
      recent: { t: 'Recently added', l: g.slice().reverse() },
      episodes: { t: 'Latest episodes', eps: true }
    };
  }
  function key(l) { return l.slice(0, 14).map(function (a) { return a.i; }).sort().join(','); }

  /* ---------- hero ---------- */
  function slideHtml(a, k) {
    var bg = a.bannerUrl || a.posterUrl;
    return '<article class="hs-sl' + (k === 0 ? ' on' : '') + '" data-anime-id="' + esc(a.i) + '" aria-hidden="' + (k === 0 ? 'false' : 'true') + '" tabindex="0" role="link" aria-label="View details for ' + esc(a.t) + '">' +
      '<div class="hs-bg" style="background-image:url(\\'' + url(bg) + '\\')"></div><div class="hs-sh"></div>' +
      '<div class="hs-in"><div class="hs-l">' +
      '<div class="hs-t">' + esc(a.t) + '</div>' +
      '<div class="hs-b"><a class="p" href="#/watch/' + a.i + '/1">&#9654; Watch Now</a><a href="#/watchlist">&#128278; Watchlist</a></div>' +
      '</div></div></article>';
  }
  function heroHtml(g) {
    var L = g.filter(function (a) { return a.bannerUrl || a.posterUrl; }).slice(0, 6), n = L.length;
    if (!n) return '';
    var many = n > 1;
    return '<div class="hs" role="region" aria-roledescription="carousel" aria-label="Featured anime">' +
      L.map(slideHtml).join('') +
      (many ? '<button class="hs-ar l" type="button" aria-label="Previous slide">&#8249;</button><button class="hs-ar r" type="button" aria-label="Next slide">&#8250;</button>' +
        '<div class="hs-dots">' + L.map(function (_, i) { return '<button type="button" aria-label="Slide ' + (i + 1) + '"' + (i === 0 ? ' class="on"' : '') + '></button>'; }).join('') + '</div>' +
        '<div class="hs-n"><b>1</b> / ' + n + '</div><div class="hs-pr"><i></i></div>' : '') +
      '</div>';
  }
  function initHero(root) {
    if (root.dataset.on) return;
    root.dataset.on = '1';
    var sl = [].slice.call(root.querySelectorAll('.hs-sl')), n = sl.length;
    root.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) return;
      var slide = e.target.closest('.hs-sl');
      if (slide && slide.dataset.animeId) location.hash = '#/anime/' + encodeURIComponent(slide.dataset.animeId);
    });
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('a,button')) return;
      var slide = e.target.closest('.hs-sl');
      if (slide && slide.dataset.animeId) { e.preventDefault(); location.hash = '#/anime/' + encodeURIComponent(slide.dataset.animeId); }
    });

    if (n < 2) return;
    var dots = [].slice.call(root.querySelectorAll('.hs-dots button')), bar = root.querySelector('.hs-pr i'), cnt = root.querySelector('.hs-n b'), cur = 0;
    function restart() { if (!bar) return; bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    function show(i) {
      cur = (i + n) % n;
      sl.forEach(function (s, k) { s.classList.toggle('on', k === cur); s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === cur); });
      if (cnt) cnt.textContent = cur + 1;
      restart();
    }
    bar.addEventListener('animationend', function (e) { if (e.animationName === 'hsPr') show(cur + 1); });
    root.querySelector('.hs-ar.l').onclick = function () { show(cur - 1); };
    root.querySelector('.hs-ar.r').onclick = function () { show(cur + 1); };
    dots.forEach(function (d, k) { d.onclick = function () { show(k); }; });
    var pause = function (on) { root.classList.toggle('is-paused', on); };
    if (window.matchMedia && matchMedia('(hover:hover)').matches) {
      root.addEventListener('mouseenter', function () { pause(true); });
      root.addEventListener('mouseleave', function () { pause(false); });
    }
    root.addEventListener('focusin', function () { pause(true); });
    root.addEventListener('focusout', function () { pause(false); });
    var x0 = null, y0 = 0;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; pause(true); }, { passive: true });
    root.addEventListener('touchend', function (e) {
      pause(false);
      if (x0 == null) return;
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    root.addEventListener('touchcancel', function () { x0 = null; pause(false); }, { passive: true });
    var vis = function () {
      if (!document.body.contains(root)) { document.removeEventListener('visibilitychange', vis); return; }
      pause(document.hidden);
    };
    document.addEventListener('visibilitychange', vis);
  }

  /* ---------- home + "View all" ---------- */
  function sec(title, href, inner) {
    return '<section class="pn-sec"><div class="pn-sh"><h2>' + title + '</h2><a href="' + href + '">View all &rsaquo;</a></div>' + inner + '</section>';
  }
  var origHome = V.home;
  V.home = function () {
    var base = '';
    try { base = origHome.apply(this, arguments) || ''; } catch (e) { base = ''; }
    var si = base.indexOf('<section><div class="sh"><h2>Studios</h2>'), studios = '';
    if (si >= 0) { var sj = base.indexOf('</section>', si); if (sj > si) studios = base.slice(si, sj + 10); }
    var g = A.filter(good), L = lists(g), out = heroHtml(g) + studios;
    var seen = key(g);
    if (g.length) out += sec(L.trending.t, '#/list/trending', '<div class="pn-g">' + g.slice(0, 14).map(cd).join('') + '</div>');
    var ev = episodes().slice(0, 8);
    if (ev.length) out += sec(L.episodes.t, '#/list/episodes', '<div class="pn-g w">' + ev.map(epCard).join('') + '</div>');
    ['popular', 'airing', 'recent'].forEach(function (k) {
      var l = L[k].l;
      if (!l.length || key(l) === seen) return;
      out += sec(L[k].t, '#/list/' + k, '<div class="pn-g">' + l.slice(0, 14).map(cd).join('') + '</div>');
    });
    return out || base;
  };
  V.list = function (kind) {
    var d = lists(A.filter(good))[kind];
    if (!d) return '<a class="chip" href="#/">&larr; Home</a><h1 class="ph">Not found</h1>';
    var items = d.eps ? episodes().map(epCard) : d.l.map(cd);
    return '<a class="chip" href="#/">&larr; Home</a><h1 class="ph">' + d.t + '</h1>' +
      (items.length ? '<div class="pn-all' + (d.eps ? ' w' : '') + '">' + items.join('') + '</div>' : '<p class="mu">Nothing here yet.</p>');
  };
  /* old slider re-rendered the whole hero every 5.5s; make it a no-op */
  window.startHeroSlider = function () { try { if (typeof heroTimer !== 'undefined' && heroTimer) clearInterval(heroTimer); } catch (e) {} };

  /* ---------- header: search, avatar, notifications ---------- */
  function addSearch() {
    var h = document.querySelector('header'), acc = document.getElementById('accountBtn');
    if (!h || !acc || h.querySelector('.pn-hs')) return;
    var f = document.createElement('form');
    f.className = 'pn-hs';
    f.setAttribute('role', 'search');
    f.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Search anime, studios, voices" aria-label="Search anime" autocomplete="off">';
    f.onsubmit = function (e) {
      e.preventDefault();
      var q = f.querySelector('input').value.trim();
      if (location.hash.indexOf('#/search') !== 0) location.hash = '#/search';
      setTimeout(function () { var i = document.getElementById('q'); if (i) { i.value = q; i.dispatchEvent(new Event('input', { bubbles: true })); } }, 80);
    };
    h.insertBefore(f, acc);
  }
  function decorateAccount() {
    var b = document.getElementById('accountBtn');
    if (!b || !b.classList.contains('account-signed-in')) return;
    var name = 'My Profile';
    try { var u = JSON.parse(localStorage.getItem('pdi_stream_user') || '{}'); name = u.display_name || u.displayName || name; } catch (e) {}
    b.innerHTML = '<span class="pn-av">' + esc(String(name).charAt(0).toUpperCase()) + '</span><span class="pn-an">' + esc(name) + '</span>';
    b.title = name;
  }
  if (typeof window.syncAccountButton === 'function') {
    var oSync = window.syncAccountButton;
    window.syncAccountButton = function () { var r = oSync.apply(this, arguments); decorateAccount(); return r; };
  }
  function dockNotif() {
    var box = document.getElementById('pdiNotificationWidget'), h = document.querySelector('header'), acc = document.getElementById('accountBtn');
    if (box && h && acc && box.parentNode !== h) h.insertBefore(box, acc);
  }

  function scan() {
    var r = document.querySelector('.hs');
    if (r) initHero(r);
    dockNotif();
  }
  var app = document.getElementById('app');
  if (app) new MutationObserver(scan).observe(app, { childList: true });
  new MutationObserver(dockNotif).observe(document.body, { childList: true });
  addSearch();
  decorateAccount();
  scan();
})();
