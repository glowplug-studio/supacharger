import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../src/supacharger/profile/${file}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)((name) => {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const source = load('social-avatar-source');
test('provider host boundary rejects arbitrary URLs, credentials and lookalikes', () => {
  for (const url of ['http://lh3.googleusercontent.com/a', 'https://127.0.0.1/a', 'https://lh3.googleusercontent.com.evil.test/a', 'https://user@lh3.googleusercontent.com/a', 'https://lh3.googleusercontent.com:8443/a']) {
    assert.equal(source.allowedSocialAvatarUrl('google', url), null);
  }
  assert.equal(source.allowedSocialAvatarUrl('unknown', 'https://lh3.googleusercontent.com/a'), null);
  assert.ok(source.allowedSocialAvatarUrl('google', 'https://lh3.googleusercontent.com/a'));
});
test('download validates redirect destinations, MIME and streaming byte limit', async () => {
  const original = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } }); };
    await assert.rejects(source.downloadSocialAvatar('google', 'https://lh3.googleusercontent.com/a'));
    assert.equal(calls, 1);
    globalThis.fetch = async () => new Response('markup', { headers: { 'content-type': 'text/html' } });
    await assert.rejects(source.downloadSocialAvatar('google', 'https://lh3.googleusercontent.com/a'));
    globalThis.fetch = async () => new Response(new Uint8Array(5 * 1024 * 1024 + 1), { headers: { 'content-type': 'image/png' } });
    await assert.rejects(source.downloadSocialAvatar('google', 'https://lh3.googleusercontent.com/a'));
    globalThis.fetch = async () => new Response(new Uint8Array([1, 2]), { headers: { 'content-type': 'image/png' } });
    const file = await source.downloadSocialAvatar('google', 'https://lh3.googleusercontent.com/a');
    assert.equal(file.size, 2); // Actual decoding belongs to process-image-upload-v2.
  } finally { globalThis.fetch = original; }
});
test('failed or conflicting picture imports do not block sign-in or overwrite profiles', async () => {
  for (const outcome of ['failure', 'conflict', 'success', 'uncertain', 'already-imported']) {
    const calls = [];
    const supabase = {
      schema: () => ({ rpc: async (name, args) => {
        calls.push([name, args]);
        return name.startsWith('initialise')
          ? { data: outcome === 'already-imported' ? null : { provider: 'google', avatar_url: 'https://lh3.googleusercontent.com/a' } }
          : { data: outcome === 'success', error: outcome === 'uncertain' ? new Error('Response lost') : null };
      } }),
      functions: { invoke: async () => { calls.push(['upload']); return { data: { bucket: 'user-avatars', path: 'user/avatar-test.jpg' } }; } },
      storage: { from: () => ({ remove: async (paths) => calls.push(['remove', paths]) }) },
    };
    const { initialiseSocialProfile } = load('initialise-social-profile', {
      '@/supacharger/supacharger-config': { SC_CONFIG: { PROFILE_IDENTITY: { AVATAR: 'optional' } } },
      '@/supacharger/media/authorise-image-upload': { authoriseImageUpload: async () => ({ permit: 'test-permit', signature: 'test-signature' }) },
      '../../../supabase/functions/process-image-upload-v2/permit-crypto': { imageSha256: async () => 'a'.repeat(64) },
      './social-avatar-source': { ...source, downloadSocialAvatar: async () => {
        if (outcome === 'failure') throw new Error('Download failed');
        return new File(['bytes'], 'test.png', { type: 'image/png' });
      } },
    });
    await assert.doesNotReject(initialiseSocialProfile(supabase, 'user'));
    assert.equal(calls.some(([name]) => name === 'upload'), ['conflict', 'success', 'uncertain'].includes(outcome));
    assert.equal(calls.some(([name]) => name === 'remove'), outcome === 'conflict');
  }
});

test('username allocation follows identity policy, independently of onboarding', async () => {
  for (const policy of ['disabled', 'optional', 'required']) {
    for (const required of [false, true]) {
      const calls = [];
      const { initialiseAccountUsername } = load('initialise-account-username', {
        '@/supacharger/supacharger-config': { SC_CONFIG: {
          PROFILE_IDENTITY: { USERNAME: policy }, POST_SIGN_IN_ONBOARDING: { REQUIRED: required },
        } },
      });
      await initialiseAccountUsername({ schema: () => ({ rpc: async (name) => { calls.push(name); return { error: null }; } }) });
      assert.deepEqual(calls, policy === 'disabled' ? [] : ['initialise_account_username_by_current_user']);
    }
  }
});
