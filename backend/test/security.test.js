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

test('admin login requires a configured MFA passcode', () => {
  assert.match(source, /Admin MFA is not configured/);
  assert.match(source, /String\(mfaCode\s*\|\|\s*''\)\s*!==\s*String\(process\.env\.ADMIN_MFA_CODE\)/);
});

test('request body size is bounded and safe errors are returned', () => {
  assert.match(source, /express\.json\(\{limit:'8mb', strict:true\}\)/);
  assert.match(source, /Internal server error/);
});
