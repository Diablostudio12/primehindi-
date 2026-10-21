// Client-side SEO helpers for the Prime Hindi SPA (loaded after the app).
// 1) Image alt text: gives every meaningful image a descriptive alt, including the ones
//    drawn later by other feature scripts. Purely decorative images get alt="".
(function () {
  "use strict";

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

  function scan(root) {
    var list = (root.querySelectorAll ? root.querySelectorAll("img") : []);
    for (var i = 0; i < list.length; i++) fixAlt(list[i]);
    if (root.tagName === "IMG") fixAlt(root);
  }

  function start() {
    scan(document);
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; scan(document); }, 150);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
