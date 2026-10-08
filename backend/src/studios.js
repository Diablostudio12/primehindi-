// Studios feature (additive): tables, public API, owner/admin management API.
// Registered from start.js right before the main server starts listening.
import pg from 'pg';
import jwt from 'jsonwebtoken';

const OWNER_EMAIL = 'primordialdubbers@gmail.com';

const slugify = (v) =>
  String(v || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio';

function cleanLogo(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (s.length > 1500000) return null;
  return /^(https?:\/\/|\/|data:image\/)/i.test(s) ? s : null;
}

export function registerStudios(app) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 3
  });

  const ready = pool.query(`
    CREATE TABLE IF NOT EXISTS studios(
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE anime ADD COLUMN IF NOT EXISTS studio_id INT REFERENCES studios(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS anime_studio_idx ON anime(studio_id);
  `);
  ready.catch((e) => console.error('Studios migration failed:', e.message));

  const wrap = (fn) => async (req, res) => {
    try {
      await ready;
      await fn(req, res);
    } catch (e) {
      console.error('Studios route error:', e.message);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
  };

  async function manager(req, res, next) {
    let payload;
    try {
      payload = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const u = (await pool.query('select id,email from users where id=$1', [payload.id])).rows[0];
      if (!u) return res.status(403).json({ error: 'Staff access required' });
      const email = String(u.email || '').toLowerCase();
      let role = null;
      if (email === OWNER_EMAIL) role = 'owner';
      else {
        const t = (await pool.query('select role,status from admin_team where email=$1', [email])).rows[0];
        if (t && t.status === 'active' && t.role === 'admin') role = 'admin';
      }
      if (!role) return res.status(403).json({ error: 'Only the owner or an admin can manage studios' });
      req.staffEmail = email;
      req.staffRole = role;
      res.on('finish', () => {
        if (req.method !== 'GET' && res.statusCode < 400) {
          pool.query(
            'insert into admin_activity(actor_email,actor_role,action,method,path,status_code) values($1,$2,$3,$4,$5,$6)',
            [email, role, req.method + ' ' + req.path, req.method, req.path, res.statusCode]
          ).catch(() => {});
        }
      });
      return next();
    } catch (e) {
      console.error('Studios auth error:', e.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async function uniqueSlug(base, excludeId) {
    let s = base, n = 2;
    while ((await pool.query('select 1 from studios where slug=$1 and ($2::int is null or id<>$2)', [s, excludeId || null])).rowCount) {
      s = base + '-' + n++;
    }
    return s;
  }

  // ---- Public ----
  app.get('/api/studios', wrap(async (req, res) => {
    const { rows } = await pool.query(
      `select s.id,s.name,s.slug,s.logo_url,
        (select count(*)::int from anime a where a.studio_id=s.id and a.is_published=true) as anime_count
       from studios s order by lower(s.name)`
    );
    res.json(rows);
  }));

  app.get('/api/studios/:slug', wrap(async (req, res) => {
    const s = (await pool.query('select id,name,slug,logo_url from studios where slug=$1', [req.params.slug])).rows[0];
    if (!s) return res.status(404).json({ error: 'Studio not found' });
    const { rows } = await pool.query(
      `select a.*,(select count(*)::int from episodes e where e.anime_id=a.id and e.is_published=true) as episode_count
       from anime a where a.studio_id=$1 and a.is_published=true
       order by a.is_featured desc,a.featured_order asc,a.created_at desc`,
      [s.id]
    );
    res.json({ ...s, anime: rows });
  }));

  // ---- Owner / admin (no delete by design) ----
  app.post('/api/admin/studios', manager, wrap(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    if (!name || name.length > 80) return res.status(400).json({ error: 'Studio name is required (max 80 characters)' });
    const logo = cleanLogo(req.body?.logoUrl);
    if (logo === null) return res.status(400).json({ error: 'Logo must be an http(s) URL or an image' });
    const slug = await uniqueSlug(slugify(req.body?.slug || name), null);
    const { rows } = await pool.query(
      'insert into studios(name,slug,logo_url) values($1,$2,$3) returning id,name,slug,logo_url',
      [name, slug, logo]
    );
    res.status(201).json(rows[0]);
  }));

  app.put('/api/admin/studios/:id', manager, wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid studio id' });
    const old = (await pool.query('select * from studios where id=$1', [id])).rows[0];
    if (!old) return res.status(404).json({ error: 'Studio not found' });
    const name = req.body?.name === undefined ? old.name : String(req.body.name).trim();
    if (!name || name.length > 80) return res.status(400).json({ error: 'Studio name is required (max 80 characters)' });
    const logo = req.body?.logoUrl === undefined ? old.logo_url : cleanLogo(req.body.logoUrl);
    if (logo === null) return res.status(400).json({ error: 'Logo must be an http(s) URL or an image' });
    const slug = req.body?.slug ? await uniqueSlug(slugify(req.body.slug), id) : old.slug;
    const { rows } = await pool.query(
      'update studios set name=$1,slug=$2,logo_url=$3 where id=$4 returning id,name,slug,logo_url',
      [name, slug, logo, id]
    );
    res.json(rows[0]);
  }));

  app.put('/api/admin/anime/:id/studio', manager, wrap(async (req, res) => {
    const animeId = Number(req.params.id);
    if (!Number.isInteger(animeId) || animeId < 1) return res.status(400).json({ error: 'Invalid anime id' });
    let studioId = req.body?.studioId;
    if (studioId === '' || studioId === undefined) studioId = null;
    if (studioId !== null) {
      studioId = Number(studioId);
      if (!Number.isInteger(studioId) || !(await pool.query('select 1 from studios where id=$1', [studioId])).rowCount) {
        return res.status(400).json({ error: 'Studio not found' });
      }
    }
    const { rows } = await pool.query('update anime set studio_id=$1 where id=$2 returning id,studio_id', [studioId, animeId]);
    if (!rows[0]) return res.status(404).json({ error: 'Anime not found' });
    res.json(rows[0]);
  }));
}
