// Per-anime download permission (additive): anime.allow_download column, admin/editor flag saving,
// and the flag exposed on anime reads so the site knows where to show the Download button.
// Registered from start.js right before the main server starts listening.
import pg from 'pg';

export function registerDownloads(app) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 2
  });

  const ready = pool.query('ALTER TABLE anime ADD COLUMN IF NOT EXISTS allow_download BOOLEAN NOT NULL DEFAULT false');
  ready.catch((e) => console.error('Download flag migration failed:', e.message));

  const truthy = (v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';

  let cache = null;
  let cachedAt = 0;
  async function flags() {
    if (cache && Date.now() - cachedAt < 5000) return cache;
    await ready;
    const r = await pool.query('select id, allow_download from anime');
    cache = new Map(r.rows.map((x) => [Number(x.id), x.allow_download === true]));
    cachedAt = Date.now();
    return cache;
  }
  const withFlag = (row, m) => (row && row.id != null ? { ...row, allow_download: m.get(Number(row.id)) === true } : row);

  async function downloadLayer(req, res, next) {
    try {
      const path = req.path;

      // Reads (public list/detail + admin list): add allow_download to every anime row.
      const isRead = req.method === 'GET' &&
        (path === '/api/anime' || path === '/api/admin/anime' || /^\/api\/anime\/[^/]+$/.test(path));
      if (isRead) {
        const orig = res.json.bind(res);
        res.json = (body) => {
          if (res.statusCode >= 400 || !body || typeof body !== 'object') return orig(body);
          flags().then((m) => {
            let out;
            if (Array.isArray(body)) out = body.map((r) => withFlag(r, m));
            else if (Array.isArray(body.anime)) out = { ...body, anime: body.anime.map((r) => withFlag(r, m)) };
            else out = withFlag(body, m);
            orig(out);
          }).catch(() => orig(body));
          return res;
        };
        return next();
      }

      // Admin / editor save: store the flag after the normal save succeeded.
      if ((req.method === 'POST' || req.method === 'PUT') && /^\/api\/admin\/anime(\/\d+)?$/.test(path)) {
        const orig = res.json.bind(res);
        res.json = (body) => {
          const b = req.body;
          if (res.statusCode < 400 && body && body.id != null && b && Object.prototype.hasOwnProperty.call(b, 'allowDownload')) {
            const flag = truthy(b.allowDownload);
            ready
              .then(() => pool.query('update anime set allow_download=$1 where id=$2 returning allow_download', [flag, body.id]))
              .then((r) => {
                cache = null;
                orig({ ...body, allow_download: r.rows[0] ? r.rows[0].allow_download : flag });
              })
              .catch((e) => {
                console.error('Download flag save failed:', e.message);
                orig(body);
              });
            return res;
          }
          return orig(body);
        };
      }
    } catch (e) {
      console.error('Download layer error:', e.message);
    }
    return next();
  }

  // Run before every existing route.
  app.use(downloadLayer);
  const router = app.router || app._router;
  if (router && Array.isArray(router.stack)) router.stack.unshift(router.stack.pop());
}
