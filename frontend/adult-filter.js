/* Public site: 18+ toggle. Loaded in <head> so the fetch wrapper is ready before the catalog loads. */
(function () {
  'use strict';
  if (window.__pdiAdult) return;
  window.__pdiAdult = true;
  var KEY = 'pdi_adult_ok';
  function isOn() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setOn(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* ignore */ } }

  // When ON, ask the API for 18+ anime too (backend hides them otherwise).
  var origFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      if (isOn() && typeof input === 'string') {
        var method = ((init && init.method) || 'GET').toUpperCase();
        if (method === 'GET' && /^(https?:\/\/[^/]+)?\/api\/(anime|studios)(\/|\?|$)/.test(input) && !/[?&]adult=/.test(input)) {
          input = input + (input.indexOf('?') > -1 ? '&' : '?') + 'adult=1';
        }
      }
    } catch (e) { /* ignore */ }
    return origFetch(input, init);
  };

  var css = '.pdi-adult{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.28);background:transparent;color:inherit;border-radius:999px;padding:5px 10px 5px 9px;font:700 12px/1 inherit;cursor:pointer;white-space:nowrap}' +
    '.pdi-adult i{width:26px;height:14px;border-radius:999px;background:#5b6178;position:relative;transition:.2s;flex:none}' +
    '.pdi-adult i:after{content:"";position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:#fff;transition:.2s}' +
    '.pdi-adult.on{border-color:#ff4d6d}.pdi-adult.on i{background:#ff4d6d}.pdi-adult.on i:after{left:14px}' +
    '#dr .pdi-adult{margin:10px 16px;align-self:flex-start}' +
    '#pdiAdultModal{position:fixed;inset:0;z-index:99999;background:rgba(5,7,14,.78);display:flex;align-items:center;justify-content:center;padding:18px}' +
    '#pdiAdultModal .box{max-width:380px;width:100%;background:#121626;color:#f3f5fb;border:1px solid #252b44;border-radius:18px;padding:22px;text-align:center;font:15px/1.45 system-ui,sans-serif}' +
    '#pdiAdultModal h3{margin:0 0 8px;font-size:20px}#pdiAdultModal p{margin:0 0 18px;color:#aab2cc}' +
    '#pdiAdultModal button{font:inherit;font-weight:700;border-radius:11px;padding:11px 16px;cursor:pointer;border:1px solid #252b44;background:#171c30;color:#f3f5fb;margin:0 4px}' +
    '#pdiAdultModal button.go{background:linear-gradient(135deg,#ff4d6d,#8b5cf6);border-color:transparent}';

  function paint() {
    document.querySelectorAll('.pdi-adult').forEach(function (b) {
      b.classList.toggle('on', isOn());
      b.setAttribute('aria-pressed', isOn() ? 'true' : 'false');
    });
  }

  function confirmAge(done) {
    var m = document.createElement('div');
    m.id = 'pdiAdultModal';
    m.innerHTML = '<div class="box"><h3>18+ content</h3><p>This will show anime meant for adults only. Are you 18 years or older?</p><button type="button" data-no>Cancel</button><button type="button" class="go" data-yes>Yes, I am 18+</button></div>';
    m.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-yes')) { m.remove(); done(); }
      else if (e.target.hasAttribute('data-no') || e.target === m) m.remove();
    });
    document.body.appendChild(m);
  }

  function toggle() {
    if (isOn()) {
      setOn(false);
      location.href = '/';
    } else {
      confirmAge(function () { setOn(true); location.reload(); });
    }
  }

  function makeBtn() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pdi-adult';
    b.setAttribute('aria-label', 'Toggle 18+ content');
    b.innerHTML = '18+<i></i>';
    b.addEventListener('click', toggle);
    return b;
  }

  function mount() {
    if (document.querySelector('header .pdi-adult')) return;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    var header = document.querySelector('header');
    if (header) {
      var acc = document.getElementById('accountBtn');
      header.insertBefore(makeBtn(), acc || header.lastElementChild);
    }
    var dr = document.getElementById('dr');
    if (dr) dr.insertBefore(makeBtn(), dr.firstChild);
    paint();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
