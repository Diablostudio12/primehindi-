// Extra security layer. Loaded from start.js; inserts middleware into the existing
// Express app (before the routes) without editing server.js.
import crypto from 'node:crypto';
import net from 'node:net';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import rateLimit from 'express-rate-limit';
import { safeEqual, emailOk, passwordProblem, scanUrls, csvCell } from './security-helpers.js';

const OWNER_EMAIL = 'primordialdubbers@gmail.com';
const STAFF_SESSION_SECONDS = 12 * 60 * 60;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const BIG_BODY = [/^\/api\/me$/, /^\/api\/admin\/(anime|studios)(\/\d+)?$/, /^\/api\/admin\/branding$/];
const GENERIC_FORGOT = { message: 'If an account exists for that email, a password reset link will be sent.' };

function mountAt(app, router, finder) {
  const stack = app.router.stack;
  const before = stack.length;
  app.use(router);
  const added = stack.splice(before);
  const idx = finder(stack);
  if (idx < 0) throw new Error('mount point not found');
  stack.splice(idx, 0, ...added);
}

export function registerSecurity(app) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 3
  });
  pool.on('error', (e) => console.error('[security] pool error', e.message));
  const dummyHash = bcrypt.hashSync(crypto.randomBytes(12).toString('hex'), 12);

  const ready = pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS tokens_valid_after TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true;
    CREATE TABLE IF NOT EXISTS security_events(id BIGSERIAL PRIMARY KEY,kind TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',ip TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE INDEX IF NOT EXISTS security_events_created_idx ON security_events(created_at DESC);
    DELETE FROM security_events WHERE created_at < now() - interval '90 days';
  `).catch((e) => console.error('[security] migration failed:', e.message));

  function logEvent(kind, email, ip, detail = '') {
    console.warn('[security]', kind, email || '-', ip || '-', detail);
    pool.query('insert into security_events(kind,email,ip,detail) values($1,$2,$3,$4)',
      [kind, String(email || '').slice(0, 254), String(ip || '').slice(0, 64), String(detail).slice(0, 300)]).catch(() => {});
  }

  const userCache = new Map();
  async function loadUser(id) {
    const hit = userCache.get(id);
    if (hit && Date.now() - hit.at < 15000) return hit.row;
    const { rows } = await pool.query('select id,email,role,is_banned,tokens_valid_after from users where id=$1', [id]);
    const row = rows[0] || null;
    if (userCache.size > 5000) userCache.clear();
    userCache.set(id, { at: Date.now(), row });
    return row;
  }

  async function staffOf(email) {
    const e = String(email || '').toLowerCase();
    if (e === OWNER_EMAIL) return { role: 'owner', status: 'active', permissions: { canDelete: true } };
    const { rows } = await pool.query('select role,status,permissions from admin_team where email=$1', [e]);
    return rows[0] || null;
  }

  // ---- login failure tracking (in memory) ----
  const fails = new Map();
  const forgotByEmail = new Map();
  const lockedUntil = (key) => { const s = fails.get(key); return s && s.lockedUntil > Date.now() ? s.lockedUntil : 0; };
  function noteFail(key, limit) {
    const now = Date.now();
    let s = fails.get(key);
    if (!s || now - s.first > WINDOW_MS) { s = { n: 0, first: now, lockedUntil: 0 }; fails.set(key, s); }
    s.n++;
    if (s.n >= limit) s.lockedUntil = now + LOCK_MS;
  }
  setInterval(() => {
    const now = Date.now();
    for (const [k, s] of fails) if (now - s.first > WINDOW_MS && s.lockedUntil < now) fails.delete(k);
    for (const [k, s] of forgotByEmail) if (now - s.first > 3600000) forgotByEmail.delete(k);
  }, 10 * 60 * 1000).unref();

  const limiter = (windowMs, limit, message) => rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: message } });
  const forgotLimiter = limiter(3600000, 8, 'Too many reset requests. Please try again later.');
  const commentLimiter = limiter(600000, 8, 'You are commenting too fast. Please wait a few minutes.');
  const reportLimiter = limiter(3600000, 10, 'Too many reports. Please try again later.');
  const adminWriteLimiter = limiter(60000, 120, 'Too many admin actions. Slow down.');

  // =================== PRE router (before body parsing / rate limits) ===================
  const pre = express.Router();

  // Real client IP forwarded by the trusted web proxy (shared secret required).
  pre.use((req, res, next) => {
    const secret = process.env.PROXY_SHARED_SECRET;
    const sent = req.headers['x-pdi-proxy-secret'];
    if (secret && typeof sent === 'string' && safeEqual(sent, secret)) {
      const ip = String(req.headers['x-pdi-client-ip'] || '').trim();
      if (net.isIP(ip)) Object.defineProperty(req, 'ip', { value: ip, configurable: true, enumerable: true });
    }
    next();
  });

  pre.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=(), usb=()');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (/^\/api\/(auth|admin|me|notifications|watchlist|progress|reports)/.test(req.originalUrl)) res.setHeader('Cache-Control', 'no-store');
    next();
  });

  pre.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(req.method)) return next();
    const len = Number(req.headers['content-length'] || 0);
    const p = req.originalUrl.split('?')[0];
    const limit = BIG_BODY.some((r) => r.test(p)) ? 8 * 1024 * 1024 : 64 * 1024;
    if (len > limit) return res.status(413).json({ error: 'Request body too large' });
    next();
  });

  // Session gate: banned / deleted / revoked / expired-staff sessions are rejected early.
  pre.use('/api', async (req, res, next) => {
    const h = req.headers.authorization;
    if (!h) return next();
    let payload;
    try { payload = jwt.verify(h.replace(/^Bearer /, ''), process.env.JWT_SECRET); } catch { return next(); }
    try {
      await ready;
      const u = await loadUser(payload.id);
      if (!u) return res.status(401).json({ error: 'Unauthorized' });
      if (u.is_banned && u.role === 'user') return res.status(403).json({ error: 'This account has been suspended' });
      if (u.tokens_valid_after && payload.iat < Math.floor(new Date(u.tokens_valid_after).getTime() / 1000)) {
        return res.status(401).json({ error: 'Session expired. Please sign in again.' });
      }
      if (req.originalUrl.startsWith('/api/admin') && payload.iat && Math.floor(Date.now() / 1000) - payload.iat > STAFF_SESSION_SECONDS) {
        return res.status(401).json({ error: 'Staff session expired. Please sign in again.' });
      }
      req.secUser = { id: u.id, email: String(u.email || '').toLowerCase(), role: u.role };
    } catch (e) {
      console.error('[security] session gate error:', e.message);
    }
    next();
  });

  // =================== POST router (after body parsing + limiters, before routes) ===================
  const post = express.Router();

  // Login: lockout, staff MFA, timing equalisation.
  post.post('/api/auth/login', async (req, res, next) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const ip = req.ip || '?';
    const k1 = email + '|' + ip, k2 = email;
    const lock = Math.max(lockedUntil(k1), lockedUntil(k2));
    if (lock) {
      logEvent('login_locked', email, ip);
      const mins = Math.max(1, Math.ceil((lock - Date.now()) / 60000));
      return res.status(429).json({ error: 'Too many failed attempts. Try again in ' + mins + ' minute' + (mins === 1 ? '' : 's') + '.' });
    }
    res.on('finish', () => {
      if (res.statusCode === 401) { noteFail(k1, 8); noteFail(k2, 40); logEvent('login_failed', email, ip); }
      else if (res.statusCode === 200) fails.delete(k1);
    });
    try {
      const { rows } = await pool.query('select password_hash,role from users where email=$1', [email]);
      const u = rows[0];
      if (!u) { await bcrypt.compare(password, dummyHash); return next(); }
      const mfa = process.env.ADMIN_MFA_CODE;
      if (mfa) {
        const staff = await staffOf(email);
        const isStaff = u.role === 'admin' || (staff && staff.status === 'active');
        if (isStaff && (await bcrypt.compare(password, u.password_hash))) {
          if (!safeEqual(String(req.body?.mfaCode || ''), mfa)) {
            logEvent('mfa_failed', email, ip);
            return res.status(401).json({ error: 'Invalid MFA / Security Passcode' });
          }
        }
      }
    } catch (e) {
      console.error('[security] login gate error:', e.message);
    }
    next();
  });

  // Registration: strong password, valid email, block staff emails, mark unverified.
  post.post('/api/auth/register', async (req, res, next) => {
    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');
    const name = String(b.displayName || '').trim();
    if (!name || !email || !password) return next();
    if (!emailOk(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (name.length > 100) return res.status(400).json({ error: 'Name is too long.' });
    const problem = passwordProblem(password, email);
    if (problem) return res.status(400).json({ error: problem });
    try {
      if (await staffOf(email)) return res.status(409).json({ error: 'Email already registered' });
    } catch (e) { console.error('[security] register gate error:', e.message); }
    res.on('finish', () => {
      if (res.statusCode === 201) pool.query('update users set email_verified=false where email=$1', [email]).catch(() => {});
    });
    next();
  });

  // Google sign-in: an unverified, password-registered account with the same email is
  // taken over by the real owner (password rotated, old sessions revoked).
  post.post('/api/auth/google', (req, res, next) => {
    const orig = res.json.bind(res);
    res.json = (body) => {
      const u = body && body.user;
      if (res.statusCode < 400 && u && u.id && u.email) {
        (async () => {
          try {
            const r = await pool.query('select email_verified from users where id=$1', [u.id]);
            if (r.rows[0] && r.rows[0].email_verified === false) {
              const h = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
              await pool.query("update users set password_hash=$1,email_verified=true,tokens_valid_after=now()-interval '2 seconds' where id=$2", [h, u.id]);
              userCache.delete(u.id);
              logEvent('google_claimed_unverified_account', u.email, req.ip);
            }
          } catch (e) { console.error('[security] google hook error:', e.message); }
        })().finally(() => orig(body));
        return res;
      }
      return orig(body);
    };
    next();
  });

  // Password reset / invite accept: revoke all older sessions, mark email verified.
  post.post('/api/auth/reset-password', (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode !== 200) return;
      const raw = String(req.body?.token || '');
      if (!/^[a-f0-9]{64}$/i.test(raw)) return;
      const h = crypto.createHash('sha256').update(raw).digest('hex');
      pool.query('update users set tokens_valid_after=now(),email_verified=true where id=(select user_id from password_resets where token_hash=$1) returning id', [h])
        .then((r) => { if (r.rows[0]) userCache.delete(r.rows[0].id); })
        .catch((e) => console.error('[security] reset hook error:', e.message));
    });
    next();
  });
  post.post('/api/auth/team-invite/accept', (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode !== 200) return;
      const email = String(req.body?.email || '').trim().toLowerCase();
      pool.query('update users set tokens_valid_after=now(),email_verified=true where lower(email)=$1 returning id', [email])
        .then((r) => { if (r.rows[0]) userCache.delete(r.rows[0].id); })
        .catch((e) => console.error('[security] invite hook error:', e.message));
    });
    next();
  });

  // Forgot password: per-email throttle (generic reply) + per-IP limiter.
  post.post('/api/auth/forgot-password', forgotLimiter, (req, res, next) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return next();
    const now = Date.now();
    let s = forgotByEmail.get(email);
    if (!s || now - s.first > 3600000) { s = { n: 0, first: now }; forgotByEmail.set(email, s); }
    if (++s.n > 3) return res.json(GENERIC_FORGOT);
    next();
  });

  // "Sign out from all devices".
  post.post('/api/auth/logout-all', async (req, res) => {
    if (!req.secUser) return res.status(401).json({ error: 'Unauthorized' });
    await pool.query('update users set tokens_valid_after=now() where id=$1', [req.secUser.id]);
    userCache.delete(req.secUser.id);
    res.json({ message: 'Signed out from all devices.' });
  });

  // Make ban/unban effective immediately.
  post.patch('/api/admin/users/:id/ban', (req, res, next) => {
    res.on('finish', () => userCache.delete(Number(req.params.id)));
    next();
  });

  post.post('/api/anime/:slug/comments', commentLimiter);
  post.post('/api/reports/video', reportLimiter);

  // Input validation for ids / progress values.
  post.put('/api/progress/:episodeId', (req, res, next) => {
    const id = Number(req.params.episodeId);
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) return res.status(400).json({ error: 'Invalid episode' });
    const s = Math.floor(Number(req.body?.seconds));
    req.body = { ...(req.body || {}), seconds: Number.isFinite(s) ? Math.min(Math.max(s, 0), 172800) : 0 };
    next();
  });
  post.all('/api/watchlist/:animeId', (req, res, next) => {
    const id = Number(req.params.animeId);
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) return res.status(400).json({ error: 'Invalid anime' });
    next();
  });

  // Admin: write throttle, dangerous-URL blocking, delete = owner only.
  post.use('/api/admin', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    return adminWriteLimiter(req, res, next);
  });
  post.use((req, res, next) => {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
    if (!/^\/api\/(admin\/(anime|episodes|studios|branding)|reports\/video)/.test(req.originalUrl)) return next();
    const bad = scanUrls(req.body);
    if (bad) {
      logEvent('unsafe_url_blocked', req.secUser?.email || '', req.ip, bad);
      return res.status(400).json({ error: 'Unsafe or invalid URL in field "' + bad + '".' });
    }
    next();
  });
  post.use('/api/admin', async (req, res, next) => {
    if (req.method !== 'DELETE' || !req.secUser) return next();
    const staff = await staffOf(req.secUser.email);
    if (staff && staff.status === 'active' && staff.role !== 'owner' && staff.permissions?.canDelete !== true) {
      logEvent('admin_delete_blocked', req.secUser.email, req.ip, req.originalUrl);
      return res.status(403).json({ error: 'Only the owner can delete. Ask the owner.' });
    }
    next();
  });

  // CSV exports with formula-injection protection (owner/admin only).
  async function ownerOrAdmin(req, res, next) {
    if (!req.secUser) return res.status(401).json({ error: 'Unauthorized' });
    const st = await staffOf(req.secUser.email);
    if (!st || st.status !== 'active' || !['owner', 'admin'].includes(st.role)) return res.status(403).json({ error: 'Staff access required' });
    next();
  }
  const sendCsv = (res, name, header, rows) => res.type('text/csv')
    .set('Content-Disposition', 'attachment; filename="' + name + '"')
    .send([header, ...rows.map((r) => r.map(csvCell).join(','))].join('\n'));
  post.get('/api/admin/users.csv', ownerOrAdmin, async (req, res) => {
    const { rows } = await pool.query("select id,display_name,email,role,created_at from users where role='user' order by created_at desc");
    sendCsv(res, 'users.csv', 'id,display_name,email,role,created_at', rows.map((r) => [r.id, r.display_name, r.email, r.role, r.created_at.toISOString()]));
  });
  post.get('/api/admin/anime.csv', ownerOrAdmin, async (req, res) => {
    const { rows } = await pool.query('select id,title,slug,type,year,status,is_published,poster_url,created_at from anime order by id');
    sendCsv(res, 'anime.csv', 'id,title,slug,type,year,status,is_published,poster_url,created_at',
      rows.map((r) => [r.id, r.title, r.slug, r.type, r.year, r.status, r.is_published, String(r.poster_url || '').startsWith('data:') ? '[embedded image]' : r.poster_url, r.created_at.toISOString()]));
  });

  mountAt(app, pre, (s) => { const i = s.findIndex((l) => l.name === 'expressInit'); return i < 0 ? -1 : i + 1; });
  mountAt(app, post, (s) => s.findIndex((l) => l.route));
  console.log('[security] hardening layer active');
}
