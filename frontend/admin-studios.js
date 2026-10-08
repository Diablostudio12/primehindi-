/* Admin portal: "Studios" tab + Studio dropdown in the anime form. Additive. */
(function () {
  'use strict';
  if (window.__pdiAdminStudios) return;
  window.__pdiAdminStudios = true;
  var origFetch = window.fetch.bind(window);
  var studios = [];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function toast(msg, bad) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.add('hidden'); }, 3500);
  }
  function call(path, opts) {
    opts = opts || {};
    var headers = { Authorization: 'Bearer ' + (sessionStorage.getItem('ps_admin_token') || '') };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    return origFetch('/api' + path, {
      method: opts.method || 'GET', headers: headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || ('Request failed (' + r.status + ')'));
        return d;
      });
    });
  }
  function fetchStudios() {
    return origFetch('/api/studios', { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (rows) { studios = Array.isArray(rows) ? rows : []; return studios; });
  }

  // ---- Studios tab ----
  var nav = document.querySelector('.nav'), after = nav && nav.querySelector('[data-tab="episodes"]'), main = document.querySelector('main');
  if (!nav || !after || !main) return;
  var btn = document.createElement('button');
  btn.innerHTML = '<span class="ico">&#9678;</span>Studios';
  after.insertAdjacentElement('afterend', btn);
  var view = document.createElement('section');
  view.id = 'view-studios'; view.className = 'hidden';
  view.innerHTML = '<div class="panel"><div class="panelHead"><div><h2>Studios</h2><p>Studios shown in the home page row. Studios cannot be deleted.</p></div><button class="btn" id="addStudioBtn">&#65291; Add studio</button></div><div id="studiosTable"></div></div>';
  main.appendChild(view);

  function renderList() {
    var box = $('studiosTable');
    if (!studios.length) { box.innerHTML = '<div class="empty">No studios yet. Add your first studio.</div>'; return; }
    box.innerHTML = '<div class="tableWrap"><table><thead><tr><th>STUDIO</th><th>ANIME</th><th>ACTIONS</th></tr></thead><tbody>' +
      studios.map(function (s) {
        var img = s.logo_url ? '<img class="poster" style="border-radius:50%;width:44px;height:44px" src="' + esc(s.logo_url) + '" alt="" loading="lazy" onerror="this.hidden=true">' : '<div class="poster" style="border-radius:50%;width:44px;height:44px;display:grid;place-items:center">&#9678;</div>';
        return '<tr><td data-label="STUDIO"><div class="itemCell">' + img + '<div><div class="itemTitle">' + esc(s.name) + '</div><div class="subline">' + esc(s.slug) + '</div></div></div></td><td data-label="ANIME">' + Number(s.anime_count || 0) + '</td><td data-label="ACTIONS"><button class="btn secondary small" data-edit-studio="' + Number(s.id) + '">Edit</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function loadList() { return fetchStudios().then(renderList).catch(function (e) { toast(e.message, true); }); }

  function showTab() {
    document.querySelectorAll('main > section[id^="view-"]').forEach(function (s) { s.classList.add('hidden'); });
    view.classList.remove('hidden');
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    $('pageTitle').textContent = 'Studios';
    $('pageSub').textContent = 'Studios shown on the home page.';
    $('sidebar').classList.remove('open');
    loadList();
  }
  btn.addEventListener('click', showTab);
  document.querySelectorAll('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { view.classList.add('hidden'); btn.classList.remove('active'); });
  });

  function openStudioModal(s) {
    $('modalTitle').textContent = s ? 'Edit studio' : 'Add studio';
    $('modalBody').innerHTML = '<form id="studioForm"><div class="field"><label>STUDIO NAME *</label><input name="name" required maxlength="80" value="' + esc(s ? s.name : '') + '" placeholder="e.g. MAPPA"></div><div class="field"><label>LOGO URL</label><input name="logoUrl" type="text" value="' + esc(s ? s.logo_url : '') + '" placeholder="https://..."></div><div id="studioFormError" class="error"></div><div class="modalActions"><button type="button" class="btn secondary" onclick="closeModal()">Cancel</button><button class="btn gold" type="submit">Save studio</button></div></form>';
    $('modal').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    $('studioForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.currentTarget, b = f.querySelector('button[type="submit"]'); b.disabled = true;
      var body = { name: f.elements.name.value.trim(), logoUrl: f.elements.logoUrl.value.trim() };
      call(s ? '/admin/studios/' + s.id : '/admin/studios', { method: s ? 'PUT' : 'POST', body: body }).then(function () {
        window.closeModal(); toast(s ? 'Studio updated' : 'Studio added'); return loadList();
      }).catch(function (err) { $('studioFormError').textContent = err.message; b.disabled = false; });
    });
  }
  $('addStudioBtn').addEventListener('click', function () { openStudioModal(null); });
  view.addEventListener('click', function (e) {
    var t = e.target.closest('[data-edit-studio]'); if (!t) return;
    var s = studios.filter(function (x) { return String(x.id) === t.getAttribute('data-edit-studio'); })[0];
    if (s) openStudioModal(s);
  });

  // ---- Studio dropdown inside the anime form ----
  function decorate(form) {
    var posterField = form.elements.posterUrl && form.elements.posterUrl.closest('.field');
    if (!posterField) return;
    var wrap = document.createElement('div');
    wrap.className = 'field wide';
    wrap.innerHTML = '<label>STUDIO</label><select id="pdiStudioSelect" disabled><option value="">&mdash; No studio &mdash;</option></select><div class="uploadHint">Shown in the home page Studios row.</div>';
    posterField.parentNode.insertBefore(wrap, posterField);
    var sel = wrap.querySelector('select'), slug = form.elements.slug ? form.elements.slug.value : '';
    Promise.all([fetchStudios(), slug ? call('/admin/anime') : Promise.resolve([])]).then(function (r) {
      var cur = Array.isArray(r[1]) ? r[1].filter(function (a) { return a.slug === slug; })[0] : null;
      var val = cur && cur.studio_id ? String(cur.studio_id) : '';
      sel.innerHTML = '<option value="">&mdash; No studio &mdash;</option>' + studios.map(function (s) {
        return '<option value="' + Number(s.id) + '">' + esc(s.name) + '</option>';
      }).join('');
      sel.value = val; sel.dataset.initial = sel.value; sel.dataset.ready = '1'; sel.disabled = false;
    }).catch(function () { /* leave disabled: studio stays unchanged */ });
  }
  new MutationObserver(function () {
    var f = $('animeForm');
    if (f && !$('pdiStudioSelect')) decorate(f);
  }).observe($('modalBody'), { childList: true, subtree: true });

  // Save the chosen studio right after the anime itself is saved.
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = ((init && init.method) || 'GET').toUpperCase();
    var m = url.match(/\/api\/admin\/anime(?:\/(\d+))?(?:\?|$)/);
    var sel = $('pdiStudioSelect');
    var track = !!(m && ((method === 'POST' && !m[1]) || (method === 'PUT' && m[1])) && sel && sel.dataset.ready === '1' && sel.value !== sel.dataset.initial);
    var p = origFetch(input, init);
    if (!track) return p;
    var chosen = sel.value;
    return p.then(function (res) {
      if (!res.ok) return res;
      return res.clone().json().catch(function () { return {}; }).then(function (d) {
        var id = m[1] || d.id;
        if (!id) return res;
        return call('/admin/anime/' + id + '/studio', { method: 'PUT', body: { studioId: chosen ? Number(chosen) : null } })
          .then(function () { return res; }, function (e) { toast('Anime saved, but studio could not be set: ' + e.message, true); return res; });
      });
    });
  };
})();
