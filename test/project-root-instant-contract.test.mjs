import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('the auth-dependent root page explicitly allows blocking navigation', () => {
  const page = readFileSync('src/app/page.tsx', 'utf8');

  assert.match(page, /import \{ isLoggedIn \}/);
  assert.match(page, /export const instant = false;/);
});
