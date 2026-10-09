// Entry point: loads the existing server unchanged and hooks the Studios routes
// in just before it starts listening (all earlier middleware stays in effect).
import express from 'express';
import pg from 'pg';
import { registerStudios } from './studios.js';

// The built-in demo catalog used to be re-inserted on every start, so demo anime
// deleted from the admin panel kept coming back. Skip only that exact seed insert.
const originalQuery = pg.Pool.prototype.query;
pg.Pool.prototype.query = function patchedQuery(config, ...rest) {
  const sql = typeof config === 'string' ? config : config && config.text;
  if (
    typeof sql === 'string' &&
    sql.startsWith('INSERT INTO anime(title,alt_title,slug,description,poster_url,banner_url') &&
    sql.includes('ON CONFLICT(slug) DO NOTHING') &&
    JSON.stringify(rest[0] || []).includes('legacyEpisodes')
  ) {
    return Promise.resolve({ rows: [], rowCount: 0 });
  }
  return originalQuery.call(this, config, ...rest);
};

const originalListen = express.application.listen;
express.application.listen = function patchedListen(...args) {
  express.application.listen = originalListen;
  try {
    registerStudios(this);
  } catch (e) {
    console.error('Studios feature failed to load:', e.message);
  }
  return originalListen.apply(this, args);
};

await import('./server.js');
