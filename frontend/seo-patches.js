// Serve-time patches for index.html (the 200KB SPA file itself stays untouched).
// Each entry is [exact text in index.html, replacement]. A missing target is skipped, so a
// later edit of index.html can never break the server.
const PATCHES = [
  // #11 alt text + #13 lazy loading / async decoding for catalog posters
  ["alt=\"${a.t}\" loading=\"lazy\" style=\"width:100%;height:100%;object-fit:cover;position:absolute;inset:0\" onerror=\"this.remove()\"",
   "alt=\"${esc(a.t)} poster\" loading=\"lazy\" decoding=\"async\" style=\"width:100%;height:100%;object-fit:cover;position:absolute;inset:0\" onerror=\"this.remove()\""],
  // "Latest episodes" thumbnails (were eager + no alt)
  ["<img src=\"${e.thumbnail_url}\" alt=\"\" style=\"width:100%;height:100%;object-fit:cover\">",
   "<img src=\"${e.thumbnail_url}\" alt=\"${esc(a.t)} episode ${e.episodeNumber??e.episode_number}\" loading=\"lazy\" decoding=\"async\" style=\"width:100%;height:100%;object-fit:cover\">"],
  // Watch-page player thumbnail: above the fold, so it stays eager (alt only)
  ["<img src=\"${ep.thumbnail_url}\" alt=\"\" style=\"width:100%;height:100%;object-fit:cover;position:absolute;inset:0\">",
   "<img src=\"${ep.thumbnail_url}\" alt=\"${esc(a.t)} episode ${e} thumbnail\" style=\"width:100%;height:100%;object-fit:cover;position:absolute;inset:0\">"],
  // Studio logo on the anime page
  ["alt=\"\" style=\"width:42px;height:42px;object-fit:contain",
   "alt=\"'+esc(a.studioName||'Studio')+' logo\" loading=\"lazy\" decoding=\"async\" style=\"width:42px;height:42px;object-fit:contain"],
  ["alt=\"primehindi logo\"", "alt=\"Prime Hindi logo\""],
  // #12 WebP: catalog images go through /img (resized WebP); falls back to the original on error
  ["<img src=\"${a.posterUrl}\" ",
   "<img src=\"${esc(pdiImg(a.posterUrl,480))}\" "],
  ["<img src=\"${e.thumbnail_url}\" ",
   "<img src=\"${esc(pdiImg(e.thumbnail_url,640))}\" "],
  ["<img src=\"${ep.thumbnail_url}\" ",
   "<img src=\"${esc(pdiImg(ep.thumbnail_url,960))}\" "],
];

// Defines window.pdiImg(url, width) and the one-time fallback to the original image if /img fails.
const IMG_HELPER = '<script>' +
  "(function(){window.pdiImg=function(u,w){try{if(!u||typeof u!=='string'||u.slice(0,4).toLowerCase()!=='http')return u;var x=new URL(u);if(x.origin===location.origin)return u;return '/img?u='+encodeURIComponent(x.href)+'&w='+(w||480)}catch(e){return u}};" +
  "addEventListener('error',function(e){var t=e.target;if(!t||t.tagName!=='IMG'||t.getAttribute('data-pdi-fb'))return;var s=t.getAttribute('src')||'';if(s.indexOf('/img?')!==0)return;var m=/[?&]u=([^&]+)/.exec(s);if(!m)return;t.setAttribute('data-pdi-fb','1');e.stopImmediatePropagation();t.src=decodeURIComponent(m[1])},true)})();" +
  '</script>';

export function patchIndexHtml(html) {
  let out = html;
  for (const [from, to] of PATCHES) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out.replace("<head>", () => "<head>" + IMG_HELPER);
}

// Same idea for the feature scripts that draw their own images (missing target = skipped).
const SCRIPT_PATCHES = {
  "home-discovery.js": [
    ["'<img src=\"' + esc(a.posterUrl) + '\"", "'<img src=\"' + esc(window.pdiImg ? pdiImg(a.posterUrl, 480) : a.posterUrl) + '\""],
  ],
  "hero-desktop.js": [
    ["'<img src=\"' + esc(img) + '\" alt=\"\" loading=\"lazy\"", "'<img src=\"' + esc(window.pdiImg ? pdiImg(img, 640) : img) + '\" alt=\"' + esc(a.t) + ' episode ' + x.n + '\" loading=\"lazy\""],
  ],
};

export function patchScript(name, text) {
  let out = text;
  for (const [from, to] of SCRIPT_PATCHES[name] || []) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}
