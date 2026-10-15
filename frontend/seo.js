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

export function createSeo({ backendUrl, secret }) {
  let cache = { at: 0, rows: [], settings: {} };
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
          const [rows, settings] = await Promise.all([
            getJson("/api/anime"),
            getJson("/api/site-settings").catch(() => ({}))
          ]);
          if (Array.isArray(rows)) cache = { at: Date.now(), rows, settings: settings || {} };
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
    try {
      return new URL(u, base + "/").toString();
    } catch {
      return "";
    }
  };
  const epNumber = (e) => Number(e?.episodeNumber ?? e?.episode_number);

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

  // Called by servePage for every HTML page; returns { html, status }.
  async function decorate(req, html) {
    const base = baseUrl(req);
    const { rows, settings } = await data();
    const site = settings.site_name || "Prime Hindi";
    const m = req.path.match(/^\/(anime|watch)\/(\d+)(?:\/([^/]+))?\/?$/);
    let tags;
    let status = 200;

    if (req.path === "/" || req.path === "/index.html") {
      const title = settings.seo_title || site + " \u2013 Watch Anime in Hindi Dub Online";
      const desc = settings.seo_description || DEFAULT_DESC;
      tags = headTags({
        title,
        desc,
        canonical: base + "/",
        site,
        ld: [
          { "@context": "https://schema.org", "@type": "WebSite", name: site, url: base + "/", inLanguage: "hi" },
          { "@context": "https://schema.org", "@type": "Organization", name: site, url: base + "/" }
        ]
      });
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
        const image = absolute(x.banner_url || x.poster_url, base);
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
    return { html: out, status };
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

  return { decorate, sitemap, robots, robotsHeader };
}
