// Client-side SEO helpers for the Prime Hindi SPA (loaded after the app).
// 1) Image alt text: gives every meaningful image a descriptive alt, including the ones
//    drawn later by other feature scripts. Purely decorative images get alt="".
// 2) Lazy loading: every image that is not in the header, hero, player or preloader gets
//    loading="lazy" + decoding="async" (the templates already carry them where it matters).
(function () {
  "use strict";

  // Above-the-fold / critical images must never be lazy.
  var CRITICAL = "header, .hero, #hero, .hs, .pl, #ph-preloader, #headerBrandLogo, .dx-poster, .profile-avatar-wrap";

  function altFor(img) {
    var box = img.closest("a, article, li, .cd, .voice-cast-card, .ep-card");
    var el = box && box.querySelector("p, h1, h2, h3, h4, strong, .t");
    var t = (el && el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t) t = (img.getAttribute("title") || img.getAttribute("aria-label") || "").trim();
    if (!t) return "";
    t = t.slice(0, 110);
    if (img.closest(".po") && !/poster|thumbnail|episode/i.test(t)) t += " poster";
    return t;
  }

  function fixAlt(img) {
    var a = img.getAttribute("alt");
    if (a && a.trim()) return;
    var t = altFor(img);
    img.setAttribute("alt", t);
    if (!t) img.setAttribute("role", "presentation");
  }

  function fixLazy(img) {
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    if (img.hasAttribute("loading")) return;
    if (img.closest(CRITICAL)) return;
    img.setAttribute("loading", "lazy");
  }

  function fix(img) {
    fixAlt(img);
    fixLazy(img);
  }

  function scan(root) {
    var list = (root.querySelectorAll ? root.querySelectorAll("img") : []);
    for (var i = 0; i < list.length; i++) fix(list[i]);
    if (root.tagName === "IMG") fix(root);
  }

  function start() {
    scan(document);
    var pending = false;
    new MutationObserver(function (muts) {
      // Apply lazy loading as early as possible to freshly inserted images.
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType === 1) { if (n.tagName === "IMG") fixLazy(n); else if (n.querySelectorAll) { var l = n.querySelectorAll("img"); for (var k = 0; k < l.length; k++) fixLazy(l[k]); } }
        }
      }
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; scan(document); }, 150);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
