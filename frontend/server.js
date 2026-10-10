import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
const pageCache = new Map();
function servePage(file, scripts) {
  return (req, res) => {
    try {
      let html = pageCache.get(file);
      if (!html) {
        html = fs.readFileSync(path.join(__dirname, file), "utf8");
        // Pin third-party CDN script (supply-chain safety) instead of "@latest".
        html = html.split("https://unpkg.com/lucide@latest").join("https://unpkg.com/lucide@0.542.0");
        const tags = scripts.map((s) => '<script src="' + s + '"></script>').join("");
        const i = html.lastIndexOf("</body>");
        html = i < 0 ? html + tags : html.slice(0, i) + tags + html.slice(i);
        pageCache.set(file, html);
      }
      res.set("Cache-Control", "no-cache");
      res.type("html").send(html);
    } catch (error) {
      console.error("Page error:", error);
      res.status(500).send("Page unavailable");
    }
  };
}
const homePage = servePage("index.html", ["/studios.js"]);

app.get(["/", "/index.html"], homePage);

// Staff surfaces are separate pages; keep them out of the public SPA fallback.
app.get(["/admin", "/admin.html"], (req, res, next) => {
  res.set("Cache-Control", "no-store");
  servePage("admin-portal.html", ["/admin-studios.js", "/admin-enhancements.js"])(req, res, next);
});
app.get(["/editor", "/editor.html"], (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "editor.html"));
});
app.get(["/accept-invite", "/accept-invite.html"], (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "accept-invite.html"));
});

// Do not expose server source / package files / source maps through static hosting.
app.use((req, res, next) => {
  if (/^\/(server\.js|package(-lock)?\.json)$/i.test(req.path) || /\.map$/i.test(req.path)) return res.sendStatus(404);
  next();
});

app.use(express.static(__dirname, { extensions: ["html"], index: false }));
app.use(homePage);

app.listen(port, "0.0.0.0", () => {
  console.log("Primordial Streams running on " + port);
});
