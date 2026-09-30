import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
// Primordial Streams clean frontend deployment
const backendUrl = process.env.BACKEND_URL || "https://primordial-streaming-backend-production.up.railway.app";

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

app.use(express.static(__dirname));
app.use((req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(port, "0.0.0.0", () => {
  console.log("Primordial Streams running on " + port);
});