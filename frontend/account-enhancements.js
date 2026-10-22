(() => {
  'use strict';
  const colors = ['#2F6BFF', '#7048FF', '#087F8C', '#B45309', '#BE185D', '#0F766E'];
  const token = () => localStorage.getItem('pdi_stream_token') || '';
  const readUser = () => {
    try { return JSON.parse(localStorage.getItem('pdi_stream_user') || '{}') || {}; }
    catch { return {}; }
  };
  const initial = (name) => String(name || 'A').trim().charAt(0).toUpperCase() || 'A';
  const escapeText = (value) => String(value ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const syncHeader = () => {
    const button = document.getElementById('accountBtn');
    if (!button) return;
    const signedIn = !!token();
    const user = readUser();
    const name = user.display_name || user.displayName || 'My Profile';
    if (!signedIn) {
      button.href = '#/signin';
      button.classList.remove('account-signed-in');
      button.textContent = 'Sign in';
      const logout = document.getElementById('accountLogoutBtn');
      if (logout) logout.remove();
      return;
    }
    const letter = initial(name);
    const color = colors[(letter.charCodeAt(0) || 65) % colors.length];
    button.href = '#/profile';
    button.classList.add('account-signed-in');
    button.setAttribute('aria-label', 'Profile: ' + name);
    button.title = name;
    button.innerHTML = '<span class="ph-header-avatar" style="--avatar-color:' + color + '">' + escapeText(letter) + '</span><span class="ph-header-account-name">' + escapeText(name) + '</span>';
    let logout = document.getElementById('accountLogoutBtn');
    if (!logout) {
      logout = document.createElement('button');
      logout.id = 'accountLogoutBtn';
      logout.type = 'button';
      logout.className = 'ib ph-header-logout';
      logout.setAttribute('aria-label', 'Log out');
      logout.title = 'Log out';
      logout.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-5"/></svg>';
      logout.addEventListener('click', () => {
        localStorage.removeItem('pdi_stream_token');
        localStorage.removeItem('pdi_stream_user');
        syncHeader();
        if (location.hash !== '#/signin') location.hash = '#/signin';
        else document.dispatchEvent(new Event('prime-hindi-account-changed'));
      });
      button.insertAdjacentElement('afterend', logout);
    }
  };
  const localCount = (key, uniqueAnime) => {
    try {
      const rows = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(rows)) return 0;
      if (!uniqueAnime) return rows.length;
      return new Set(rows.map(x => String(x && typeof x === 'object' ? (x.animeId ?? x.id ?? '') : x)).filter(Boolean)).size;
    } catch { return 0; }
  };
  const mountStats = async () => {
    const page = document.querySelector('#app .profile-page');
    if (!page || !token()) return;
    const currentToken = token();
    let panel = page.querySelector('#phWatchStats');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'phWatchStats';
      panel.className = 'ph-watch-stats';
      panel.innerHTML = '<div class="ph-watch-stats-heading"><div><span>YOUR ACTIVITY</span><h2>Watch statistics</h2></div><small>Personal overview</small></div><div class="ph-watch-stats-grid"><article><span>Watch history</span><strong data-stat="history">—</strong><small>Titles opened on this device</small></article><article><span>My List</span><strong data-stat="list">—</strong><small>Saved titles on this device</small></article><article><span>Episodes tracked</span><strong data-stat="episodes">—</strong><small>Saved playback progress</small></article></div>';
      const identity = page.querySelector('.profile-identity');
      if (identity) identity.insertAdjacentElement('afterend', panel);
      else page.prepend(panel);
    }
    panel.querySelector('[data-stat="history"]').textContent = String(localCount('primeHindiWatchHistory', true));
    panel.querySelector('[data-stat="list"]').textContent = String(localCount('primeHindiWatchlist', true));
    try {
      const response = await fetch('/api/me/stats', { headers: { Authorization: 'Bearer ' + currentToken }, cache: 'no-store' });
      if (response.status === 401) {
        if (token() === currentToken) {
          localStorage.removeItem('pdi_stream_token');
          localStorage.removeItem('pdi_stream_user');
          syncHeader();
        }
        return;
      }
      if (!response.ok) throw new Error('stats unavailable');
      const stats = await response.json();
      if (!panel.isConnected || token() !== currentToken) return;
      panel.querySelector('[data-stat="episodes"]').textContent = String(Number(stats.episodes_started) || 0);
    } catch {
      const item = panel.querySelector('[data-stat="episodes"]');
      if (item) item.textContent = '—';
    }
  };
  const style = document.createElement('style');
  style.textContent = `
    header #accountBtn.account-signed-in{display:inline-flex;align-items:center;gap:8px;max-width:min(220px,34vw);padding:5px 10px 5px 6px}
    .ph-header-avatar{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50%;background:var(--avatar-color,#2F6BFF);color:#fff;font:800 14px/1 Sora,Inter,sans-serif;border:1px solid #ffffff35;box-shadow:0 3px 12px #0004}
    .ph-header-account-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}
    .ph-header-logout{flex:none;width:36px;height:38px;border:1px solid var(--ln);border-radius:11px;color:var(--sv);background:var(--cd)}
    .ph-header-logout:hover{color:#fff;border-color:var(--ac);background:#17294a}
    .ph-watch-stats{margin:0 0 18px;padding:18px;background:linear-gradient(135deg,#111b2e,#101522);border:1px solid #263754;border-radius:19px}
    .ph-watch-stats-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
    .ph-watch-stats-heading span{font:800 9px Sora,Inter,sans-serif;letter-spacing:.16em;color:#82aaff}
    .ph-watch-stats-heading h2{font:700 18px Sora,Inter,sans-serif;margin-top:4px}
    .ph-watch-stats-heading>small{font-size:10px;white-space:nowrap}
    .ph-watch-stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .ph-watch-stats-grid article{min-width:0;padding:12px 10px;border:1px solid #273752;border-radius:13px;background:#0b111d;display:grid;gap:5px}
    .ph-watch-stats-grid article>span{font-size:10px;color:#aab8d0}
    .ph-watch-stats-grid article>strong{font:800 clamp(20px,4vw,27px)/1.1 Sora,Inter,sans-serif;color:#fff;overflow-wrap:anywhere}
    .ph-watch-stats-grid article>small{font-size:9px;line-height:1.35}
    @media(max-width:430px){header #accountBtn.account-signed-in{gap:6px;padding:4px 7px 4px 4px;max-width:38vw}header #accountBtn .ph-header-avatar{width:30px;height:30px}header #accountBtn .ph-header-account-name{max-width:23vw;font-size:11px}.ph-header-logout{width:32px;height:34px}.ph-watch-stats{padding:13px;border-radius:16px}.ph-watch-stats-grid{gap:6px}.ph-watch-stats-grid article{padding:10px 7px}.ph-watch-stats-grid article>span{font-size:9px}.ph-watch-stats-grid article>small{font-size:8px}}
  `;
  document.head.appendChild(style);
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => { syncHeader(); mountStats(); }).observe(app, { childList: true, subtree: true });
  // The main router calls syncAccountButton during navigation; observing the button's
  // own children here would create a mutation loop, so update on route/storage events instead.
  window.addEventListener('storage', syncHeader);
  window.addEventListener('hashchange', () => { syncHeader(); mountStats(); });
  document.addEventListener('prime-hindi-account-changed', syncHeader);
  syncHeader();
  if (token()) {
    fetch('/api/me', { headers: { Authorization: 'Bearer ' + token() }, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('session invalid');
        const user = await response.json();
        if (token()) localStorage.setItem('pdi_stream_user', JSON.stringify(user));
        syncHeader();
      })
      .catch(() => {
        localStorage.removeItem('pdi_stream_token');
        localStorage.removeItem('pdi_stream_user');
        syncHeader();
      });
  }
  mountStats();
})();
