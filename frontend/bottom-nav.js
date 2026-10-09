(() => {
  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
    browse: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4M8 11h6M11 8v6"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 4.5 4.5"/></svg>',
    categories: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
  };
  const links = [['home','#/','Home'],['browse','#/browse','Browse'],['search','#/search','Search'],['categories','#/categories','Categories'],['profile','#/profile','Profile']];
  const style = document.createElement('style');
  style.id = 'primeHindiBottomNavStyles';
  style.textContent = [
    '#primeHindiBottomNav{position:fixed;z-index:85;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px));background:rgba(12,16,26,.96);border-top:1px solid var(--ln,#26324a);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 -8px 28px rgba(0,0,0,.22)}',
    '#primeHindiBottomNav a{min-width:0;min-height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:12px;color:var(--mu,#8A94A8);font:600 10px/1.1 Inter,system-ui,sans-serif;text-decoration:none;transition:color .16s,background .16s}',
    '#primeHindiBottomNav a svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '#primeHindiBottomNav a[aria-current="page"]{color:#fff;background:rgba(47,107,255,.17)}#primeHindiBottomNav a[aria-current="page"] svg{color:var(--ac,#2F6BFF)}',
    'body{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))}body.pn-watch{padding-bottom:0}body.pn-watch #primeHindiBottomNav{display:none}body.pn-watch main{padding-bottom:24px}#app{scroll-margin-bottom:90px}',
    '#pnBrowseFilters{display:flex;gap:8px;overflow-x:auto;padding:2px 0 8px;margin:10px 0 16px;scrollbar-width:none}#pnBrowseFilters::-webkit-scrollbar{display:none}',
    '#pnBrowseFilters button{flex:0 0 auto;border:1px solid var(--ln);background:var(--cd);color:var(--sv);border-radius:999px;padding:9px 14px;font:600 12px Inter;cursor:pointer}#pnBrowseFilters button[aria-pressed="true"]{background:var(--ac);border-color:var(--ac);color:white}',
    '#pnBrowseResults{min-height:120px}@media(min-width:760px){#primeHindiBottomNav{left:50%;right:auto;transform:translateX(-50%);width:min(520px,calc(100% - 32px));border:1px solid var(--ln);border-bottom:0;border-radius:18px 18px 0 0}body{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))}}',
    '@media(prefers-reduced-motion:reduce){#primeHindiBottomNav a{transition:none}}'
  ].join('');
  document.head.appendChild(style);
  const nav = document.createElement('nav');
  nav.id = 'primeHindiBottomNav';
  nav.setAttribute('aria-label','Main navigation');
  nav.innerHTML = links.map(([key,href,label]) => '<a href="'+href+'" data-pn-tab="'+key+'">'+icons[key]+'<span>'+label+'</span></a>').join('');
  document.body.appendChild(nav);

  if (typeof V !== 'undefined') {
    V.categories = V.genres;
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
    const notice = document.getElementById('pdiNotificationWidget');
    if (notice && route !== 'watch') notice.style.bottom = 'calc(78px + env(safe-area-inset-bottom, 0px))';
  }
  function applyBrowseFilter(filter) {
    if (typeof A === 'undefined' || typeof grid !== 'function') return;
    let rows = [...A];
    if (filter === 'movies') rows = rows.filter(a => /movie|film/i.test(String(a.type || '')));
    else if (filter === 'series') rows = rows.filter(a => !/movie|film/i.test(String(a.type || '')));
    else if (filter === 'trending') rows = rows.slice(0,12);
    else if (filter === 'latest') rows = rows.slice(-12).reverse();
    const target = document.getElementById('pnBrowseResults');
    if (target) target.innerHTML = rows.length ? grid(rows) : '<p class="mu">No titles found in this section yet.</p>';
    document.querySelectorAll('[data-pn-filter]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.pnFilter === filter)));
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-pn-filter]'); if (b) applyBrowseFilter(b.dataset.pnFilter); });
  window.addEventListener('hashchange',() => setTimeout(syncNav,0));
  const app = document.getElementById('app');
  if (app && 'MutationObserver' in window) new MutationObserver(syncNav).observe(app,{childList:true});
  syncNav();
})();