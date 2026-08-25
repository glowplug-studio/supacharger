import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function collectRouteSegments(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectRouteSegments(path);
    return entry.name === 'page.tsx' || entry.name === 'layout.tsx' ? [path] : [];
  });
}

test('request-time auth route segments choose an explicit Next 16 rendering boundary', () => {
  const requestTimeAuth = /requireVerifiedUser\(|auth\.getUser\(|auth\.getClaims\(|isLoggedIn\(|createClient\(\)/;

  for (const path of collectRouteSegments('src/app')) {
    const source = readFileSync(path, 'utf8');
    if (!requestTimeAuth.test(source) || /^["']use client["'];/m.test(source)) continue;

    const blocksExplicitly = /export const instant = false;/.test(source);
    const streamsExplicitly = /<Suspense(?:\s|>)/.test(source);
    assert.ok(
      blocksExplicitly || streamsExplicitly,
      `${path} reads request-time auth without instant=false or a Suspense boundary`,
    );
  }
});
