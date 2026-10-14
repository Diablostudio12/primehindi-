// Engagement feature (additive): per-episode / per-anime comments and anime reviews.
// Registered from start.js right before the main server starts listening.
// Comments reuse the existing `comments` table (new nullable episode_id column) so the
// existing admin comment moderation keeps working: new comments stay pending until approved.
import pg from 'pg';
import jwt from 'jsonwebtoken';

const OWNER_EMAIL = 'primordialdubbers@gmail.com';

export function registerEngagement(app) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 3
  });

  const ready = pool.query(`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS episode_id INT REFERENCES episodes(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS comments_anime_episode_idx ON comments(anime_id, episode_id);
    CREATE TABLE IF NOT EXISTS reviews(
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      anime_id INT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
      rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, anime_id)
    );
    CREATE INDEX IF NOT EXISTS reviews_anime_idx ON reviews(anime_id);
  `);
  ready.catch((e) => console.error('Engagement migration failed:', e.message));

  const wrap = (fn) => async (req, res) => {
    try {
      await ready;
      await fn(req, res);
    } catch (e) {
      console.error('Engagement route error:', e.message);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
  };

  async function user(req, res, next) {
    let payload;
    try {
      payload = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Please sign in first.' });
    }
    try {
      const u = (await pool.query('select id,email,role,is_banned from users where id=$1', [payload.id])).rows[0];
      if (!u) return res.status(401).json({ error: 'Please sign in first.' });
      if (u.role === 'user' && u.is_banned) return res.status(403).json({ error: 'This account has been suspended' });
      req.uid = u.id;
      req.uemail = String(u.email || '').toLowerCase();
      return next();
    } catch (e) {
      console.error('Engagement auth error:', e.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async function staff(req, res, next) {
    return user(req, res, async () => {
      try {
        let ok = req.uemail === OWNER_EMAIL;
        if (!ok) {
          const t = (await pool.query('select role,status from admin_team where email=$1', [req.uemail])).rows[0];
          ok = !!(t && t.status === 'active' && ['admin', 'editor'].includes(t.role));
        }
        if (!ok) return res.status(403).json({ error: 'Staff access required' });
        return next();
      } catch (e) {
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  const intOrNull = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

  // ---- Comments (episode-level when episodeId is given, otherwise anime-level) ----
  app.get('/api/engage/comments', wrap(async (req, res) => {
    const animeId = intOrNull(req.query.animeId);
    const episodeId = intOrNull(req.query.episodeId);
    if (!animeId) return res.status(400).json({ error: 'animeId is required' });
    const { rows } = await pool.query(
      `select c.id,c.content,c.created_at,u.display_name
         from comments c join users u on u.id=c.user_id
        where c.anime_id=$1 and c.status='approved'
          and (($2::int is null and c.episode_id is null) or c.episode_id=$2::int)
        order by c.created_at desc limit 100`,
      [animeId, episodeId]
    );
    res.set('Cache-Control', 'no-store');
    res.json(rows);
  }));

  app.post('/api/engage/comments', user, wrap(async (req, res) => {
    const animeId = intOrNull(req.body?.animeId);
    const episodeId = intOrNull(req.body?.episodeId);
    const content = String(req.body?.content || '').trim();
    if (!animeId) return res.status(400).json({ error: 'animeId is required' });
    if (!content || content.length > 2000) return res.status(400).json({ error: 'Comment must be 1-2000 characters' });
    const a = await pool.query('select id from anime where id=$1', [animeId]);
    if (!a.rowCount) return res.status(404).json({ error: 'Anime not found' });
    if (episodeId) {
      const e = await pool.query('select id from episodes where id=$1 and anime_id=$2', [episodeId, animeId]);
      if (!e.rowCount) return res.status(404).json({ error: 'Episode not found' });
    }
    const recent = await pool.query(
      "select count(*)::int n from comments where user_id=$1 and created_at > now() - interval '10 minutes'",
      [req.uid]
    );
    if (recent.rows[0].n >= 5) return res.status(429).json({ error: 'Too many comments. Please wait a few minutes.' });
    const { rows } = await pool.query(
      "insert into comments(user_id,anime_id,episode_id,content,status) values($1,$2,$3,$4,'pending') returning id,content,status,created_at",
      [req.uid, animeId, episodeId, content]
    );
    res.status(201).json({ ...rows[0], message: 'Your comment is awaiting admin approval.' });
  }));

  // ---- Reviews (one per user per anime, published immediately, editable) ----
  app.get('/api/engage/reviews', wrap(async (req, res) => {
    const animeId = intOrNull(req.query.animeId);
    if (!animeId) return res.status(400).json({ error: 'animeId is required' });
    const sum = (await pool.query('select count(*)::int count, coalesce(round(avg(rating)::numeric,1),0)::float avg from reviews where anime_id=$1', [animeId])).rows[0];
    const { rows } = await pool.query(
      `select r.id,r.rating,r.content,r.created_at,r.updated_at,r.user_id,u.display_name
         from reviews r join users u on u.id=r.user_id
        where r.anime_id=$1 order by r.updated_at desc limit 100`,
      [animeId]
    );
    res.set('Cache-Control', 'no-store');
    res.json({ count: sum.count, average: sum.avg, items: rows });
  }));

  app.post('/api/engage/reviews', user, wrap(async (req, res) => {
    const animeId = intOrNull(req.body?.animeId);
    const rating = Number(req.body?.rating);
    const content = String(req.body?.content || '').trim();
    if (!animeId) return res.status(400).json({ error: 'animeId is required' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1 to 5 stars' });
    if (content.length > 2000) return res.status(400).json({ error: 'Review must be 2000 characters or less' });
    const a = await pool.query('select id from anime where id=$1', [animeId]);
    if (!a.rowCount) return res.status(404).json({ error: 'Anime not found' });
    const { rows } = await pool.query(
      `insert into reviews(user_id,anime_id,rating,content) values($1,$2,$3,$4)
       on conflict(user_id,anime_id) do update set rating=excluded.rating,content=excluded.content,updated_at=now()
       returning id,rating,content,created_at,updated_at`,
      [req.uid, animeId, rating, content]
    );
    res.status(201).json({ ...rows[0], message: 'Thanks! Your review is published.' });
  }));

  app.delete('/api/engage/reviews/:id', staff, wrap(async (req, res) => {
    const id = intOrNull(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid review id' });
    const r = await pool.query('delete from reviews where id=$1', [id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Review not found' });
    res.sendStatus(204);
  }));
}
