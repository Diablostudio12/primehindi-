import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { badUrl, scanUrls, passwordProblem, csvCell, emailOk, safeEqual } from '../src/security-helpers.js';

test('dangerous URL schemes are rejected, normal ones allowed', () => {
  assert.equal(badUrl('videoUrl', 'javascript:alert(1)'), true);
  assert.equal(badUrl('videoUrl', '__PDI_CUSTOM__:java\nscript:alert(1)'), true);
  assert.equal(badUrl('posterUrl', 'data:text/html;base64,AAAA'), true);
  assert.equal(badUrl('posterUrl', 'data:image/svg+xml;base64,AAAA'), true);
  assert.equal(badUrl('videoUrl', 'data:image/png;base64,AAAA'), true);
  assert.equal(badUrl('posterUrl', 'data:image/webp;base64,AAAA'), false);
  assert.equal(badUrl('audioSampleUrl', 'data:audio/mpeg;base64,AAAA'), false);
  assert.equal(badUrl('videoUrl', '__PDI_PROVIDER__:https://example.com/v.mp4'), false);
  assert.equal(badUrl('posterUrl', '/assets/logo.jpg'), false);
});

test('scanUrls finds bad nested fields', () => {
  assert.equal(scanUrls({ title: 'x', voiceCast: [{ image: 'javascript:1' }] }), 'image');
  assert.equal(scanUrls({ posterUrl: 'https://a.b/c.png', title: 'javascript:fine' }), null);
});

test('password policy', () => {
  assert.ok(passwordProblem('short1'));
  assert.ok(passwordProblem('aaaaaaaaaaaa'));
  assert.ok(passwordProblem('password123'));
  assert.ok(passwordProblem('johnsmith99x', 'johnsmith@x.com'));
  assert.equal(passwordProblem('Tr0ub4dor&3xyz', 'a@b.com'), null);
});

test('csv cells escape quotes and formulas', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('plain'), '"plain"');
  assert.equal(csvCell(null), '""');
});

test('email and compare helpers', () => {
  assert.equal(emailOk('a@b.co'), true);
  assert.equal(emailOk('nope'), false);
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
});

test('start.js loads the security layer', async () => {
  const src = await readFile(new URL('../src/start.js', import.meta.url), 'utf8');
  assert.match(src, /registerSecurity\(this\)/);
});
