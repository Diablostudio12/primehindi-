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
];

export function patchIndexHtml(html) {
  let out = html;
  for (const [from, to] of PATCHES) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}
