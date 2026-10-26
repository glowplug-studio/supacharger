import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { createElement, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { outputText } = ts.transpileModule(
  readFileSync(new URL('../src/lib/supabase/client.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
);
const module = { exports: {} };
new Function('require', 'module', 'exports', outputText)((name) => {
  if (name === '@/supacharger/utils/helpers') return {
    getSupabaseUrl: () => typeof window === 'undefined' ? 'https://render.supabase.co' : 'https://test.supabase.co',
    getSupabasePublishableKey: () => 'test-key',
  };
  return require(name);
}, module, module.exports);
const { createClient } = module.exports;

test('Client Components can initialise Supabase during server rendering without sharing sessions', async () => {
  const clients = [];
  function Provider() {
    const client = useMemo(() => createClient(), []);
    clients.push(client);
    return createElement('span', null, 'Rendered');
  }
  assert.equal(renderToString(createElement(Provider)), '<span>Rendered</span>');
  assert.equal(renderToString(createElement(Provider)), '<span>Rendered</span>');
  assert.notEqual(clients[0], clients[1]);
  for (const client of clients) {
    const { data, error } = await client.auth.getSession();
    assert.equal(error, null);
    assert.equal(data.session, null);
  }
});

test('browser clients retain token-only cookie storage, separate user storage and singleton reuse', async () => {
  const cookies = new Map();
  const localValues = new Map();
  const document = {
    visibilityState: 'hidden',
    get cookie() { return [...cookies].map(([key, value]) => `${key}=${value}`).join('; '); },
    set cookie(value) {
      const [pair] = value.split(';');
      const split = pair.indexOf('=');
      cookies.set(pair.slice(0, split), pair.slice(split + 1));
    },
  };
  const localStorage = {
    getItem: (key) => localValues.get(key) ?? null,
    setItem: (key, value) => localValues.set(key, value),
    removeItem: (key) => localValues.delete(key),
  };
  globalThis.document = document;
  globalThis.window = { document, localStorage, addEventListener() {}, removeEventListener() {} };
  let client;
  try {
    client = createClient();
    assert.equal(createClient(), client);
    await client.auth.initialize();
    assert.equal(client.auth.userStorage, localStorage);
    const session = { access_token: 'test-token', refresh_token: 'test-refresh', user: { id: 'test-user' } };
    client.auth.fetch = async () => new Response(JSON.stringify({ ...session, expires_in: 3600, token_type: 'bearer' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const result = await client.auth.signInWithPassword({ email: 'test@example.com', password: 'test-only' });
    assert.equal(result.error, null);
    assert.deepEqual(JSON.parse(localStorage.getItem('sb-test-auth-token-user')), { user: session.user });
    const stored = JSON.parse(await client.auth.storage.getItem('sb-test-auth-token'));
    assert.equal(stored.access_token, session.access_token);
    assert.equal(stored.refresh_token, session.refresh_token);
    assert.equal(stored.user, undefined);
    assert.ok([...cookies.keys()].some((key) => key.startsWith('sb-test-auth-token')));
  } finally {
    await client?.auth.stopAutoRefresh();
    client?.auth.broadcastChannel?.close();
    delete globalThis.window;
    delete globalThis.document;
  }
});
