// Additive account statistics endpoint. Reuses existing users/watchlist/progress tables.
import pg from 'pg';
import jwt from 'jsonwebtoken';

export function registerAccount(app) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 2
  });
  pool.on('error', (error) => console.error('[account] pool error:', error.message));

  app.get('/api/me/stats', async (req, res) => {
    let payload;
    try {
      const header = String(req.headers.authorization || '');
      if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Please sign in first.' });
      payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Please sign in first.' });
    }

    const userId = Number(payload.id);
    if (!Number.isInteger(userId) || userId < 1) return res.status(401).json({ error: 'Please sign in first.' });
    try {
      const { rows } = await pool.query(`
        SELECT
          (SELECT count(*)::int FROM watchlist WHERE user_id = $1) AS saved_anime,
          (SELECT count(*)::int FROM progress WHERE user_id = $1 AND seconds > 0) AS episodes_started,
          (SELECT coalesce(sum(seconds), 0)::bigint FROM progress WHERE user_id = $1) AS watched_seconds
      `, [userId]);
      res.set('Cache-Control', 'no-store');
      res.json(rows[0] || { saved_anime: 0, episodes_started: 0, watched_seconds: 0 });
    } catch (error) {
      console.error('[account] stats query failed:', error.message);
      res.status(500).json({ error: 'Could not load account statistics.' });
    }
  });
}
