import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

import { createClient } from '@supabase/supabase-js';

const { outputText } = ts.transpileModule(
  readFileSync(new URL('../src/supacharger/media/image-upload-transport.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
);
const loaded = { exports: {} };
new Function('module', 'exports', outputText)(loaded, loaded.exports);
const { imageUploadFetch, trackImageUpload } = loaded.exports;

class UploadRequest {
  static requests = [];
  upload = {};
  headers = new Headers();
  status = 200;
  statusText = 'OK';
  responseText = '{"path":"user/image.jpg"}';
  constructor() { UploadRequest.requests.push(this); }
  open(method, url) { this.method = method; this.url = url; }
  setRequestHeader(name, value) { this.headers.set(name, value); }
  getAllResponseHeaders() { return 'content-type: application/json\r\nx-request-id: preserved'; }
  send(body) { this.body = body; }
  abort() { this.onabort(); }
}

test('SDK invocation preserves user JWT, API key, multipart, response and measured stages', async () => {
  globalThis.XMLHttpRequest = UploadRequest;
  const phases = [];
  const body = new FormData();
  body.set('file', new Blob(['source']));
  body.set('permit', 'signed-permit');
  body.set('signature', 'signature');
  const stop = trackImageUpload(body, (progress) => phases.push(progress));
  const client = createClient('https://test.supabase.co', 'sb_publishable_test', {
    accessToken: async () => 'authenticated-user-jwt', global: { fetch: imageUploadFetch },
  });
  const pending = client.functions.invoke('sc_process_image_upload', { body });
  await new Promise((resolve) => setImmediate(resolve));
  const xhr = UploadRequest.requests.at(-1);
  assert.equal(xhr.headers.get('authorization'), 'Bearer authenticated-user-jwt');
  assert.equal(xhr.headers.get('apikey'), 'sb_publishable_test');
  assert.equal(xhr.headers.get('content-type'), null);
  assert.equal(xhr.body, body);
  xhr.upload.onprogress({ loaded: 40, total: 100, lengthComputable: true });
  assert.deepEqual(phases.at(-1), { phase: 'uploading', loaded: 40, total: 100, percent: 40 });
  xhr.upload.onload();
  assert.deepEqual(phases.at(-1), { phase: 'processing' });
  xhr.onload();
  const result = await pending;
  assert.equal(result.error, null);
  assert.equal(result.data.path, 'user/image.jpg');
  assert.equal(result.response.headers.get('x-request-id'), 'preserved');
  stop();
  delete globalThis.XMLHttpRequest;
});

test('unregistered and untracked requests use fetch unchanged', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (...args) => { calls.push(args); return new Response('normal'); };
  try {
    const body = new FormData();
    const stop = trackImageUpload(body, () => assert.fail('unregistered callback'));
    stop();
    const init = { method: 'POST', body };
    assert.equal(await (await imageUploadFetch('https://test.invalid', init)).text(), 'normal');
    assert.deepEqual(calls, [['https://test.invalid', init]]);
  } finally { globalThis.fetch = original; }
});

test('unknown byte totals stay indeterminate and network/abort/timeout reject', async () => {
  globalThis.XMLHttpRequest = UploadRequest;
  try {
    for (const event of ['onerror', 'onabort', 'ontimeout']) {
      const body = new FormData();
      const progress = [];
      const stop = trackImageUpload(body, (value) => progress.push(value));
      const pending = imageUploadFetch('https://test.invalid', { body });
      const xhr = UploadRequest.requests.at(-1);
      xhr.upload.onprogress({ loaded: 20, total: 0, lengthComputable: false });
      assert.deepEqual(progress.at(-1), { phase: 'uploading', loaded: 20 });
      xhr[event]();
      await assert.rejects(pending);
      stop();
    }
    const body = new FormData();
    const stop = trackImageUpload(body, () => {});
    const controller = new AbortController();
    const pending = imageUploadFetch('https://test.invalid', { body, signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    stop();
  } finally { delete globalThis.XMLHttpRequest; }
});

test('non-success HTTP responses retain SDK error semantics', async () => {
  globalThis.XMLHttpRequest = UploadRequest;
  const body = new FormData();
  const stop = trackImageUpload(body, () => {});
  try {
    const client = createClient('https://test.supabase.co', 'sb_publishable_test', {
      accessToken: async () => 'jwt', global: { fetch: imageUploadFetch },
    });
    const pending = client.functions.invoke('sc_process_image_upload', { body });
    await new Promise((resolve) => setImmediate(resolve));
    const xhr = UploadRequest.requests.at(-1);
    xhr.status = 403;
    xhr.statusText = 'Forbidden';
    xhr.responseText = '{"error":"Invalid permit"}';
    xhr.onload();
    const result = await pending;
    assert.equal(result.error.name, 'FunctionsHttpError');
    assert.equal(result.response.status, 403);
    assert.equal((await result.error.context.json()).error, 'Invalid permit');
  } finally { stop(); delete globalThis.XMLHttpRequest; }
});
