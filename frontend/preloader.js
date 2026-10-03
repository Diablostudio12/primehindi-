(function () {
  var LOGO = '/prime-hindi-logo.png';
  var LOGO_CANDIDATES = [];
  var MIN_TIME = 1300;   // minimum show time (ms)
  var MAX_TIME = 7000;   // failsafe: force hide after this

  var css = '' +
  '#ph-preloader{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;' +
  'background:radial-gradient(circle at 50% 45%,#10143a 0%,#070913 55%,#030409 100%);' +
  'transition:opacity .6s ease,visibility .6s ease;}' +
  '#ph-preloader.ph-out{opacity:0;visibility:hidden;}' +
  '#ph-preloader .ph-wrap{display:flex;flex-direction:column;align-items:center;gap:28px;width:min(72vw,420px);}' +
  '#ph-preloader .ph-logo{width:100%;height:auto;display:block;opacity:0;transform:scale(.88);' +
  'animation:phIn .9s cubic-bezier(.2,.8,.2,1) .1s forwards,phGlow 2.2s ease-in-out 1s infinite;}' +
  '#ph-preloader .ph-bar{width:55%;height:3px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;' +
  'opacity:0;animation:phFade .5s ease .6s forwards;}' +
  '#ph-preloader .ph-bar span{display:block;height:100%;width:40%;border-radius:3px;' +
  'background:linear-gradient(90deg,#00c6ff,#3b5bff,#a53bff);animation:phSlide 1.1s ease-in-out infinite;}' +
  '@keyframes phIn{to{opacity:1;transform:scale(1);}}' +
  '@keyframes phFade{to{opacity:1;}}' +
  '@keyframes phGlow{0%,100%{filter:drop-shadow(0 0 10px rgba(59,91,255,.35));}50%{filter:drop-shadow(0 0 26px rgba(165,59,255,.6));}}' +
  '@keyframes phSlide{0%{transform:translateX(-110%);}100%{transform:translateX(280%);}}' +
  'html.ph-lock,html.ph-lock body{overflow:hidden !important;}';

  var style = document.createElement('style');
  style.id = 'ph-preload-css';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  var el = document.createElement('div');
  el.id = 'ph-preloader';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="ph-wrap"><img class="ph-logo" alt="Primordial Streams logo"><div class="ph-fallback" style="display:none;color:#fff;font:800 clamp(24px,7vw,44px)/1.15 system-ui,sans-serif;letter-spacing:.02em;text-align:center;text-shadow:0 0 22px rgba(59,91,255,.45)">PRIMORDIAL <span style="color:#e7c75a">STREAMS</span></div><div class="ph-bar"><span></span></div></div>';
  document.documentElement.appendChild(el);
  var logoEl = el.querySelector('.ph-logo');
  var fallbackEl = el.querySelector('.ph-fallback');
  var logoCandidates = [];
  function addLogoCandidate(value) { if (typeof value === 'string' && value.trim() && !logoCandidates.includes(value.trim())) logoCandidates.push(value.trim()); }
  function tryLogo(index) {
    if (index >= logoCandidates.length) { logoEl.style.display = 'none'; fallbackEl.style.display = 'block'; return; }
    logoEl.onload = function () { logoEl.style.display = 'block'; fallbackEl.style.display = 'none'; };
    logoEl.onerror = function () { tryLogo(index + 1); };
    logoEl.src = logoCandidates[index];
  }
  addLogoCandidate(LOGO);
  addLogoCandidate('/assets/logo.png');
  addLogoCandidate('/assets/logo.jpg');
  fetch('/api/branding', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
    if (data && data.logoUrl) { logoCandidates.unshift(data.logoUrl); }
    tryLogo(0);
  }).catch(function () { tryLogo(0); });

  document.documentElement.classList.add('ph-lock');

  var start = Date.now();
  var done = false;

  function hide() {
    if (done) return;
    done = true;
    var wait = Math.max(0, MIN_TIME - (Date.now() - start));
    setTimeout(function () {
      el.classList.add('ph-out');
      document.documentElement.classList.remove('ph-lock');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    }, wait);
  }

  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide);
  setTimeout(hide, MAX_TIME);

  // back/forward button par preloader stuck na ho
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      var p = document.getElementById('ph-preloader');
      if (p && p.parentNode) p.parentNode.removeChild(p);
      document.documentElement.classList.remove('ph-lock');
    }
  });
})();