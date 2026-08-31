import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('session transfer uses a 256-bit base64url grant and stores only its SHA-256 digest', async () => {
  const helper = await read('src/supacharger/auth/session-transfer.js');
  assert.match(helper, /SESSION_TRANSFER_TOKEN_BYTES = 32/);
  assert.match(helper, /randomBytes\(SESSION_TRANSFER_TOKEN_BYTES\)\.toString\('base64url'\)/);
  assert.match(helper, /createHash\('sha256'\)/);
  assert.match(helper, /\^\[A-Za-z0-9_-\]\{43\}\$/);
  assert.match(helper, /Buffer\.byteLength\(body, 'utf8'\) > maximumBytes/);
});

test('issue and redeem routes enforce the safe server boundaries', async () => {
  const [issue, redeem] = await Promise.all([
    read('src/app/(supacharger)/api/(supacharger)/auth/session-transfers/route.ts'),
    read('src/app/(supacharger)/api/(supacharger)/auth/session-transfers/redeem/route.ts'),
  ]);
  for (const source of [issue, redeem]) {
    assert.match(source, /safeParse\(body\)/);
    assert.match(source, /isSameOriginSessionTransferRequest/);
    assert.match(source, /sessionTransferResponseHeaders/);
    assert.doesNotMatch(source, /console\.|access_token|refresh_token|action_link|email_otp/);
  }
  assert.match(issue, /supabase\.auth\.getUser\(\)/);
  assert.match(issue, /claims\?\.session_id/);
  assert.match(issue, /getAuthenticatorAssuranceLevel/);
  assert.match(redeem, /generateLink/);
  assert.match(redeem, /hashed_token/);
  assert.match(redeem, /verifyOtp/);
  assert.match(redeem, /verification\.user\?\.id !== claim\.user_id/);
  assert.match(redeem, /receiving_session_conflict/);
  assert.match(redeem, /resolveAuthCallbackSuccess/);
});

test('fragment bootstrap clears the grant before one credentialled POST and prevents analytics', async () => {
  const [bootstrap, helper] = await Promise.all([
    read('src/app/(supacharger)/(unauthenticated)/auth/session-transfer/route.ts'),
    read('src/supacharger/auth/session-transfer.js'),
  ]);
  assert.match(bootstrap, /location\.hash/);
  assert.match(bootstrap, /history\.replaceState/);
  assert.match(bootstrap, /credentials:'same-origin'/);
  assert.match(bootstrap, /\/api\/auth\/session-transfers\/redeem/);
  assert.match(bootstrap, /Content-Security-Policy/);
  assert.match(helper, /Referrer-Policy.*no-referrer/s);
  assert.doesNotMatch(bootstrap, /Analytics|console\./);
});

test('session-transfer English source copy is complete', async () => {
  const messages = JSON.parse(await read('messages/en.json'));
  for (const key of ['title', 'working', 'invalid', 'conflict', 'retry']) {
    assert.equal(typeof messages.SessionTransfer?.[key], 'string');
    assert.ok(messages.SessionTransfer[key].trim().length > 0);
  }
});

test('configuration installs disabled-safe defaults and publicises only bootstrap and redeem', async () => {
  const [contract, config] = await Promise.all([
    read('src/supacharger/supacharger-config-contract.ts'),
    read('src/supacharger.config.ts'),
  ]);
  assert.match(contract, /CROSS_DEVICE_SESSION_TRANSFER/);
  assert.match(contract, /TOKEN_TTL_SECONDS: number/);
  assert.match(config, /CROSS_DEVICE_SESSION_TRANSFER:[\s\S]*?ENABLED: (?:true|false)[\s\S]*?TOKEN_TTL_SECONDS: 120/);
  assert.match(config, /['"]\/auth\/session-transfer['"]/);
  assert.match(config, /['"]\/api\/auth\/session-transfers\/redeem['"]/);
  assert.doesNotMatch(config, /'\/api\/auth\/session-transfers',\s*\/\//);
});

test('migration keeps grants private and claims them atomically', async () => {
  const migration = await read('supabase/migrations/20260831205710_add_auth_session_transfers.sql');
  assert.match(migration, /create table app\.auth_session_transfers/);
  assert.match(migration, /auth_session_transfer_id uuid primary key/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /security definer[\s\S]*?set search_path = ''/);
  assert.match(migration, /update app\.auth_session_transfers as transfer[\s\S]*?consumed_at is null[\s\S]*?returning transfer\.user_id/);
  assert.match(migration, /from auth\.sessions as auth_session/);
  assert.match(migration, /grant execute[\s\S]*?to service_role/);
  assert.doesNotMatch(migration, /grant execute[\s\S]*?to (anon|authenticated)/);
  assert.doesNotMatch(migration, /\bp_[a-z_]+/);
});
