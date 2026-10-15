// 18+ content (additive): anime.is_adult column, public filtering, admin/editor flag saving.
// Registered from start.js right before the main server starts listening.
// Public API hides adult anime unless the request has ?adult=1 (the site's 18+ toggle).
import pg from 'pg';

export function registerAdult(app) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 2
  });

  const ready = pool.query('ALTER TABLE anime ADD COLUMN IF NOT EXISTS is_adult BOOLEAN NOT NULL DEFAULT false');
  ready.catch((e) => console.error('18+ migration failed:', e.message));

  const wantsAdult = (req) => ['1', 'true'].includes(String(req.query?.adult || '').toLowerCase());
  const truthy = (v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';

  async function adultLayer(req, res, next) {
    try {
      const path = req.path;

      // Public reads: hide adult anime unless the 18+ toggle is on.
      const publicList = path === '/api/anime';
      const publicDetail = /^\/api\/anime\/[^/]+$/.test(path);
      const studioPage = /^\/api\/studios\/[^/]+$/.test(path);
      if (req.method === 'GET' && (publicList || publicDetail || studioPage) && !wantsAdult(req)) {
        await ready.catch(() => {});
        const orig = res.json.bind(res);
        res.json = (body) => {
          if (Array.isArray(body)) {
            body = body.filter((r) => !(r && r.is_adult === true));
          } else if (body && Array.isArray(body.anime)) {
            body = { ...body, anime: body.anime.filter((r) => !(r && r.is_adult === true)) };
          } else if (body && body.is_adult === true) {
            res.status(404);
            body = { error: 'Not found' };
          }
          return orig(body);
        };
        return next();
      }

      // Admin / editor save: store the 18+ flag after the normal save succeeded.
      if ((req.method === 'POST' || req.method === 'PUT') && /^\/api\/admin\/anime(\/\d+)?$/.test(path)) {
        const orig = res.json.bind(res);
        res.json = (body) => {
          const b = req.body;
          if (res.statusCode < 400 && body && body.id != null && b && Object.prototype.hasOwnProperty.call(b, 'isAdult')) {
            const flag = truthy(b.isAdult);
            pool.query('update anime set is_adult=$1 where id=$2 returning is_adult', [flag, body.id])
              .then((r) => orig({ ...body, is_adult: r.rows[0] ? r.rows[0].is_adult : flag }))
              .catch((e) => {
                console.error('18+ flag save failed:', e.message);
                orig(body);
              });
            return res;
          }
          return orig(body);
        };
      }
    } catch (e) {
      console.error('18+ layer error:', e.message);
    }
    return next();
  }

  // Run before every existing route.
  app.use(adultLayer);
  const router = app.router || app._router;
  if (router && Array.isArray(router.stack)) router.stack.unshift(router.stack.pop());
}
