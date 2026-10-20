// SEO helpers for the Prime Hindi frontend: per-page <head> tags, JSON-LD,
// robots.txt, sitemap.xml and X-Robots-Tag headers. The site is a hash-routed SPA
// (#/anime/ID), and search engines ignore the #fragment, so real paths such as
// /anime/ID/slug and /watch/ID/EP are served here. A tiny inline script maps the path
// back to the hash route the SPA already understands, so the app code is unchanged.

const TTL = 10 * 60 * 1000;
const NOINDEX_PREFIXES = ["/api", "/admin", "/editor", "/accept-invite"];
const DEFAULT_DESC =
  "Watch your favourite anime in Hindi dub online in HD. New episodes, latest series and movies, no ads.";

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const trunc = (v, n) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "\u2026" : s;
};
const slugify = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
const jsonLd = (obj) =>
  '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, "\\u003c") + "</script>";

// Runs before the SPA: turns /anime/ID/slug or /watch/ID/EP into the matching #/ route.
const PATH_TO_HASH_SHIM =
  "<script>(function(){var p=location.pathname.split('/').filter(Boolean);" +
  "if(!location.hash&&p[1]&&/^\\d+$/.test(p[1])){var h=p[0]==='anime'?'#/anime/'+p[1]:p[0]==='watch'?'#/watch/'+p[1]+'/'+(/^\\d+$/.test(p[2]||'')?p[2]:'1'):'';" +
  "if(h)history.replaceState(null,'',location.pathname+location.search+h)}})()</script>";

// Server-rendered content for crawlers that do not run JavaScript (the SPA draws everything
// client-side). It sits off-screen and is removed after the SPA has loaded, so visitors never see it.
const PRE_STYLE = "position:absolute;left:-10000px;top:0;width:1px;height:1px;overflow:hidden";
const PRE_SCRIPT =
  "<script>addEventListener('load',function(){setTimeout(function(){var e=document.getElementById('pdi-prerender');if(e&&e.parentNode)e.parentNode.removeChild(e)},4000)})</script>";
const wrapPre = (inner) => '<div id="pdi-prerender" style="' + PRE_STYLE + '">' + inner + "</div>" + PRE_SCRIPT;

export function createSeo({ backendUrl, secret }) {
  let cache = { at: 0, rows: [], settings: {}, logo: "" };
  let inflight = null;

  async function getJson(p) {
    const headers = { accept: "application/json" };
    if (secret) headers["x-pdi-proxy-secret"] = secret;
    const r = await fetch(new URL(p, backendUrl), { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(p + " " + r.status);
    return r.json();
  }

  async function data() {
    if (Date.now() - cache.at < TTL) return cache;
    if (!inflight) {
      inflight = (async () => {
        try {
          const [rows, settings, branding] = await Promise.all([
            getJson("/api/anime"),
            getJson("/api/site-settings").catch(() => ({})),
            getJson("/api/branding").catch(() => ({}))
          ]);
          if (Array.isArray(rows)) cache = { at: Date.now(), rows, settings: settings || {}, logo: (branding && branding.logoUrl) || "" };
        } catch (e) {
          console.error("SEO data error:", e?.message || e);
          cache = { ...cache, at: Date.now() - TTL + 60000 }; // keep stale data, retry in 1 min
        } finally {
          inflight = null;
        }
      })();
    }
    await inflight;
    return cache;
  }

  const baseUrl = (req) => (process.env.SITE_URL || req.protocol + "://" + req.get("host")).replace(/\/+$/, "");
  const animeSlug = (x) => x.slug || slugify(x.title) || "anime";
  const absolute = (u, base) => {
    if (!u) return "";
    if (/^data:/i.test(u)) return "";
    try {
      return new URL(u, base + "/").toString();
    } catch {
      return "";
    }
  };
  const epNumber = (e) => Number(e?.episodeNumber ?? e?.episode_number);
  const qs = (req) => {
    const i = req.originalUrl.indexOf("?");
    return i < 0 ? "" : req.originalUrl.slice(i);
  };

  function headTags({ title, desc, canonical, image, type, robots, ld, site }) {
    const t = [];
    t.push("<title>" + esc(title) + "</title>");
    t.push('<meta name="description" content="' + esc(desc) + '">');
    t.push('<meta name="robots" content="' + (robots || "index, follow, max-image-preview:large") + '">');
    t.push('<link rel="canonical" href="' + esc(canonical) + '">');
    t.push('<meta property="og:site_name" content="' + esc(site) + '">');
    t.push('<meta property="og:type" content="' + (type || "website") + '">');
    t.push('<meta property="og:title" content="' + esc(title) + '">');
    t.push('<meta property="og:description" content="' + esc(desc) + '">');
    t.push('<meta property="og:url" content="' + esc(canonical) + '">');
    if (image) t.push('<meta property="og:image" content="' + esc(image) + '">');
    t.push('<meta name="twitter:card" content="' + (image ? "summary_large_image" : "summary") + '">');
    t.push('<meta name="twitter:title" content="' + esc(title) + '">');
    t.push('<meta name="twitter:description" content="' + esc(desc) + '">');
    if (image) t.push('<meta name="twitter:image" content="' + esc(image) + '">');
    for (const o of ld || []) t.push(jsonLd(o));
    return t.join("\n");
  }

  const animeLink = (x) => '<a href="/anime/' + x.id + "/" + animeSlug(x) + '">' + esc(x.title) + "</a>";

  // Called by servePage for every HTML page; returns { html, status }.
  async function decorate(req, html) {
    const base = baseUrl(req);
    const { rows, settings, logo } = await data();
    const site = settings.site_name || "Prime Hindi";
    const defaultImage = absolute(logo, base);
    const m = req.path.match(/^\/(anime|watch)\/(\d+)(?:\/([^/]+))?\/?$/);
    let tags;
    let pre = "";
    let status = 200;

    if (req.path === "/" || req.path === "/index.html") {
      const title = settings.seo_title || site + " \u2013 Watch Anime in Hindi Dub Online";
      const desc = settings.seo_description || DEFAULT_DESC;
      tags = headTags({
        title,
        desc,
        canonical: base + "/",
        image: defaultImage,
        site,
        ld: [
          { "@context": "https://schema.org", "@type": "WebSite", name: site, url: base + "/", inLanguage: "hi" },
          { "@context": "https://schema.org", "@type": "Organization", name: site, url: base + "/", ...(defaultImage && { logo: defaultImage }) }
        ]
      });
      pre = wrapPre(
        "<h1>" + esc(title) + "</h1><p>" + esc(desc) + "</p><ul>" +
          rows.slice(0, 200).map((r) => "<li>" + animeLink(r) + "</li>").join("") +
          "</ul>"
      );
    } else if (m) {
      const x = rows.find((r) => Number(r.id) === Number(m[2]));
      const ep = m[1] === "watch" ? Number(m[3]) || 1 : 0;
      const episodes = Array.isArray(x?.episodes) ? x.episodes : [];
      const epKnown = !ep || !episodes.length || episodes.some((e) => epNumber(e) === ep);
      if (!x || !epKnown) {
        status = 404;
        tags = headTags({
          title: "Not found \u2013 " + site,
          desc: DEFAULT_DESC,
          canonical: base + "/",
          robots: "noindex, follow",
          site
        });
      } else {
        const dub = x.hindi_dub ? " Hindi Dubbed" : "";
        const slug = animeSlug(x);
        const image = absolute(x.banner_url || x.poster_url, base) || defaultImage;
        const animeUrl = base + "/anime/" + x.id + "/" + slug;
        const genres = Array.isArray(x.genres) ? x.genres : [];
        const series = {
          "@context": "https://schema.org",
          "@type": x.type === "movie" ? "Movie" : "TVSeries",
          name: x.title,
          url: animeUrl,
          inLanguage: x.hindi_dub ? "hi" : "ja",
          ...(image && { image }),
          ...(x.description && { description: trunc(x.description, 300) }),
          ...(genres.length && { genre: genres }),
          ...(x.type !== "movie" && (x.episode_count ?? episodes.length) ? { numberOfEpisodes: Number(x.episode_count ?? episodes.length) } : {})
        };
        if (!ep) {
          tags = headTags({
            title: x.title + dub + " \u2013 Watch Online in HD | " + site,
            desc: trunc(x.description, 155) || "Watch " + x.title + dub + " online in HD on " + site + ".",
            canonical: animeUrl,
            image,
            type: x.type === "movie" ? "video.movie" : "video.tv_show",
            site,
            ld: [series]
          });
          const epLinks = episodes
            .map((e) => epNumber(e))
            .filter((n) => n > 0)
            .map((n) => '<li><a href="/watch/' + x.id + "/" + n + '">' + esc(x.title) + " Episode " + n + "</a></li>")
            .join("");
          pre = wrapPre(
            "<h1>" + esc(x.title + dub) + "</h1>" +
              (x.description ? "<p>" + esc(trunc(x.description, 600)) + "</p>" : "") +
              (genres.length ? "<p>" + esc(genres.join(", ")) + "</p>" : "") +
              (epLinks ? "<ul>" + epLinks + "</ul>" : "") +
              '<p><a href="/">' + esc(site) + "</a></p>"
          );
        } else {
          const watchUrl = base + "/watch/" + x.id + "/" + ep;
          tags = headTags({
            title: x.title + " Episode " + ep + dub + " \u2013 Watch Online | " + site,
            desc: "Watch " + x.title + " episode " + ep + dub + " online in HD on " + site + ".",
            canonical: watchUrl,
            image,
            type: "video.episode",
            site,
            ld: [
              {
                "@context": "https://schema.org",
                "@type": "TVEpisode",
                name: x.title + " Episode " + ep,
                episodeNumber: ep,
                url: watchUrl,
                inLanguage: x.hindi_dub ? "hi" : "ja",
                ...(image && { image }),
                partOfSeries: { "@type": "TVSeries", name: x.title, url: animeUrl }
              }
            ]
          });
          pre = wrapPre(
            "<h1>" + esc(x.title + " Episode " + ep + dub) + "</h1><p>" +
              esc("Watch " + x.title + " episode " + ep + dub + " online in HD on " + site + ".") +
              '</p><p><a href="' + esc("/anime/" + x.id + "/" + slug) + '">' + esc(x.title) + "</a></p>"
          );
        }
      }
    } else {
      // Unknown path served by the SPA fallback: keep it out of the index.
      tags = headTags({
        title: site,
        desc: DEFAULT_DESC,
        canonical: base + "/",
        robots: "noindex, follow",
        site
      });
    }

    let out = html.replace("<head>", "<head>" + PATH_TO_HASH_SHIM);
    out = /<title>[^<]*<\/title>/i.test(out)
      ? out.replace(/<title>[^<]*<\/title>/i, () => tags)
      : out.replace("</head>", () => tags + "</head>");
    if (pre) out = out.replace(/<body[^>]*>/i, (b) => b + pre);
    return { html: out, status };
  }

  // 301 redirects to the one canonical URL of a page: /index.html -> /, /anime/ID -> /anime/ID/slug,
  // /watch/ID -> /watch/ID/1, wrong or missing slug, trailing slash. Unknown IDs fall through.
  async function redirects(req, res, next) {
    try {
      if (!/^(GET|HEAD)$/.test(req.method)) return next();
      if (req.path === "/index.html") return res.redirect(301, "/" + qs(req));
      const m = req.path.match(/^\/(anime|watch)\/(\d+)(?:\/([^/]+))?\/?$/);
      if (!m) return next();
      const { rows } = await data();
      const x = rows.find((r) => Number(r.id) === Number(m[2]));
      if (!x) return next();
      let want;
      if (m[1] === "anime") want = "/anime/" + x.id + "/" + animeSlug(x);
      else want = "/watch/" + x.id + "/" + (/^\d+$/.test(m[3] || "") ? Number(m[3]) : 1);
      if (req.path !== want) return res.redirect(301, want + qs(req));
      return next();
    } catch (e) {
      console.error("Redirect error:", e?.message || e);
      return next();
    }
  }

  async function sitemap(req, res) {
    const base = baseUrl(req);
    const { rows } = await data();
    const urls = [{ loc: base + "/" }];
    for (const x of rows) {
      if (urls.length >= 45000) break;
      const lastmod = x.updated_at || x.created_at;
      let d = lastmod ? new Date(lastmod) : null;
      if (d && Number.isNaN(d.getTime())) d = null;
      urls.push({ loc: base + "/anime/" + x.id + "/" + animeSlug(x), lastmod: d && d.toISOString().slice(0, 10) });
      for (const e of Array.isArray(x.episodes) ? x.episodes : []) {
        const n = epNumber(e);
        if (!n || urls.length >= 45000) continue;
        urls.push({ loc: base + "/watch/" + x.id + "/" + n, lastmod: d && d.toISOString().slice(0, 10) });
      }
    }
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls
        .map((u) => "<url><loc>" + esc(u.loc) + "</loc>" + (u.lastmod ? "<lastmod>" + u.lastmod + "</lastmod>" : "") + "</url>")
        .join("\n") +
      "\n</urlset>\n";
    res.set("Cache-Control", "public, max-age=3600");
    res.type("application/xml").send(xml);
  }

  function robots(req, res) {
    // /api stays crawlable on purpose: Googlebot renders the SPA and the page needs /api/anime.
    // API responses carry "X-Robots-Tag: noindex" instead (see robotsHeader).
    const body =
      "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /editor\nDisallow: /accept-invite\n\nSitemap: " +
      baseUrl(req) +
      "/sitemap.xml\n";
    res.set("Cache-Control", "public, max-age=3600");
    res.type("text/plain").send(body);
  }

  function robotsHeader(req, res, next) {
    if (NOINDEX_PREFIXES.some((p) => req.path === p || req.path.startsWith(p + "/") || req.path.startsWith(p + "."))) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    next();
  }

  return { decorate, sitemap, robots, robotsHeader, redirects };
}
