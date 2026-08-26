import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = new URL('../supabase/migrations/20260823143000_add_account_summary_rpc.sql', import.meta.url);
const canonicalProfileRepairPath =
  'supabase/migrations/20260824184939_backfill_missing_auth_user_profiles.sql';

async function readForwardMigration(canonicalPath) {
  let aliases = {};
  try {
    aliases = JSON.parse(
      await readFile(new URL('../.supacharger/migration-aliases.json', import.meta.url), 'utf8'),
    );
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const resolvedPath = aliases[canonicalPath] ?? canonicalPath;
  return {
    adapted: resolvedPath !== canonicalPath,
    sql: await readFile(new URL(`../${resolvedPath}`, import.meta.url), 'utf8'),
  };
}

test('profile repair backfills Auth users that predate the canonical profile triggers', async () => {
  const { adapted, sql } = await readForwardMigration(canonicalProfileRepairPath);

  assert.match(sql, /insert into app\.profiles/i);
  assert.match(sql, /from auth\.users auth_user/i);
  assert.match(sql, /where not exists[\s\S]*from app\.profiles profile/i);
  assert.match(sql, /where profile\.(?:id|profile_id) = auth_user\.id/i);
  assert.match(sql, /on conflict \((?:id|profile_id)\) do nothing/i);
  if (!adapted) assert.match(sql, /null,\s*auth_user\.email/i);
});

test('account summary RPC is authenticated, single-query, and returns storage paths', async () => {
  const sql = await readFile(migration, 'utf8');

  assert.match(sql, /create function api\.get_account_summary_by_current_user\(\)/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = ''/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /auth\.jwt\(\)/i);
  assert.match(sql, /'avatar_path', profile\.avatar_path/i);
  assert.match(sql, /'organisation_count'/i);
  assert.match(sql, /revoke all on function api\.get_account_summary_by_current_user\(\)[\s\S]*from public, anon/i);
  assert.match(sql, /grant execute on function api\.get_account_summary_by_current_user\(\)[\s\S]*to authenticated/i);
  assert.doesNotMatch(sql, /p_[a-z]/i);
  assert.doesNotMatch(sql, /signed_url/i);
});

test('server loader verifies auth once, invokes one summary RPC, and batches signed media', async () => {
  const [loader, media] = await Promise.all([
    readFile(new URL('../src/supacharger/account/account-summary.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/supacharger/media/signed-media.ts', import.meta.url), 'utf8'),
  ]);

  assert.equal((loader.match(/auth\.getUser\(/g) ?? []).length, 1);
  assert.equal((loader.match(/rpc\('get_account_summary_by_current_user'/g) ?? []).length, 1);
  assert.match(loader, /include_organisations: SC_CONFIG\.ORGANISATIONS\.ENABLED/);
  assert.match(loader, /SC_CONFIG\.ORGANISATIONS\.ENABLED \? \[\{/);
  assert.match(loader, /resolveSignedMediaUrls/);
  assert.match(media, /createSignedUrls\(paths, expiresIn\)/);
  assert.doesNotMatch(media, /createSignedUrl\(/);
});

test('menus consume the managed summary hook and the browser contract has one event name', async () => {
  const [menu, contract, events, hook] = await Promise.all([
    readFile(new URL('../src/components/sc_demo/sc_account-menu.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/supacharger/account/account-summary-contract.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/supacharger/account/account-summary-events.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/supacharger/account/use-account-summary.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(menu, /useAccountSummary\(\)/);
  assert.doesNotMatch(menu, /get_account_profile_by_current_user|createSignedUrl|createClient/);
  assert.match(contract, /supacharger:account-summary-changed/);
  assert.match(events, /ACCOUNT_SUMMARY_CHANGED_EVENT/);
  assert.match(hook, /\/api\/account\/summary/);
  assert.match(hook, /addEventListener\(ACCOUNT_SUMMARY_CHANGED_EVENT/);
  assert.match(hook, /let inFlightRequest:/);
  assert.match(hook, /if \(inFlightRequest\) return inFlightRequest/);
  assert.match(hook, /useSyncExternalStore/);
});
