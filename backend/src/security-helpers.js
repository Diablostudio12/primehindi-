// Pure helpers used by security.js (no external dependencies so they can be unit-tested).
import crypto from 'node:crypto';

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
export const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
export const emailOk = (e) => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const COMMON = new Set([
  'password', 'password1', 'password123', '1234567890', '12345678910', '0123456789', '9876543210',
  'qwertyuiop', '1q2w3e4r5t', 'iloveyou12', 'letmein123', 'admin12345', 'welcome123', 'abcd123456',
  'passw0rd123', 'qwerty12345', 'changeme123'
]);

export function passwordProblem(password, email = '') {
  const p = String(password || '');
  if (p.length < 10) return 'Password must be at least 10 characters long.';
  if (p.length > 128) return 'Password must be 128 characters or fewer.';
  if (/^(.)\1+$/.test(p)) return 'Choose a less repetitive password.';
  const local = String(email).split('@')[0].toLowerCase();
  if (local.length >= 4 && p.toLowerCase().includes(local)) return 'Password must not contain your email name.';
  if (COMMON.has(p.toLowerCase())) return 'That password is too common. Choose a stronger one.';
  return null;
}

const URL_KEY = /(url|urltemplate|image|poster|banner|thumbnail|logo|avatar|src)$/i;

// True when a URL-like value uses a dangerous scheme (javascript:, data:text/html, file:, ...).
export function badUrl(key, value) {
  let v = String(value).replace(/^__PDI_(?:PROVIDER|CUSTOM)__:/, '');
  v = v.replace(/[\u0000-\u0020\u007f-\u009f]+/g, '').toLowerCase();
  if (/^(javascript|vbscript|file|blob|about):/.test(v)) return true;
  if (v.startsWith('data:')) {
    if (/image|poster|banner|thumbnail|logo|avatar/i.test(key) && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(v)) return false;
    if (/audio/i.test(key) && /^data:audio\/[a-z0-9.+-]+;base64,/.test(v)) return false;
    return true;
  }
  return false;
}

// Returns the first offending field name in a request body, or null.
export function scanUrls(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return null;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && URL_KEY.test(k) && badUrl(k, v)) return k;
    if (v && typeof v === 'object') {
      const r = scanUrls(v, depth + 1);
      if (r) return r;
    }
  }
  return null;
}

// CSV cell with quote escaping and spreadsheet formula-injection protection.
export function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
