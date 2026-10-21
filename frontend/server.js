import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSeo } from "./seo.js";
import { patchIndexHtml, patchScript } from "./seo-patches.js";
import { registerImgProxy } from "./img-proxy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
const port = process.env.PORT || 3000;
const backendUrl =
  process.env.BACKEND_URL ||
  "https://primordial-streaming-backend-production.up.railway.app";
const PROXY_SECRET = process.env.PROXY_SHARED_SECRET || "";
const MAX_BODY = 9 * 1024 * 1024;
const seo = createSeo({ backendUrl, secret: PROXY_SECRET });

// Security headers for every response (HTML, assets and the API proxy).
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=15552000");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=(), payment=(), usb=()");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  next();
});

// 301: any other host (old Railway domain, www) -> the main domain from SITE_URL.
// Does nothing while SITE_URL is unset. /api and non-GET requests are never redirected.
const SITE_ORIGIN = (() => {
  try {
    return process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : "";
  } catch {
    return "";
  }
})();
app.use((req, res, next) => {
  if (!SITE_ORIGIN || !/^(GET|HEAD)$/.test(req.method) || req.path.startsWith("/api")) return next();
  const host = String(req.get("host") || "").toLowerCase();
  if (!host || host === new URL(SITE_ORIGIN).host || host === "healthcheck.railway.app") return next();
  return res.redirect(301, SITE_ORIGIN + req.originalUrl);
});

// SEO: keep API / staff pages out of search results (X-Robots-Tag), serve robots.txt + sitemap.xml.
app.use(seo.robotsHeader);
app.get("/robots.txt", seo.robots);
app.get("/sitemap.xml", (req, res) => {
  seo.sitemap(req, res).catch((error) => {
    console.error("Sitemap error:", error?.message || error);
    res.status(500).type("text/plain").send("Sitemap unavailable");
  });
});
// 301 to the canonical page URL (/index.html -> /, /anime/ID -> /anime/ID/slug, /watch/ID -> /watch/ID/1).
app.use(seo.redirects);

// #12: resized WebP versions of catalog images (/img?u=...&w=...).
registerImgProxy(app, { backendUrl, secret: PROXY_SECRET });

app.use("/api", async (req, res) => {
  try {
    if (Number(req.headers["content-length"] || 0) > MAX_BODY) {
      return res.status(413).json({ error: "Request body too large" });
    }
    const target = new URL(req.originalUrl, backendUrl).toString();
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["content-length"];
    // Never trust client-supplied forwarding headers; pass the real client IP to the
    // backend only together with the shared secret so rate limits work per user.
    for (const h of ["x-pdi-proxy-secret", "x-pdi-client-ip", "x-forwarded-for", "x-real-ip", "forwarded"]) delete headers[h];
    if (PROXY_SECRET && req.ip) {
      headers["x-pdi-proxy-secret"] = PROXY_SECRET;
      headers["x-pdi-client-ip"] = req.ip;
    }

    let body;
    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];
      let received = 0;
      for await (const chunk of req) {
        received += chunk.length;
        if (received > MAX_BODY) return res.status(413).json({ error: "Request body too large" });
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(30000)
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (!["content-encoding", "transfer-encoding", "connection"].includes(key)) {
        res.setHeader(key, value);
      }
    });

    const data = Buffer.from(await response.arrayBuffer());
    res.send(data);
  } catch (error) {
    console.error("API proxy error:", error?.message || error);
    res.status(502).json({ error: "Backend connection failed" });
  }
});

// Serves an HTML page with extra feature scripts appended before </body>.
// Optional decorate(req, html) -> { html, status } adds per-request SEO tags (cache stays untouched).
const pageCache = new Map();
function servePage(file, scripts, decorate) {
  return async (req, res) => {
    try {
      let html = pageCache.get(file);
      if (!html) {
        html = fs.readFileSync(path.join(__dirname, file), "utf8");
        // Pin third-party CDN script (supply-chain safety) instead of "@latest".
        html = html.split("https://unpkg.com/lucide@latest").join("https://unpkg.com/lucide@0.542.0");
        // Staff bypass for maintenance mode and the 18+ fetch wrapper must load first (head), before the catalog fetch runs.
        if (file === "index.html") html = html.replace("<head>", '<head><script src="/maintenance-staff.js"></script><script src="/adult-filter.js"></script>');
        // Root-cause repair for the mobile header logo: index.html's stylesheet opens
        // "@media(min-width:800px){footer{...}" and never closes it, so every rule after it
        // (all header-logo sizing, incl. the mobile ones) is nested inside that desktop-only
        // query and never applies below 800px. Close the block right before the
        // "Header branding" comment. No-op once index.html itself is fixed.
        if (file === "index.html") {
          html = html.replace(
            /(footer:before\{right:clamp\(0px,calc\(\(100vw - 1200px\)\/2\),90px\)\})(\r?\n\/\* Header branding: larger logo with no clipping \*\/)/,
            "$1}$2"
          );
          // SEO round 2: alt text, lazy loading, WebP (see seo-patches.js)
          html = patchIndexHtml(html);
        }
        const tags = scripts.map((s) => '<script src="' + s + '"></script>').join("");
        const i = html.lastIndexOf("</body>");
        html = i < 0 ? html + tags : html.slice(0, i) + tags + html.slice(i);
        pageCache.set(file, html);
      }
      let page = html;
      let status = 200;
      if (decorate) {
        try {
          const out = await decorate(req, html);
          page = out.html;
          status = out.status || 200;
        } catch (error) {
          console.error("SEO decorate error:", error?.message || error);
        }
      }
      res.set("Cache-Control", "no-cache");
      res.status(status).type("html").send(page);
    } catch (error) {
      console.error("Page error:", error);
      res.status(500).send("Page unavailable");
    }
  };
}
const homePage = servePage("index.html", ["/studios.js", "/details-redesign.js", "/hero-desktop.js", "/watch-panel.js", "/home-discovery.js", "/download-button.js", "/seo-enhance.js"], seo.decorate);

// Real, indexable paths for the hash-routed SPA (a tiny inline script in the page maps them to #/ routes).
app.get(["/", "/index.html", "/anime/:id", "/anime/:id/:slug", "/watch/:id", "/watch/:id/:ep"], homePage);

// Homepage hero gutters: hero-desktop.js zeroes <main>'s side padding whenever the slider is
// present (desktop/tablet widths), so the slider and every section below it touch the screen
// edges while the header keeps its 18px gutter. Keep main's normal padding so the slider lines
// up with the header and the sections. No-op once hero-desktop.js itself is fixed.
// Also hides the purple slider progress line (.hs-pr) visually. The element and its animation
// stay in place (opacity:0), so the slide timing (animationend -> next slide) is unchanged.
let heroJs = null;
app.get("/hero-desktop.js", (req, res, next) => {
  try {
    if (heroJs === null) {
      heroJs = patchScript(
        "hero-desktop.js",
        fs
          .readFileSync(path.join(__dirname, "hero-desktop.js"), "utf8")
          .replace("max-width:1480px;padding-left:0;padding-right:0;box-sizing:border-box}", "max-width:1480px;box-sizing:border-box}")
          .replace("z-index:5;background:rgba(255,255,255,.1)}", "z-index:5;opacity:0;pointer-events:none;background:rgba(255,255,255,.1)}")
      );
    }
    res.set("Cache-Control", "no-cache");
    res.type("application/javascript").send(heroJs);
  } catch (error) {
    next();
  }
});

// Home sections script: same file, with catalog posters served through /img (WebP).
let discoveryJs = null;
app.get("/home-discovery.js", (req, res, next) => {
  try {
    if (discoveryJs === null) discoveryJs = patchScript("home-discovery.js", fs.readFileSync(path.join(__dirname, "home-discovery.js"), "utf8"));
    res.set("Cache-Control", "no-cache");
    res.type("application/javascript").send(discoveryJs);
  } catch (error) {
    next();
  }
});

// Staff surfaces are separate pages; keep them out of the public SPA fallback.
app.get(["/admin", "/admin.html"], (req, res, next) => {
  res.set("Cache-Control", "no-store");
  servePage("admin-portal.html", ["/admin-studios.js", "/admin-enhancements.js", "/admin-pro.js?v=1", "/admin-adult.js", "/admin-genres.js", "/admin-download.js"])(req, res, next);
});
app.get(["/editor", "/editor.html"], (req, res, next) => {
  res.set("Cache-Control", "no-store");
  servePage("editor.html", ["/admin-adult.js", "/admin-download.js"])(req, res, next);
});
app.get(["/accept-invite", "/accept-invite.html"], (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "accept-invite.html"));
});

// Do not expose server source / package files / source maps through static hosting.
// 404.html is only ever served as the response of the 404 handler below.
app.use((req, res, next) => {
  if (/^\/(server|seo|seo-patches|seo-config|pages|img-proxy)\.js$/i.test(req.path) || /^\/(404(\.html)?|package(-lock)?\.json)$/i.test(req.path) || /\.map$/i.test(req.path)) return res.sendStatus(404);
  next();
});

app.use(express.static(__dirname, { extensions: ["html"], index: false }));

// Custom 404 page (real 404 status, noindex) for every path that is not a page, asset or API route.
app.use((req, res) => {
  res.set("Cache-Control", "no-cache");
  res.status(404).sendFile(path.join(__dirname, "404.html"), (error) => {
    if (error && !res.headersSent) res.status(404).type("text/plain").send("Page not found");
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log("Primordial Streams running on " + port);
});
