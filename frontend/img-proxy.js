// /img?u=<catalog image URL>&w=<width>: serves catalog images (posters, thumbnails, logos) as
// resized WebP. Only URLs that exist in the catalog are accepted (no open proxy), private/internal
// addresses are blocked, results are cached on disk. If conversion is not possible the original
// image bytes are passed through, so a poster never disappears because of this feature.
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import net from "node:net";
import dns from "node:dns/promises";

const CACHE_DIR = path.join(os.tmpdir(), "pdi-img-cache");
const WIDTHS = [160, 240, 320, 480, 640, 960, 1280, 1600];
const MAX_SRC = 15 * 1024 * 1024;
const MAX_CACHE = 400 * 1024 * 1024;
const CATALOG_TTL = 10 * 60 * 1000;
const MAX_PARALLEL = 3;

let sharpPromise = null;
const getSharp = () => {
  if (!sharpPromise) sharpPromise = import("sharp").then((m) => m.default || m).catch(() => null);
  return sharpPromise;
};

export function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = String(ip).toLowerCase();
  if (v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
  const m = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return m ? privateIp(m[1]) : false;
}

async function assertPublic(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (privateIp(host)) throw new Error("blocked address");
    return;
  }
  const list = await dns.lookup(host, { all: true });
  if (!list.length || list.some((x) => privateIp(x.address))) throw new Error("blocked address");
}

async function fetchImage(startUrl) {
  let url = startUrl;
  for (let hop = 0; hop < 4; hop++) {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) throw new Error("bad url");
    await assertPublic(u.hostname);
    const r = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(10000), headers: { accept: "image/*" } });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      url = new URL(r.headers.get("location"), u).href;
      continue;
    }
    if (!r.ok) throw new Error("upstream " + r.status);
    const type = String(r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/") || type.includes("svg")) throw new Error("not a raster image");
    const chunks = [];
    let size = 0;
    for await (const c of r.body) {
      size += c.length;
      if (size > MAX_SRC) throw new Error("too large");
      chunks.push(c);
    }
    return { buf: Buffer.concat(chunks), type };
  }
  throw new Error("too many redirects");
}

export function registerImgProxy(app, { backendUrl, secret }) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  let cacheBytes = 0;
  let allowed = new Set();
  let allowedAt = 0;
  let loading = null;
  const inflight = new Map();
  let running = 0;
  const waiters = [];

  async function loadAllowed() {
    const headers = { accept: "application/json" };
    if (secret) headers["x-pdi-proxy-secret"] = secret;
    const r = await fetch(new URL("/api/anime", backendUrl), { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("catalog " + r.status);
    const rows = await r.json();
    const set = new Set();
    const add = (v) => {
      try {
        if (typeof v === "string" && v.slice(0, 4).toLowerCase() === "http") set.add(new URL(v).href);
      } catch {}
    };
    for (const x of Array.isArray(rows) ? rows : []) {
      add(x.poster_url);
      add(x.banner_url);
      add(x.studio_logo_url);
      for (const e of Array.isArray(x.episodes) ? x.episodes : []) add(e.thumbnail_url);
      for (const c of Array.isArray(x.voice_cast) ? x.voice_cast : []) {
        add(c && c.image);
        add(c && c.actorImage);
      }
    }
    allowed = set;
    allowedAt = Date.now();
  }
  async function refresh(force) {
    if (!force && Date.now() - allowedAt < CATALOG_TTL) return;
    if (!loading) loading = loadAllowed().catch((e) => console.error("img-proxy catalog:", e?.message || e)).finally(() => { loading = null; });
    await loading;
  }
  async function isAllowed(href) {
    await refresh(false);
    if (allowed.has(href)) return true;
    // a title added in the last minutes: refresh once (at most every 30s)
    if (Date.now() - allowedAt > 30000) {
      await refresh(true);
      return allowed.has(href);
    }
    return false;
  }

  async function slot() {
    if (running >= MAX_PARALLEL) await new Promise((res) => waiters.push(res));
    running++;
  }
  function release() {
    running--;
    const next = waiters.shift();
    if (next) next();
  }

  async function build(href, w, file) {
    await slot();
    try {
      const { buf, type } = await fetchImage(href);
      const sharp = await getSharp();
      if (sharp) {
        try {
          const out = await sharp(buf, { limitInputPixels: 50e6 })
            .rotate()
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: 78 })
            .toBuffer();
          // keep the original if WebP did not make it smaller (already tiny / already optimal)
          if (out.length < buf.length || type !== "image/webp") {
            await fsp.writeFile(file, out).catch(() => {});
            cacheBytes += out.length;
            return { buf: out, type: "image/webp", cached: true };
          }
        } catch (e) {
          console.error("img-proxy convert:", e?.message || e);
        }
      }
      return { buf, type, cached: false };
    } finally {
      release();
    }
  }

  app.get("/img", async (req, res) => {
    try {
      const raw = String(req.query.u || "");
      if (!raw || raw.length > 2000) return res.sendStatus(400);
      let href;
      try {
        href = new URL(raw).href;
      } catch {
        return res.sendStatus(400);
      }
      const asked = Number(req.query.w) || 480;
      const w = WIDTHS.find((x) => x >= asked) || WIDTHS[WIDTHS.length - 1];
      if (!(await isAllowed(href))) return res.sendStatus(404);

      const key = crypto.createHash("sha1").update(href + "|" + w).digest("hex");
      const file = path.join(CACHE_DIR, key + ".webp");
      const send = (buf, type) => {
        res.set({
          "Content-Type": type,
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
          "X-Content-Type-Options": "nosniff"
        });
        res.send(buf);
      };
      try {
        return send(await fsp.readFile(file), "image/webp");
      } catch {}

      if (cacheBytes > MAX_CACHE) {
        cacheBytes = 0;
        await fsp.rm(CACHE_DIR, { recursive: true, force: true }).catch(() => {});
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      let p = inflight.get(key);
      if (!p) {
        p = build(href, w, file).finally(() => inflight.delete(key));
        inflight.set(key, p);
      }
      const out = await p;
      return send(out.buf, out.type);
    } catch (e) {
      console.error("img-proxy:", e?.message || e);
      return res.sendStatus(502);
    }
  });
}
