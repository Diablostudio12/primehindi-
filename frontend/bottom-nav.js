(() => {
  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
    browse: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4M8 11h6M11 8v6"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 4.5 4.5"/></svg>',
    categories: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    manga: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v14M12 7C9 4.5 5.5 4 2.5 5v14C6 18 9.5 18.5 12 21M12 7c3-2.5 6.5-3 9.5-2v14C18 18 14.5 18.5 12 21"/><path d="M5.5 9.5c1.7-.3 3.2 0 4.5.8M5.5 13c1.7-.3 3.2 0 4.5.8M18.5 9.5c-1.7-.3-3.2 0-4.5.8M18.5 13c-1.7-.3-3.2 0-4.5.8"/></svg>'
  };
  const links = [['home','#/','Home'],['browse','#/browse','Browse'],['search','#/search','Search'],['categories','#/categories','Categories'],['manga','#/manga','Manga'],['profile','#/profile','Profile']];
  const style = document.createElement('style');
  style.id = 'primeHindiBottomNavStyles';
  style.textContent = [
    'header #headerThemeToggle,header #mb,header .menu-btn,header .ib[aria-label="Search"],header button[aria-label="Search"],header a[aria-label="Search"]{display:none!important}',

    '#primeHindiBottomNav{position:fixed;z-index:85;left:0;right:0;bottom:0;margin:0!important;box-sizing:border-box;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px));background:rgba(12,16,26,.96);border-top:1px solid var(--ln,#26324a);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 -8px 28px rgba(0,0,0,.22)}',
    '#primeHindiBottomNav a{position:relative;z-index:1;min-width:0;min-height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:16px;color:var(--mu,#8A94A8);font:600 10px/1.1 Inter,system-ui,sans-serif;text-decoration:none;transition:color .25s;-webkit-tap-highlight-color:transparent}',
    '#primeHindiBottomNav a svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .45s cubic-bezier(.34,1.56,.64,1)}',
    '#primeHindiBottomNav a[aria-current="page"]{color:#fff}#primeHindiBottomNav a[aria-current="page"] svg{transform:translateY(-2px) scale(1.14)}',
    '#primeHindiBottomNav .pn-blobs{position:absolute;left:0;top:0;right:0;bottom:0;z-index:0;pointer-events:none;filter:url(#pnGoo)}',
    '#primeHindiBottomNav .pn-blob{position:absolute;left:0;top:0;width:0;height:48px;border-radius:16px;background:linear-gradient(135deg,var(--ac,#2F6BFF),#7B4DFF);box-shadow:0 6px 18px rgba(47,107,255,.35);will-change:transform,width}',
    '#primeHindiBottomNav.pn-blob-on .pn-blob{transition:transform .5s cubic-bezier(.34,1.45,.5,1),width .5s ease,height .5s ease}',
    '#primeHindiBottomNav.pn-blob-on .pn-blob.pn-tail{transition:transform .85s cubic-bezier(.2,.8,.2,1),width .85s ease,height .85s ease}',
    'body{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))}body.pn-watch{padding-bottom:0}body.pn-watch #primeHindiBottomNav{display:none}body.pn-watch main{padding-bottom:24px}#app{scroll-margin-bottom:90px}',
    '#pnBrowseFilters{display:flex;gap:8px;overflow-x:auto;padding:2px 0 8px;margin:10px 0 16px;scrollbar-width:none}#pnBrowseFilters::-webkit-scrollbar{display:none}',
    '#pnBrowseFilters button{flex:0 0 auto;border:1px solid var(--ln);background:var(--cd);color:var(--sv);border-radius:999px;padding:9px 14px;font:600 12px Inter;cursor:pointer}#pnBrowseFilters button[aria-pressed="true"]{background:var(--ac);border-color:var(--ac);color:white}',
    '#pnBrowseResults{min-height:120px}@media(min-width:760px){#primeHindiBottomNav{left:50%;right:auto;transform:translateX(-50%);width:min(520px,calc(100% - 32px));border:1px solid var(--ln);border-bottom:0;border-radius:18px 18px 0 0}body{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))}}',
    '@media(prefers-reduced-motion:reduce){#primeHindiBottomNav a,#primeHindiBottomNav a svg,#primeHindiBottomNav.pn-blob-on .pn-blob{transition:none!important}}'
  ].join('');
  document.head.appendChild(style);
  const nav = document.createElement('nav');
  nav.id = 'primeHindiBottomNav';
  nav.setAttribute('aria-label','Main navigation');
  nav.innerHTML =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><filter id="pnGoo" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/></filter></defs></svg>' +
    '<span class="pn-blobs" aria-hidden="true"><i class="pn-blob pn-main"></i><i class="pn-blob pn-tail"></i></span>' +
    links.map(([key,href,label]) => '<a href="'+href+'" data-pn-tab="'+key+'">'+icons[key]+'<span>'+label+'</span></a>').join('');
  document.body.appendChild(nav);

  // Morphing blob: two blobs travel to the active tab at different speeds; the goo filter merges them into a stretching, liquid shape.
  const blobs = nav.querySelectorAll('.pn-blob');
  let blobReady = false;
  function moveBlob(a) {
    if (!a || !a.offsetWidth) return;
    const w = a.offsetWidth - 4, h = a.offsetHeight, x = a.offsetLeft + 2, y = a.offsetTop;
    blobs.forEach(b => {
      b.style.width = w + 'px';
      b.style.height = h + 'px';
      b.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    if (!blobReady) {
      blobReady = true;
      requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('pn-blob-on')));
    }
  }

  if (typeof V !== 'undefined') {
    V.categories = () => V.genres().replace('<h1 class="ph">Genres</h1>', '<h1 class="ph">Categories</h1>');
    V.browse = () => {
      const recent = [...A].reverse().slice(0,8);
      const studioNames = [...new Set(A.map(a => a.studioName).filter(Boolean))].sort();
      return '<h1 class="ph">Browse Anime</h1><p class="mu">Explore Hindi-dubbed anime, movies, new additions and studios.</p>' +
        '<div id="pnBrowseFilters" role="group" aria-label="Filter anime">' +
        '<button type="button" data-pn-filter="all" aria-pressed="true">All Anime</button>' +
        '<button type="button" data-pn-filter="movies" aria-pressed="false">Movies</button>' +
        '<button type="button" data-pn-filter="series" aria-pressed="false">Series</button>' +
        '<button type="button" data-pn-filter="trending" aria-pressed="false">Trending</button>' +
        '<button type="button" data-pn-filter="latest" aria-pressed="false">Recently Added</button></div>' +
        '<div id="pnBrowseResults">' + (typeof grid === 'function' ? grid(A) : '') + '</div>' +
        '<section><div class="sh"><h2>Explore by genre</h2><a href="#/categories">View all</a></div><div class="chs">' +
        (Array.isArray(G) ? G.slice(0,10).map(g => '<a class="chip" href="#/search/' + encodeURIComponent(g) + '">' + esc(g) + '</a>').join('') : '') +
        '</div></section>' +
        (studioNames.length ? '<section><div class="sh"><h2>Studios</h2><a href="#/studios">View all</a></div><div class="chs">' + studioNames.slice(0,8).map(s => '<a class="chip" href="#/studios/' + encodeURIComponent(s) + '">' + esc(s) + '</a>').join('') + '</div></section>' : '') +
        '<section><div class="sh"><h2>Recently added</h2><a href="#/search">View all</a></div>' +
        (typeof rib === 'function' ? rib(recent) : '') + '</section>';
    };
    V.studios = (selected) => {
      const studios = [...new Set(A.map(a => a.studioName).filter(Boolean))].sort();
      if (selected) {
        const titles = A.filter(a => a.studioName === selected);
        return '<h1 class="ph">' + esc(selected) + '</h1><p class="mu">Anime credited to this studio in the Prime Hindi catalogue.</p><a class="chip" href="#/studios">← All studios</a>' +
          (titles.length ? grid(titles) : '<p class="mu">No titles are currently listed for this studio.</p>');
      }
      return '<h1 class="ph">Dubbing Studios</h1><p class="mu">Explore anime by its credited dubbing studio.</p>' +
        (studios.length ? '<div class="gr t">' + studios.map(s => '<a class="gt" href="#/studios/' + encodeURIComponent(s) + '">' + esc(s) + '<small>' + A.filter(a => a.studioName === s).length + ' titles</small></a>').join('') + '</div>' :
        '<p class="mu">Studio credits will appear here when they are added to anime listings.</p>');
    };
    const originalProfile = V.profile;
    V.profile = () => originalProfile() + '<section><div class="sh"><h2>Your library</h2></div><div class="chs"><a class="chip" href="#/watchlist">My List</a><a class="chip" href="#/watchlist">Watch History &amp; Continue Watching</a></div></section>';
  }
  function activeKey() {
    const route = location.hash.replace(/^#\/?/,'').split('/')[0] || 'home';
    if (route === 'home') return 'home';
    if (['browse','anime','schedule','watchlist','watch','studios'].includes(route)) return 'browse';
    if (route === 'search') return 'search';
    if (route === 'manga') return 'manga';
    if (['genres','categories'].includes(route)) return 'categories';
    if (['profile','signin','signup','forgot-password','reset-password'].includes(route)) return 'profile';
    return 'browse';
  }
  function syncNav() {
    const route = location.hash.replace(/^#\/?/,'').split('/')[0] || 'home';
    document.body.classList.toggle('pn-watch', route === 'watch');
    const key = activeKey();
    nav.querySelectorAll('[data-pn-tab]').forEach(a => {
      if (a.dataset.pnTab === key) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    moveBlob(nav.querySelector('[aria-current="page"]'));
    const notice = document.getElementById('pdiNotificationWidget');
    if (notice && route !== 'watch') notice.style.bottom = 'calc(78px + env(safe-area-inset-bottom, 0px))';
  }
  function applyBrowseFilter(filter) {
    if (typeof A === 'undefined' || typeof grid !== 'function') return;
    let rows = [...A];
    if (filter === 'movies') rows = rows.filter(a => /movie|film/i.test(String(a.type || 'series')));
    else if (filter === 'series') rows = rows.filter(a => !/movie|film/i.test(String(a.type || 'series')));
    else if (filter === 'trending') rows = rows.slice(0,12);
    else if (filter === 'latest') rows = rows.slice(-12).reverse();
    const target = document.getElementById('pnBrowseResults');
    if (target) target.innerHTML = rows.length ? grid(rows) : '<p class="mu">No titles found in this section yet.</p>';
    document.querySelectorAll('[data-pn-filter]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.pnFilter === filter)));
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-pn-filter]'); if (b) applyBrowseFilter(b.dataset.pnFilter); });
  // Expand the existing search to cover title, alternate title, genre, studio and voice credits.
  document.addEventListener('input', e => {
    if (!e.target || e.target.id !== 'q' || typeof A === 'undefined' || typeof grid !== 'function') return;
    const query = e.target.value.trim().toLocaleLowerCase();
    const genre = document.getElementById('gs')?.value || '';
    const status = document.getElementById('ss')?.value || '';
    const year = document.getElementById('ys')?.value || '';
    const rows = A.filter(a => {
      const cast = (a.voiceCast || []).flatMap(c => [c.name, c.actor]).filter(Boolean).join(' ');
      const searchable = [a.t, a.altTitle, a.g, ...(a.genres || []), a.studioName, cast].join(' ').toLocaleLowerCase();
      return (!query || searchable.includes(query)) && (!genre || (a.genres || [a.g]).includes(genre)) &&
        (!status || a.s === status) && (!year || String(a.y) === year);
    });
    const target = document.getElementById('res');
    if (target) target.innerHTML = rows.length ? grid(rows) : '<p class="mu">No anime, studio or voice credit found. Try another search.</p>';
  });
  window.addEventListener('hashchange',() => setTimeout(syncNav,0));
  window.addEventListener('resize',() => moveBlob(nav.querySelector('[aria-current="page"]')));
  window.addEventListener('load',() => moveBlob(nav.querySelector('[aria-current="page"]')));
  const app = document.getElementById('app');
  if (app && 'MutationObserver' in window) new MutationObserver(syncNav).observe(app,{childList:true});
  syncNav();
})();

// Characters & Hindi Voice Cast: compact row layout (character left, Hindi voice artist right)
(() => {
  if (typeof V === 'undefined' || typeof V.anime !== 'function' || typeof A === 'undefined') return;
  const css = document.createElement('style');
  css.id = 'pnCastStyles';
  css.textContent = [
    '.pn-cast-count{color:var(--mu,#93A0B7);font:600 13px ui-monospace,Menlo,monospace;white-space:nowrap}',
    '.pn-cast-list{display:grid;gap:12px}',
    '.pn-cast-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--ln,#26324a);border-radius:18px;background:var(--cd,#111622);min-width:0;overflow:hidden}',
    '.pn-cast-side{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 0}',
    '.pn-cast-side.r{flex-direction:row-reverse;text-align:right}',
    '.pn-cast-side img,.pn-cast-ph{display:block;flex:0 0 76px;width:76px!important;height:76px!important;max-width:76px;max-height:76px;border-radius:14px;object-fit:cover;background:var(--bg,#0A0D14)}',
    '.pn-cast-ph{display:grid;place-items:center;color:var(--mu,#93A0B7);font-size:9px}',
    '.pn-cast-txt{min-width:0;display:flex;flex-direction:column;gap:3px}',
    '.pn-cast-txt b{font-size:16px;line-height:1.2;overflow-wrap:anywhere;color:var(--tx,#F2F5FA)}',
    '.pn-cast-txt span{font-size:13px;color:var(--mu,#93A0B7)}',
    '.pn-cast-side:not(.r) .pn-cast-txt span{color:#00c8ff}',
    '.pn-cast-row audio{flex:1 1 100%;width:100%;height:36px}',
    '@media(max-width:430px){.pn-cast-side{gap:10px}.pn-cast-side img,.pn-cast-ph{flex-basis:60px;width:60px!important;height:60px!important;max-width:60px;max-height:60px}.pn-cast-txt b{font-size:15px}}'
  ].join('');
  document.head.appendChild(css);
  const orig = V.anime;
  V.anime = function (p) {
    const html = orig.apply(this, arguments);
    try {
      const a = A.find(x => String(x.i) === String(p)) || A[+p || 0];
      const raw = Array.isArray(a && a.voiceCast) ? a.voiceCast : (Array.isArray(a && a.voice_cast) ? a.voice_cast : []);
      const cast = raw.filter(ch => ch && String(ch.name || '').trim());
      if (!cast.length) return html;
      const img = (src, alt) => src ? '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy">' : '<div class="pn-cast-ph">N/A</div>';
      const rows = cast.map(ch =>
        '<article class="pn-cast-row">' +
        '<div class="pn-cast-side">' + img(ch.image, ch.name) +
        '<div class="pn-cast-txt"><b>' + esc(ch.name) + '</b><span>' + (ch.role === 'supporting' ? 'Supporting' : 'Main') + '</span></div></div>' +
        '<div class="pn-cast-side r">' + img(ch.actorImage, ch.actor || 'Voice artist') +
        '<div class="pn-cast-txt"><b>' + esc(ch.actor || 'Not credited') + '</b><span>' + esc(ch.language || 'Hindi') + '</span></div></div>' +
        (ch.audioSampleUrl ? '<audio controls preload="none" src="' + esc(ch.audioSampleUrl) + '"></audio>' : '') +
        '</article>').join('');
      return html
        .replace(/<h2>Characters (?:&amp;|&) Hindi Voice Cast<\/h2><a href="#\/search">View all<\/a>/, () => '<h2>Characters &amp; Hindi Voice Cast</h2><span class="pn-cast-count">' + cast.length + ' Listed</span>')
        .replace(/<div class="voice-cast-grid">[\s\S]*?<\/div><\/section>/, () => '<div class="pn-cast-list">' + rows + '</div></section>');
    } catch (e) { return html; }
  };
})();
