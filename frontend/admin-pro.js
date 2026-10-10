/* Prime Hindi admin: pro dashboard skin (additive; does not change existing admin logic). */
(function () {
  'use strict';
  if (window.__phAdminPro) return;
  window.__phAdminPro = true;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var arr = function (x) { return Array.isArray(x) ? x : []; };
  var sum = function (a) { return a.reduce(function (s, v) { return s + v; }, 0); };
  var C = { blue: '#6d5efc', cyan: '#4de1ff', pink: '#ff4d8d', green: '#3ddc97', amber: '#ffb84d', violet: '#b69cff', red: '#ff5d6c' };
  var PAL = [C.blue, C.cyan, C.pink, C.green, C.amber, C.violet, C.red];

  /* ---------- CSS ---------- */
  var css = `
:root{--bg:#05070e;--panel:#0d1220;--panel2:#131a2c;--line:#212b44;--blue:#6d5efc;--gold:#b69cff;--neon:#4de1ff;--txt:#f4f6fd;--muted:#8794ad}
body{background:radial-gradient(1000px 520px at 100% -10%,#3a2a8a40,transparent 60%),radial-gradient(800px 460px at -10% 0,#0c4a6e33,transparent 60%),var(--bg)}
.loginWrap{background:radial-gradient(700px 420px at 50% 0,#4b32c355,transparent 70%)}
.login{background:linear-gradient(145deg,#141b30e6,#0b101dee);backdrop-filter:blur(14px);border-color:#2c3a5c;box-shadow:0 30px 100px #000a,0 0 0 1px #6d5efc22}
.brandMark{background:linear-gradient(135deg,#6d5efc,#4de1ff);box-shadow:0 8px 26px #6d5efc55;overflow:hidden;color:#fff}
.brandMark img{width:100%;height:100%;object-fit:contain;background:#0a0f1c}
.btn{background:linear-gradient(135deg,#6d5efc,#8b5cf6);box-shadow:0 6px 20px #6d5efc30}
.btn.secondary,.btn.danger{box-shadow:none}
.btn.gold{background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff}
.sidebar{background:linear-gradient(180deg,#0a0f1c,#070a13)}
.sidebar .navLabel,.statusPill{display:none}
.nav{gap:3px}
.ph-navlabel{font-size:10px;font-weight:800;letter-spacing:1.6px;color:#5d6b88;padding:14px 12px 4px;text-transform:uppercase}
.nav button{position:relative;border-radius:12px}
.nav button.active{background:linear-gradient(90deg,#6d5efc38,#6d5efc0a);color:#fff;box-shadow:inset 3px 0 0 #8b7bff}
.ph-count{margin-left:auto;background:#ff4d8d;color:#fff;border-radius:99px;font-size:10px;font-weight:800;padding:1px 7px;min-width:20px;text-align:center}
.ph-count.hide{display:none}
.topbar{position:sticky;top:0;z-index:20;margin:-28px calc(-1*clamp(15px,3vw,38px)) 24px;padding:14px clamp(15px,3vw,38px);background:#070a12db;backdrop-filter:blur(14px);border-bottom:1px solid #1b2540}
.panel,.stat{background:linear-gradient(150deg,#121a2e,#0b101d);border:1px solid #1f2a45;border-radius:18px}
.ph-hide{display:none!important}
#view-overview>.stats,#view-overview>.twoCol{display:none}
.ph-search{display:flex;align-items:center;gap:8px;background:#0b1120;border:1px solid #27345a;border-radius:12px;padding:0 12px;width:250px}
.ph-search svg{width:15px;height:15px;color:#7f8da8;flex:none}
.ph-search input{background:none;border:0;outline:0;color:#fff;padding:10px 0;width:100%;min-width:0}
.ph-iconbtn{position:relative;width:40px;height:40px;border-radius:12px;border:1px solid #27345a;background:#0b1120;color:#dbe5f5;display:grid;place-items:center;flex:none}
.ph-iconbtn svg{width:18px;height:18px}
.ph-dot{position:absolute;top:-5px;right:-5px;background:#ff4d8d;color:#fff;border-radius:99px;font-size:10px;font-weight:800;padding:1px 6px;min-width:18px;text-align:center}
.ph-dot.hide{display:none}
.ph-menuWrap{position:relative}
.ph-menu{position:absolute;right:0;top:46px;min-width:200px;background:#10172a;border:1px solid #2c3a5c;border-radius:14px;padding:6px;z-index:60;box-shadow:0 20px 60px #000b}
.ph-menu button{display:flex;gap:10px;align-items:center;width:100%;border:0;background:none;color:#e4ebf8;padding:10px 12px;border-radius:9px;text-align:left;font-weight:600}
.ph-menu button:hover{background:#1c2744}
.ph-menu svg{width:16px;height:16px}
.ph-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6d5efc,#ec4899);display:grid;place-items:center;font:800 15px Sora;color:#fff;flex:none}
.ph-hero{position:relative;overflow:hidden;border-radius:22px;padding:24px;margin-bottom:16px;background:linear-gradient(120deg,#2a1d6e,#5b2aa5 55%,#b02f78);border:1px solid #ffffff1f}
.ph-hero:after{content:"";position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,#ffffff2a,transparent 70%)}
.ph-hero h2{font:800 clamp(20px,3vw,27px) Sora;margin:0 0 4px}
.ph-hero p{margin:0 0 16px;color:#e6dcff;font-size:13px}
.ph-hero .acts{display:flex;gap:8px;flex-wrap:wrap;position:relative;z-index:1}
.ph-hero .btn{background:#fff;color:#1b1340;box-shadow:none}
.ph-hero .btn.ghost{background:#ffffff22;color:#fff;border-color:#ffffff40}
.ph-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px}
.ph-kpi{position:relative;overflow:hidden;padding:16px;border-radius:18px;background:linear-gradient(150deg,#141c31,#0b101d);border:1px solid #1f2a45;cursor:pointer;transition:transform .15s,border-color .15s}
.ph-kpi:hover{transform:translateY(-2px);border-color:#3b4b7a}
.ph-kpi .top{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-weight:700;font-size:12px}
.ph-kpi .ic{width:34px;height:34px;border-radius:11px;display:grid;place-items:center}
.ph-kpi .ic svg{width:17px;height:17px}
.ph-kpi .n{font:800 28px Sora;margin:10px 0 2px}
.ph-kpi .s{font-size:11px;color:var(--muted)}
.ph-spark{position:absolute;right:0;bottom:0;width:48%;height:44px;opacity:.9}
.ph-grid{display:grid;gap:16px;margin-bottom:16px}
.ph-g21{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
.ph-g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.ph-g2{grid-template-columns:repeat(2,minmax(0,1fr))}
.ph-card{padding:18px;border-radius:18px;background:linear-gradient(150deg,#121a2e,#0b101d);border:1px solid #1f2a45;min-width:0}
.ph-card h3{font:700 15px Sora;margin:0 0 3px}
.ph-card .sub{color:var(--muted);font-size:11px;margin-bottom:14px}
.ph-card .hd{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.ph-link{background:none;border:0;color:#9db0ff;font-size:12px;font-weight:700;padding:0}
.ph-area{width:100%;height:auto;display:block}
.ph-key{display:flex;gap:14px;font-size:11px;color:var(--muted);margin-top:8px}
.ph-key i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px}
.ph-donutWrap{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.ph-donut{width:130px;height:130px;flex:none}
.ph-legend{flex:1;min-width:120px;display:grid;gap:7px}
.ph-leg{display:flex;align-items:center;gap:8px;font-size:12px;color:#c4cfe4}
.ph-leg i{width:10px;height:10px;border-radius:3px;flex:none}
.ph-leg span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-hb{margin-bottom:11px}
.ph-hbTop{display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:5px}
.ph-hbTop span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-hbTop em{font-style:normal;color:#6c7a96;margin-right:8px}
.ph-hbTrack{height:7px;background:#19223a;border-radius:9px;overflow:hidden}
.ph-hbTrack div{height:100%;border-radius:9px}
.ph-vb{display:flex;align-items:flex-end;gap:10px;height:160px;padding-top:10px}
.ph-vb div{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:5px;font-size:10px;color:var(--muted)}
.ph-vb i{display:block;width:100%;max-width:34px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#8b7bff,#4de1ff)}
.ph-vb span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-strip{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x proximity}
.ph-poster{flex:0 0 118px;scroll-snap-align:start;cursor:pointer}
.ph-poster .img{position:relative;aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:#19223a;border:1px solid #27345a}
.ph-poster img{width:100%;height:100%;object-fit:cover;display:block}
.ph-poster .tag{position:absolute;left:6px;top:6px;background:#000a;backdrop-filter:blur(6px);color:#fff;border-radius:7px;font-size:9px;font-weight:800;padding:2px 6px;text-transform:uppercase}
.ph-poster .rt{position:absolute;right:6px;bottom:6px;background:#ffb84d;color:#1a1200;border-radius:7px;font-size:10px;font-weight:800;padding:2px 6px}
.ph-poster b{display:block;font-size:12px;margin-top:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-row{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid #1a2440}
.ph-row:last-child{border-bottom:0}
.ph-row .t{flex:1;min-width:0}
.ph-row .t b{display:block;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-row .t span{display:block;font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-row .a{display:flex;gap:6px;flex:none}
.ph-mini{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6d5efc,#4de1ff);display:grid;place-items:center;font:800 12px Sora;color:#fff;flex:none}
.ph-meter{margin-bottom:14px}
.ph-meter .l{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;color:#c4cfe4}
.ph-meter .bar{height:8px;background:#19223a;border-radius:9px;overflow:hidden}
.ph-meter .bar div{height:100%;border-radius:9px}
.ph-empty{color:var(--muted);font-size:12px;padding:14px 0;text-align:center}
#phBottom{display:none}
@media(max-width:1100px){.ph-g21{grid-template-columns:1fr}.ph-g3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:950px){.ph-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){
 .topbar{margin:-18px -13px 16px;padding:12px 13px}
 .ph-search,#refreshBtn{display:none}
 .ph-g3,.ph-g2{grid-template-columns:1fr}
 .ph-kpis{gap:10px}.ph-kpi{padding:13px}.ph-kpi .n{font-size:23px}
 .ph-hero{padding:18px}
 main{padding-bottom:96px!important}
 .toast{bottom:88px}
 #phBottom{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;z-index:35;background:#0a0f1cf2;backdrop-filter:blur(16px);border-top:1px solid #1f2a45;padding:6px 6px calc(6px + env(safe-area-inset-bottom))}
 #phBottom button{background:none;border:0;color:#7f8da8;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:6px 0;position:relative}
 #phBottom button svg{width:20px;height:20px}
 #phBottom button.on{color:#fff}
 #phBottom button.on svg{color:#8b7bff}
}
`;
  var st = document.createElement('style'); st.id = 'phProCss'; st.textContent = css; document.head.appendChild(st);
  document.title = 'Prime Hindi · Admin';

  /* ---------- branding ---------- */
  document.querySelectorAll('.brand').forEach(function (b) {
    var inSide = !!b.closest('.sidebar');
    b.innerHTML = '<span class="brandMark">P</span><span>PRIME' + (inSide ? '<br>' : ' ') + '<span style="color:var(--gold)">HINDI</span></span>';
  });
  fetch('/api/branding').then(function (r) { return r.ok ? r.json() : null; }).then(function (b) {
    if (b && b.logoUrl) document.querySelectorAll('.brandMark').forEach(function (m) { m.innerHTML = '<img alt="" src="' + esc(b.logoUrl) + '">'; });
  }).catch(function () {});

  /* ---------- sidebar grouping ---------- */
  var nav = document.querySelector('#sidebar .nav'), btn = {};
  if (nav) {
    nav.querySelectorAll('button[data-tab]').forEach(function (b) { btn[b.dataset.tab] = b; });
    var groups = [['Main', ['overview']], ['Catalog', ['anime', 'episodes', 'studios']], ['Audience', ['users', 'comments', 'notifications', 'reports']], ['Insights', ['analytics', 'activity']], ['System', ['settings', 'team']]];
    var frag = document.createDocumentFragment();
    groups.forEach(function (g) {
      var l = document.createElement('div'); l.className = 'ph-navlabel'; l.textContent = g[0]; l.dataset.grp = g[0]; frag.appendChild(l);
      g[1].forEach(function (t) { if (btn[t]) { btn[t].dataset.grp = g[0]; frag.appendChild(btn[t]); } });
    });
    nav.innerHTML = ''; nav.appendChild(frag);
    var setIco = function (t, n) { if (btn[t]) { var i = btn[t].querySelector('.ico'); if (i) i.innerHTML = '<i data-lucide="' + n + '"></i>'; } };
    setIco('studios', 'building-2'); setIco('episodes', 'film'); setIco('anime', 'library');
    ['comments', 'reports'].forEach(function (t) { if (btn[t]) btn[t].insertAdjacentHTML('beforeend', '<span class="ph-count hide" id="phc-' + t + '"></span>'); });
  }
  function syncLabels() {
    document.querySelectorAll('.ph-navlabel').forEach(function (l) {
      var any = Array.prototype.some.call(document.querySelectorAll('#sidebar button[data-grp="' + l.dataset.grp + '"]'), function (b) { return !b.classList.contains('hidden'); });
      l.style.display = any ? '' : 'none';
    });
  }

  /* ---------- topbar ---------- */
  var ta = document.querySelector('.topActions');
  if (ta) {
    ta.insertAdjacentHTML('afterbegin', '<div class="ph-search"><i data-lucide="search"></i><input id="phSearch" placeholder="Search titles… (press /)" autocomplete="off"></div>');
    ta.insertAdjacentHTML('beforeend', '<button class="ph-iconbtn" id="phBell" aria-label="Notifications"><i data-lucide="bell"></i><span class="ph-dot hide" id="phBellN"></span></button><div class="ph-menuWrap"><button class="btn" id="phCreate">＋ Create</button><div class="ph-menu hidden" id="phMenu"><button data-m="anime"><i data-lucide="clapperboard"></i>Add anime</button><button data-m="episode"><i data-lucide="play-square"></i>Add episode</button><button data-m="bulk"><i data-lucide="layers"></i>Bulk add episodes</button><button data-m="notify"><i data-lucide="bell-ring"></i>Send notification</button></div></div><div class="ph-av" id="phAv">A</div>');
    $('phCreate').addEventListener('click', function (e) { e.stopPropagation(); $('phMenu').classList.toggle('hidden'); });
    document.addEventListener('click', function () { var m = $('phMenu'); if (m) m.classList.add('hidden'); });
    $('phMenu').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-m]'); if (!b) return; var m = b.dataset.m;
      if (m === 'anime') window.openAnimeModal(); else if (m === 'episode') window.openEpisodeModal(); else if (m === 'bulk') window.openBulkEpisodes(); else window.switchTab('notifications');
    });
    $('phBell').addEventListener('click', function () { window.switchTab(Number((($('phc-reports') || {}).textContent) || 0) > Number((($('phc-comments') || {}).textContent) || 0) ? 'reports' : 'comments'); });
    $('phSearch').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return; window.switchTab('anime');
      var s = $('animeSearch'); if (s) { s.value = this.value; s.dispatchEvent(new Event('input')); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); $('phSearch').focus(); } });
  }

  /* ---------- mobile bottom bar ---------- */
  var bar = document.createElement('div'); bar.id = 'phBottom';
  bar.innerHTML = [['overview', 'layout-dashboard', 'Home'], ['anime', 'library', 'Anime'], ['episodes', 'film', 'Episodes'], ['comments', 'messages-square', 'Reviews'], ['menu', 'menu', 'More']].map(function (x) { return '<button data-b="' + x[0] + '"><i data-lucide="' + x[1] + '"></i>' + x[2] + '</button>'; }).join('');
  document.body.appendChild(bar);
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-b]'); if (!b) return;
    if (b.dataset.b === 'menu') $('sidebar').classList.toggle('open'); else window.switchTab(b.dataset.b);
  });
  function syncBar() {
    var cur = document.querySelector('#sidebar button.active'); var t = cur ? cur.dataset.tab : '';
    bar.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.b === t); });
  }

  /* ---------- chart helpers ---------- */
  function num(n) { n = Number(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : String(n); }
  function spark(v, c) {
    if (!v || v.length < 2) return '';
    var max = Math.max.apply(null, v.concat(1)), h = 30, w = 100;
    var pts = v.map(function (y, i) { return (i * w / (v.length - 1)).toFixed(1) + ',' + (h - 2 - (y / max) * (h - 6)).toFixed(1); });
    return '<svg class="ph-spark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="0,' + h + ' ' + pts.join(' ') + ' ' + w + ',' + h + '" fill="' + c + '22" stroke="none"/><polyline points="' + pts.join(' ') + '" fill="none" stroke="' + c + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function area(rows, keys) {
    if (!rows.length) return '<div class="ph-empty">No activity yet.</div>';
    var w = 640, h = 210, pl = 30, pb = 22, pt = 10, pr = 8, iw = w - pl - pr, ih = h - pt - pb, max = 1;
    keys.forEach(function (k) { rows.forEach(function (r) { max = Math.max(max, Number(r[k.k]) || 0); }); });
    var X = function (i) { return pl + i * iw / Math.max(1, rows.length - 1); }, Y = function (v) { return pt + ih - (v / max) * ih; };
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" class="ph-area">';
    for (var g = 0; g <= 4; g++) { var gy = pt + g * ih / 4; s += '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + gy + '" y2="' + gy + '" stroke="#222c44" stroke-dasharray="3 5"/><text x="' + (pl - 6) + '" y="' + (gy + 3) + '" text-anchor="end" fill="#6c7a96" font-size="9">' + Math.round(max * (1 - g / 4)) + '</text>'; }
    keys.forEach(function (k, ki) {
      var pts = rows.map(function (r, i) { return X(i).toFixed(1) + ',' + Y(Number(r[k.k]) || 0).toFixed(1); }).join(' ');
      s += '<defs><linearGradient id="phg' + ki + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + k.c + '" stop-opacity=".35"/><stop offset="1" stop-color="' + k.c + '" stop-opacity="0"/></linearGradient></defs>';
      s += '<polygon points="' + X(0) + ',' + (pt + ih) + ' ' + pts + ' ' + X(rows.length - 1) + ',' + (pt + ih) + '" fill="url(#phg' + ki + ')"/><polyline points="' + pts + '" fill="none" stroke="' + k.c + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    });
    [0, Math.floor((rows.length - 1) / 2), rows.length - 1].forEach(function (i) {
      var r = rows[i], d = String(r.day || r.date || r.d || r.label || '').slice(5, 10);
      s += '<text x="' + X(i) + '" y="' + (h - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === rows.length - 1 ? 'end' : 'middle') + '" fill="#6c7a96" font-size="9">' + esc(d) + '</text>';
    });
    return s + '</svg>';
  }
  function donut(items, center, sub) {
    var total = items.reduce(function (a, i) { return a + i.value; }, 0);
    if (!total) return '<div class="ph-empty">No data yet.</div>';
    var r = 42, c = 2 * Math.PI * r, off = 0, seg = '';
    items.forEach(function (it) { var len = it.value / total * c; seg += '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + it.color + '" stroke-width="14" stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 60 60)"/>'; off += len; });
    var svg = '<svg viewBox="0 0 120 120" class="ph-donut"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#1a2236" stroke-width="14"/>' + seg + '<text x="60" y="58" text-anchor="middle" fill="#fff" font-size="20" font-weight="800" font-family="Sora">' + esc(center) + '</text><text x="60" y="72" text-anchor="middle" fill="#7f8da8" font-size="8">' + esc(sub || '') + '</text></svg>';
    return '<div class="ph-donutWrap">' + svg + '<div class="ph-legend">' + items.map(function (it) { return '<div class="ph-leg"><i style="background:' + it.color + '"></i><span>' + esc(it.label) + '</span><b>' + it.value + '</b></div>'; }).join('') + '</div></div>';
  }
  function hbars(items, c) {
    if (!items.length) return '<div class="ph-empty">No data yet.</div>';
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat(1));
    return items.map(function (it, i) { return '<div class="ph-hb"><div class="ph-hbTop"><span><em>' + (i + 1) + '</em>' + esc(it.label) + '</span><b>' + it.value + '</b></div><div class="ph-hbTrack"><div style="width:' + (it.value / max * 100).toFixed(1) + '%;background:linear-gradient(90deg,' + c + ',' + C.cyan + ')"></div></div></div>'; }).join('');
  }
  function vbars(items) {
    if (!items.length) return '<div class="ph-empty">No data yet.</div>';
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat(1));
    return '<div class="ph-vb">' + items.map(function (it) { return '<div><b style="color:#dbe5f5">' + it.value + '</b><i style="height:' + Math.max(6, it.value / max * 100) + '%"></i><span>' + esc(it.label) + '</span></div>'; }).join('') + '</div>';
  }
  function countBy(list, fn) { var m = {}; list.forEach(function (x) { var k = fn(x); if (k) m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(function (k) { return { label: k, value: m[k] }; }).sort(function (a, b) { return b.value - a.value; }); }
  function pretty(s) { s = String(s || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/[-_]/g, ' ') : ''; }
  function api(p, o) {
    o = o || {}; var h = { Authorization: 'Bearer ' + (sessionStorage.getItem('ps_admin_token') || '') };
    if (o.body) { h['Content-Type'] = 'application/json'; o.body = JSON.stringify(o.body); }
    return fetch('/api' + p, Object.assign({ cache: 'no-store' }, o, { headers: h })).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.status === 204 ? null : r.json(); });
  }
  function say(msg, bad) { var t = $('toast'); if (!t) return; t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.remove('hidden'); clearTimeout(say._t); say._t = setTimeout(function () { t.classList.add('hidden'); }, 3000); }

  /* ---------- dashboard ---------- */
  var view = $('view-overview'), dash = document.createElement('div'); dash.id = 'phDash';
  if (view) view.insertBefore(dash, view.firstChild);
  function hideOld() {
    var a = $('attentionBox'); if (a && a.closest('.panel')) a.closest('.panel').classList.add('ph-hide');
    var q = view && view.querySelector('.toolbar'); if (q && q.closest('.panel')) q.closest('.panel').classList.add('ph-hide');
  }

  function render(d) {
    var anime = arr(d[0]), eps = arr(d[1]), users = arr(d[2]), an = d[3] || {}, se = d[4] || {}, reps = arr(d[5]), pend = arr(d[6]);
    var rows = arr(se.series), views = rows.map(function (r) { return Number(r.views) || 0; }), signups = rows.map(function (r) { return Number(r.signups) || 0; });
    var openReps = reps.filter(function (r) { return !/^(resolved|dismissed)$/i.test(r.status || ''); });
    var published = anime.filter(function (a) { return a.is_published !== false; }).length;
    var epsPub = eps.filter(function (e) { return e.is_published !== false; }).length;
    var dub = anime.filter(function (a) { return a.hindi_dub || a.hindiDub; }).length;
    var pct = function (n, t) { return t ? Math.round(n / t * 100) : 0; };
    var cnt = function (id, n) { var e = $(id); if (e) { e.textContent = n; e.classList.toggle('hide', !n); } };
    cnt('phc-comments', pend.length); cnt('phc-reports', openReps.length); cnt('phBellN', pend.length + openReps.length);

    var hr = new Date().getHours(), hi = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    var who = ($('adminIdentity') ? $('adminIdentity').textContent.replace(/^Signed in:?\s*(as\s*)?/i, '') : '') || 'admin';
    var av = $('phAv'); if (av) av.textContent = (who.trim().charAt(0) || 'A').toUpperCase();

    var kp = [
      ['Titles', anime.length, 'clapperboard', C.blue, null, published + ' published', 'anime'],
      ['Episodes', eps.length, 'play-square', C.cyan, null, epsPub + ' published', 'episodes'],
      ['Users', users.length, 'users', C.pink, signups, '+' + sum(signups) + ' in 30 days', 'users'],
      ['Plays', num(an.progressCount || 0), 'activity', C.green, views, num(sum(views)) + ' views · 30 days', 'analytics'],
      ['Active viewers', num(an.activeViewers || 0), 'eye', C.amber, null, 'with saved progress', 'analytics'],
      ['Hindi dubbed', dub, 'mic', C.violet, null, pct(dub, anime.length) + '% of catalog', 'anime'],
      ['Pending comments', pend.length, 'messages-square', C.amber, null, 'awaiting review', 'comments'],
      ['Open reports', openReps.length, 'flag', C.red, null, 'playback issues', 'reports']
    ];
    var kpis = kp.map(function (k) {
      return '<div class="ph-kpi" data-go="' + k[6] + '">' + spark(k[4], k[3]) + '<div class="top">' + k[0] + '<span class="ic" style="background:' + k[3] + '22;color:' + k[3] + '"><i data-lucide="' + k[2] + '"></i></span></div><div class="n">' + esc(k[1]) + '</div><div class="s">' + esc(k[5]) + '</div></div>';
    }).join('');

    var stMap = { completed: 'Completed', ongoing: 'Ongoing', 'on-air': 'Ongoing', upcoming: 'Upcoming' };
    var stCounts = {}; anime.forEach(function (a) { var k = a.is_published === false ? 'Draft' : (stMap[a.status] || pretty(a.status) || 'Other'); stCounts[k] = (stCounts[k] || 0) + 1; });
    var stItems = Object.keys(stCounts).map(function (k, i) { return { label: k, value: stCounts[k], color: PAL[i % PAL.length] }; });
    var fmt = countBy(anime, function (a) { return pretty(a.type || 'series'); }).map(function (x, i) { x.color = PAL[(i + 2) % PAL.length]; return x; });
    var gen = {}; anime.forEach(function (a) { arr(a.genres).forEach(function (g) { gen[g] = (gen[g] || 0) + 1; }); });
    var genItems = Object.keys(gen).map(function (k) { return { label: k, value: gen[k] }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 7);
    var top = arr(se.topStreamed).slice(0, 6).map(function (x) { return { label: x.title, value: Number(x.streams) || 0 }; });
    var rtype = countBy(openReps, function (r) { return pretty(r.reason || r.issue_type || r.type || r.category || 'Other'); }).map(function (x, i) { x.color = PAL[(i + 4) % PAL.length]; return x; });

    var recent = anime.slice().sort(function (a, b) { return (new Date(b.created_at || 0) - new Date(a.created_at || 0)) || (Number(b.id) - Number(a.id)); }).slice(0, 14);
    var strip = recent.map(function (a) {
      return '<div class="ph-poster" data-edit="' + Number(a.id) + '"><div class="img">' + (a.poster_url ? '<img loading="lazy" alt="" src="' + esc(a.poster_url) + '" onerror="this.style.display=\'none\'">' : '') + '<span class="tag">' + esc(a.is_published === false ? 'draft' : (a.status || a.type || '')) + '</span>' + (a.rating ? '<span class="rt">★ ' + esc(a.rating) + '</span>' : '') + '</div><b>' + esc(a.title) + '</b></div>';
    }).join('') || '<div class="ph-empty">No titles yet. Add your first anime.</div>';

    var cm = pend.slice(0, 5).map(function (c) {
      return '<div class="ph-row"><div class="ph-mini">' + esc((c.user_name || '?').charAt(0).toUpperCase()) + '</div><div class="t"><b>' + esc(c.content) + '</b><span>' + esc(c.user_name || '') + ' · ' + esc(c.anime_title || '') + '</span></div><div class="a"><button class="btn small" data-cm="' + Number(c.id) + '" data-st="approved">Approve</button><button class="btn danger small" data-cm="' + Number(c.id) + '" data-st="rejected">Reject</button></div></div>';
    }).join('') || '<div class="ph-empty">All caught up. No comments waiting.</div>';

    var rp = openReps.slice(0, 5).map(function (r) {
      return '<div class="ph-row"><div class="ph-mini" style="background:linear-gradient(135deg,#ff5d6c,#ffb84d)">!</div><div class="t"><b>' + esc(r.anime_title || 'Unknown anime') + '</b><span>' + esc(r.episode_title || r.message || pretty(r.reason || r.type || 'Playback issue')) + '</span></div><div class="a"><button class="btn small" data-rp="' + Number(r.id) + '">Resolve</button></div></div>';
    }).join('') || '<div class="ph-empty">No open playback reports.</div>';

    var newest = users.slice().sort(function (a, b) { return (new Date(b.created_at || 0) - new Date(a.created_at || 0)) || (Number(b.id) - Number(a.id)); }).slice(0, 5).map(function (u) {
      return '<div class="ph-row"><div class="ph-mini">' + esc((u.display_name || u.email || '?').charAt(0).toUpperCase()) + '</div><div class="t"><b>' + esc(u.display_name || 'Unnamed user') + '</b><span>' + esc(u.email) + '</span></div><span class="badge ' + (u.is_banned ? 'red' : 'green') + '">' + (u.is_banned ? 'BANNED' : 'ACTIVE') + '</span></div>';
    }).join('') || '<div class="ph-empty">No users yet.</div>';

    var withPoster = anime.filter(function (a) { return a.poster_url; }).length;
    var withEps = anime.filter(function (a) { return eps.some(function (e) { return String(e.anime_id) === String(a.id); }); }).length;
    var meter = function (label, n, t, c) { var p = pct(n, t); return '<div class="ph-meter"><div class="l"><span>' + label + '</span><b>' + n + ' / ' + t + ' · ' + p + '%</b></div><div class="bar"><div style="width:' + p + '%;background:linear-gradient(90deg,' + c + ',' + C.cyan + ')"></div></div></div>'; };
    var health = meter('Titles with poster', withPoster, anime.length, C.green) + meter('Titles with episodes', withEps, anime.length, C.blue) + meter('Titles published', published, anime.length, C.violet) + meter('Episodes published', epsPub, eps.length, C.cyan);

    var card = function (t, s, body, link) { return '<div class="ph-card"><div class="hd"><div><h3>' + t + '</h3><div class="sub">' + s + '</div></div>' + (link ? '<button class="ph-link" data-go="' + link[1] + '">' + link[0] + ' →</button>' : '') + '</div>' + body + '</div>'; };

    dash.innerHTML =
      '<div class="ph-hero"><h2>' + hi + ', ' + esc(who.split('@')[0]) + '</h2><p>' + pend.length + ' comments to review · ' + openReps.length + ' open playback reports · ' + anime.length + ' titles live in your catalog.</p><div class="acts"><button class="btn" data-m="anime">＋ Add anime</button><button class="btn ghost" data-m="episode">＋ Add episode</button><button class="btn ghost" data-m="bulk">Bulk add</button><button class="btn ghost" data-m="notify">Send notification</button></div></div>' +
      '<div class="ph-kpis">' + kpis + '</div>' +
      '<div class="ph-grid ph-g21">' + card('Plays & signups', 'Last 30 days from your database', area(rows, [{ k: 'views', c: C.cyan }, { k: 'signups', c: C.pink }]) + '<div class="ph-key"><span><i style="background:' + C.cyan + '"></i>Views</span><span><i style="background:' + C.pink + '"></i>Signups</span></div>', ['Analytics', 'analytics']) + card('Catalog status', 'Titles by release state', donut(stItems, String(anime.length), 'TITLES')) + '</div>' +
      '<div class="ph-card" style="margin-bottom:16px"><div class="hd"><div><h3>Recently added</h3><div class="sub">Tap a poster to edit</div></div><button class="ph-link" data-go="anime">Library →</button></div><div class="ph-strip">' + strip + '</div></div>' +
      '<div class="ph-grid ph-g3">' + card('Top streamed', 'Most saved watch progress', hbars(top, C.blue)) + card('Top genres', 'Across all titles', vbars(genItems)) + card('Formats', 'Series, movies, OVAs', donut(fmt, String(anime.length), 'TITLES')) + '</div>' +
      '<div class="ph-grid ph-g2">' + card('Comment moderation', pend.length + ' waiting for approval', cm, ['All', 'comments']) + card('Playback reports', openReps.length + ' open', rp + (rtype.length ? '<div style="margin-top:12px">' + donut(rtype, String(openReps.length), 'OPEN') + '</div>' : ''), ['All', 'reports']) + '</div>' +
      '<div class="ph-grid ph-g2">' + card('Content health', 'Fix gaps before they hurt viewers', health) + card('Newest members', 'Latest registered accounts', newest, ['All users', 'users']) + '</div>';
    hideOld();
    if (window.lucide) window.lucide.createIcons();
  }

  var busy = false;
  function load() {
    if (busy || !dash || !sessionStorage.getItem('ps_admin_token')) return; busy = true;
    var safe = function (p, f) { return api(p).catch(function () { return f; }); };
    Promise.all([safe('/admin/anime', []), safe('/admin/episodes', []), safe('/admin/users', []), safe('/admin/analytics', {}), safe('/admin/analytics/series', {}), safe('/admin/reports', []), safe('/admin/comments?status=pending', [])])
      .then(render).catch(function () {}).then(function () { busy = false; });
  }

  dash.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-cm]'))) { api('/admin/comments/' + t.dataset.cm, { method: 'PATCH', body: { status: t.dataset.st } }).then(function () { say(t.dataset.st === 'approved' ? 'Comment approved' : 'Comment rejected'); load(); }).catch(function (x) { say(x.message, true); }); return; }
    if ((t = e.target.closest('[data-rp]'))) { api('/admin/reports/' + t.dataset.rp, { method: 'PATCH', body: { status: 'resolved' } }).then(function () { say('Report resolved'); load(); }).catch(function (x) { say(x.message, true); }); return; }
    if ((t = e.target.closest('[data-edit]'))) { window.editAnime(Number(t.dataset.edit)); return; }
    if ((t = e.target.closest('[data-m]'))) { var m = t.dataset.m; if (m === 'anime') window.openAnimeModal(); else if (m === 'episode') window.openEpisodeModal(); else if (m === 'bulk') window.openBulkEpisodes(); else window.switchTab('notifications'); return; }
    if ((t = e.target.closest('[data-go]'))) window.switchTab(t.dataset.go);
  });

  /* ---------- lifecycle ---------- */
  var app = $('app'), shown = false;
  function tick() {
    syncLabels(); syncBar();
    if (app && !app.classList.contains('hidden')) { if (!shown) { shown = true; if (window.lucide) window.lucide.createIcons(); setTimeout(load, 700); } } else shown = false;
  }
  if (app) new MutationObserver(tick).observe(app, { attributes: true, attributeFilter: ['class'] });
  if (nav) new MutationObserver(function () { syncLabels(); syncBar(); }).observe(nav, { attributes: true, subtree: true, attributeFilter: ['class'] });
  var toastEl = $('toast'), deb;
  if (toastEl) new MutationObserver(function () {
    if (/added|updated|deleted|refreshed|approved|rejected|resolved|saved|sent|banned/i.test(toastEl.textContent || '')) { clearTimeout(deb); deb = setTimeout(load, 900); }
  }).observe(toastEl, { childList: true, characterData: true, subtree: true });
  var rb = $('refreshBtn'); if (rb) rb.addEventListener('click', function () { setTimeout(load, 900); });
  setInterval(function () { if (!document.hidden && app && !app.classList.contains('hidden')) load(); }, 60000);
  if (window.lucide) window.lucide.createIcons(); else window.addEventListener('load', function () { if (window.lucide) window.lucide.createIcons(); });
  tick();
})();
