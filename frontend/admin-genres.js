/* Admin: genre chip multi-select for the Add/Edit anime form. Keeps the original comma-separated input (hidden) as the source of truth, so saving and Jikan auto-fill keep working. */
(function () {
  'use strict';
  if (window.__phGenreChips) return;
  window.__phGenreChips = true;
  var KEY = 'ph_custom_genres';
  var BASE = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Slice of Life', 'Shōjo', 'Shonen', 'Seinen', 'Supernatural', 'Sci-Fi', 'Isekai', 'Dark Fantasy', 'Horror', 'Mystery', 'Psychological', 'Thriller', 'Sports', 'Mecha', 'Music', 'School', 'Historical', 'Ecchi'];
  var css = '.phGBox{display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#0b101a;border:1px solid #303b52;border-radius:12px}' +
    '.phGChip{border:1px solid #3a4560;background:#1a2232;color:#dce5f5;border-radius:11px;padding:9px 13px;font-weight:700;font-size:13px;line-height:1.1}' +
    '.phGChip.on{background:linear-gradient(135deg,#8b5cf6,#ec4899);border-color:transparent;color:#fff}' +
    '.phGHead{display:flex;justify-content:space-between;align-items:center;gap:10px}' +
    '.phGManage{background:none;border:0;color:#b69cff;font-weight:800;font-size:12px;padding:0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function custom() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function saveCustom(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function parse(v) { return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  function idx(arr, g) { var l = g.toLowerCase(); for (var i = 0; i < arr.length; i++) if (arr[i].toLowerCase() === l) return i; return -1; }

  function build(form) {
    var inp = form.elements.genres;
    if (!inp || inp.dataset.chips) return;
    inp.dataset.chips = '1';
    var field = inp.closest('.field');
    if (!field) return;
    field.classList.add('wide');
    var label = field.querySelector('label');
    var head = document.createElement('div'); head.className = 'phGHead';
    if (label) { label.textContent = 'GENRES (SELECT MULTIPLE)'; label.parentNode.insertBefore(head, label); head.appendChild(label); }
    var manage = document.createElement('button'); manage.type = 'button'; manage.className = 'phGManage'; manage.textContent = '+ Manage Genres'; head.appendChild(manage);
    inp.style.display = 'none';
    var box = document.createElement('div'); box.className = 'phGBox';
    inp.parentNode.insertBefore(box, inp.nextSibling);
    var last = null;
    function all() {
      var list = BASE.concat(custom());
      parse(inp.value).forEach(function (g) { if (idx(list, g) < 0) list.push(g); });
      return list;
    }
    function render() {
      var sel = parse(inp.value);
      box.innerHTML = '';
      all().forEach(function (g) {
        var on = idx(sel, g) >= 0;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'phGChip' + (on ? ' on' : ''); b.textContent = on ? g + ' ✓' : g;
        b.addEventListener('click', function () {
          var cur = parse(inp.value), i = idx(cur, g);
          if (i >= 0) cur.splice(i, 1); else cur.push(g);
          inp.value = cur.join(', ');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          render();
        });
        box.appendChild(b);
      });
      last = inp.value;
    }
    manage.addEventListener('click', function () {
      var name = (prompt('New genre name') || '').trim();
      if (!name) return;
      var c = custom();
      if (idx(BASE.concat(c), name) < 0) { c.push(name); saveCustom(c); }
      var cur = parse(inp.value);
      if (idx(cur, name) < 0) cur.push(name);
      inp.value = cur.join(', ');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      render();
    });
    render();
    var t = setInterval(function () {
      if (!document.body.contains(inp)) { clearInterval(t); return; }
      if (inp.value !== last) render();
    }, 300);
  }

  function scan() { var f = document.getElementById('animeForm'); if (f) build(f); }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
})();
