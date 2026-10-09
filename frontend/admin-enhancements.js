/* Live admin portal enhancements: device logo uploads and per-title Hindi voice cast. */
(function () {
  'use strict';
  if (window.__pdiAdminEnhancements) return;
  window.__pdiAdminEnhancements = true;
  var originalFetch = window.fetch.bind(window);
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function toast(msg, bad) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.remove('hidden');
    clearTimeout(toast._timer); toast._timer = setTimeout(function () { t.classList.add('hidden'); }, 3500);
  }
  function compressImage(file, maxW, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader(); reader.onerror = reject;
      reader.onload = function () {
        var image = new Image(); image.onerror = reject;
        image.onload = function () {
          var scale = Math.min(1, maxW / image.width), canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', quality));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Add a device file picker to the existing Studios modal. Capture submit to wait for image processing.
  var modalObserver = new MutationObserver(function () {
    var form = $('studioForm');
    if (form && !form.dataset.deviceLogoReady) {
      form.dataset.deviceLogoReady = '1';
      var logo = form.elements.logoUrl;
      if (!logo) return;
      var field = document.createElement('div'); field.className = 'field';
      field.innerHTML = '<label>UPLOAD LOGO FROM DEVICE</label><input id="pdiStudioLogoFile" type="file" accept="image/png,image/jpeg,image/webp"><div class="uploadHint">Choose PNG, JPG or WEBP. Image is optimized before saving.</div><img id="pdiStudioLogoPreview" alt="Studio logo preview" style="display:none;max-width:180px;max-height:100px;object-fit:contain;margin-top:10px;border-radius:10px">';
      logo.closest('.field').insertAdjacentElement('afterend', field);
      var picker = $('pdiStudioLogoFile'), preview = $('pdiStudioLogoPreview');
      function showPreview(v) { if (!v) { preview.removeAttribute('src'); preview.style.display = 'none'; return; } preview.src = v; preview.style.display = 'block'; }
      if (logo.value) showPreview(logo.value);
      logo.addEventListener('input', function () { showPreview(logo.value.trim()); });
      picker.addEventListener('change', function () {
        var file = picker.files && picker.files[0]; if (!file) return;
        if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) { toast('Choose a PNG, JPG or WEBP image.', true); picker.value = ''; return; }
        compressImage(file, 480, 0.72).then(function (data) {
          if (data.length > 1700000) throw new Error('Logo is too large. Choose a smaller image.');
          logo.value = data; showPreview(data); toast('Logo selected. Tap Save studio to save it.');
        }).catch(function (e) { toast(e.message || 'Could not read logo.', true); picker.value = ''; });
      });
    }

    var animeForm = $('animeForm');
    if (animeForm && !animeForm.dataset.castEditorReady) {
      animeForm.dataset.castEditorReady = '1';
      var anchor = animeForm.querySelector('.modalActions');
      var wrap = document.createElement('div'); wrap.className = 'field wide'; wrap.id = 'pdiVoiceCastEditor';
      wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><label>CHARACTERS &amp; HINDI VOICE CAST</label><div class="uploadHint">Add character name, image, Hindi voice artist name and artist photo.</div></div><button type="button" class="btn secondary" id="pdiAddCast">+ Add character</button></div><div id="pdiCastRows" style="display:grid;gap:12px;margin-top:12px"></div>';
      if (anchor) anchor.insertAdjacentElement('beforebegin', wrap); else animeForm.appendChild(wrap);
      $('pdiAddCast').addEventListener('click', function () { addCastRow({}); });
      addCastRow({});
      var slug = animeForm.elements.slug ? animeForm.elements.slug.value : '';
      if (slug) {
        originalFetch('/api/admin/anime', { headers: { Authorization: 'Bearer ' + (sessionStorage.getItem('ps_admin_token') || '') }, cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : []; })
          .then(function (rows) {
            var current = Array.isArray(rows) ? rows.find(function (a) { return a.slug === slug; }) : null;
            if (current && Array.isArray(current.voice_cast) && current.voice_cast.length) {
              $('pdiCastRows').innerHTML = '';
              current.voice_cast.forEach(addCastRow);
            }
          }).catch(function () {});
      }
    }
  });
  modalObserver.observe(document.body, { childList: true, subtree: true });

  function addCastRow(ch) {
    ch = ch || {};
    var rows = $('pdiCastRows'); if (!rows) return;
    var row = document.createElement('div'); row.className = 'panel'; row.style.padding = '12px'; row.style.margin = '0';
    row.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>Character / voice artist</b><button type="button" class="btn secondary small" data-remove-cast>Remove</button></div><div class="formGrid" style="margin-top:10px"><div class="field"><label>CHARACTER NAME *</label><input data-cast="name" value="' + esc(ch.name || '') + '" placeholder="Character name"></div><div class="field"><label>HINDI VOICE ARTIST</label><input data-cast="actor" value="' + esc(ch.actor || '') + '" placeholder="Artist name"></div><div class="field"><label>CHARACTER IMAGE URL</label><input data-cast="image" value="' + esc(ch.image || '') + '" placeholder="Paste URL or upload"><input data-cast-file="image" type="file" accept="image/*" aria-label="Upload character image"></div><div class="field"><label>VOICE ARTIST PHOTO URL</label><input data-cast="actorImage" value="' + esc(ch.actorImage || '') + '" placeholder="Paste URL or upload"><input data-cast-file="actorImage" type="file" accept="image/*" aria-label="Upload voice artist photo"></div><div class="field"><label>LANGUAGE</label><input data-cast="language" value="' + esc(ch.language || 'Hindi') + '"></div><div class="field"><label>ROLE</label><select data-cast="role"><option value="main" ' + ((ch.role || 'main') === 'main' ? 'selected' : '') + '>Main character</option><option value="supporting" ' + (ch.role === 'supporting' ? 'selected' : '') + '>Supporting character</option></select></div></div>';
    row.querySelector('[data-remove-cast]').addEventListener('click', function () { row.remove(); });
    row.querySelectorAll('input[data-cast-file]').forEach(function (picker) {
      picker.addEventListener('change', function () {
        var file = picker.files && picker.files[0]; if (!file) return;
        var key = picker.getAttribute('data-cast-file'), target = row.querySelector('[data-cast="' + key + '"]');
        compressImage(file, 600, 0.72).then(function (data) {
          if (data.length > 1500000) throw new Error('Image too large. Choose a smaller file.');
          target.value = data; toast('Image attached. Save anime to keep the cast credit.');
        }).catch(function (e) { toast(e.message || 'Could not read image.', true); picker.value = ''; });
      });
    });
    rows.appendChild(row);
  }
  function readCastRows() {
    var rows = $('pdiCastRows'); if (!rows) return [];
    return Array.from(rows.children).map(function (row) {
      var get = function (key) { var input = row.querySelector('[data-cast="' + key + '"]'); return input ? input.value.trim() : ''; };
      return { name: get('name'), actor: get('actor'), image: get('image'), actorImage: get('actorImage'), language: get('language') || 'Hindi', role: get('role') || 'main' };
    }).filter(function (item) { return item.name; });
  }

  // Attach cast credits to the exact JSON request the existing admin form already saves.
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = ((init && init.method) || 'GET').toUpperCase();
    var animeWrite = /\/api\/admin\/anime(?:\/\d+)?(?:\?|$)/.test(url) && (method === 'POST' || method === 'PUT');
    if (animeWrite && init && typeof init.body === 'string' && $('pdiCastRows')) {
      try { var payload = JSON.parse(init.body); payload.voiceCast = readCastRows(); init = Object.assign({}, init, { body: JSON.stringify(payload) }); } catch (e) {}
    }
    return originalFetch(input, init);
  };
})();