import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/server.js', import.meta.url), 'utf8');

test('backend does not use a fallback JWT signing secret', () => {
  assert.match(source, /const JWT_SECRET=process\.env\.JWT_SECRET;/);
  assert.match(source, /JWT_SECRET must be configured/);
  assert.doesNotMatch(source, /JWT_SECRET=process\.env\.JWT_SECRET\s*\|\|\s*['"]change-me['"]/);
});

test('security middleware and request throttling are enabled', () => {
  assert.match(source, /app\.use\(helmet\(/);
  assert.match(source, /app\.use\(cors\(/);
  assert.match(source, /app\.use\('\/api', apiLimiter\)/);
  assert.match(source, /authLimiter/);
});

test('admin MFA is enforced when a passcode is configured and remains optional otherwise', () => {
  assert.match(source, /process\.env\.ADMIN_MFA_CODE/);
  assert.match(source, /String\(mfaCode\s*\|\|\s*''\)\s*!==\s*String\(process\.env\.ADMIN_MFA_CODE\)/);
  assert.match(source, /Admin MFA is optional unless ADMIN_MFA_CODE is explicitly configured/);
});

test('request body size is bounded and safe errors are returned', () => {
  assert.match(source, /express\.json\(\{limit:'8mb', strict:true\}\)/);
  assert.match(source, /Internal server error/);
});

test('admin user list and CSV export exclude admin accounts', () => {
  assert.match(source, /from users where role='user'/);
  assert.match(source, /from users where role='user' order by created_at desc/);
  assert.match(source, /app\.get\('\/api\/admin\/users\.csv',admin/);
});

test('comments are pending by default and public API returns approved comments only', () => {
  assert.match(source, /insert into comments\(user_id,anime_id,content,status\) values\(\$1,\$2,\$3,'pending'\)/);
  assert.match(source, /where a\.slug=\$1 and c\.status='approved'/);
  assert.match(source, /app\.patch\('\/api\/admin\/comments\/:id',admin/);
});

test('notifications support selected recipients, categories, and read state', () => {
  assert.match(source, /req\.body\.userIds/);
  assert.match(source, /notification_type/);
  assert.match(source, /CREATE TABLE IF NOT EXISTS notification_reads/);
  assert.match(source, /app\.patch\('\/api\/notifications\/:id\/read',auth/);
});
