import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const backendUrl =
  process.env.BACKEND_URL ||
  "https://primordial-streaming-backend-production.up.railway.app";

app.use("/api", async (req, res) => {
  try {
    const target = new URL(req.originalUrl, backendUrl).toString();
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["content-length"];

    let body;
    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual"
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
    console.error("API proxy error:", error);
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
  servePage("admin-portal.html", ["/admin-studios.js"])(req, res, next);
});
app.get(["/editor", "/editor.html"], (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "editor.html"));
});
app.get(["/accept-invite", "/accept-invite.html"], (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "accept-invite.html"));
});

app.use(express.static(__dirname, { extensions: ["html"], index: false }));
app.use(homePage);

app.listen(port, "0.0.0.0", () => {
  console.log("Primordial Streams running on " + port);
});
