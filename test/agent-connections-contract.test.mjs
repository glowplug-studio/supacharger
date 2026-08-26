import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

function literalClassTokens(source) {
  return [...source.matchAll(/className=['"]([^'"]+)['"]/g)].flatMap((match) => match[1].split(/\s+/));
}

test('installs a generic least-privilege agent database boundary', async () => {
  const migration = await read('supabase/migrations/20260826050719_add_agent_connections.sql');

  assert.match(migration, /create role supacharger_agent nologin noinherit/i);
  assert.match(migration, /create table app\.agent_connections/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /grant execute on function app\.resolve_agent_connections\(\)[\s\S]*to supacharger_agent/i);
  assert.match(migration, /revoke all on function api\.agent_connections\(jsonb\)[\s\S]*supacharger_agent/i);
  assert.match(migration, /connection\.oauth_client_id = nullif\(\(select auth\.jwt\(\)\) ->> 'client_id'/i);
  assert.match(migration, /connection\.authorised_user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /app\.agent_connections_enabled\(\)/i);
  const tableDefinition = migration.match(/create table app\.agent_connections \([\s\S]*?\n\);/i)?.[0] ?? '';
  assert.doesNotMatch(tableDefinition, /access_token|refresh_token/i);
});

test('OAuth claims use the generic role and do not inherit human organisation authority', async () => {
  const migration = await read('supabase/migrations/20260826050719_add_agent_connections.sql');

  assert.match(migration, /claims ->> 'client_id'/);
  assert.match(migration, /jsonb_set\(claims, '\{role\}', to_jsonb\('supacharger_agent'/);
  assert.match(migration, /- 'user_role'/);
  assert.match(migration, /- 'active_organisation_id'/);
  assert.match(migration, /to supabase_auth_admin/);
});

test('managed consent and settings expose only semantic external CSS hooks', async () => {
  const sources = await Promise.all([
    read('src/supacharger/agents/agent-oauth-consent.tsx'),
    read('src/supacharger/agents/agent-connections-panel.tsx'),
  ]);
  const tokens = sources.flatMap(literalClassTokens);
  assert.ok(tokens.length > 0);
  assert.deepEqual(tokens.filter((token) => !token.startsWith('sc-agent-')), []);

  const styles = await read('src/styles/supacharger-agents.css');
  for (const token of new Set(tokens)) assert.match(styles, new RegExp(`\\.${token}\\b`));
  assert.match(styles, /@apply/);
  assert.doesNotMatch(styles, /@layer/);
});

test('consent creates product binding before approval and compensates on failure', async () => {
  const source = await read('src/supacharger/agents/agent-oauth-consent.tsx');
  const createPosition = source.indexOf('createAgentConnection');
  const approvePosition = source.indexOf('approveAuthorization');
  const revokePosition = source.indexOf("mutateAgentConnection(supabase, 'revoke'");
  const deletePosition = source.indexOf("mutateAgentConnection(supabase, 'delete'");

  assert.ok(createPosition >= 0);
  assert.ok(approvePosition > createPosition);
  assert.ok(revokePosition > approvePosition);
  assert.ok(deletePosition > revokePosition);
  assert.match(source, /AgentConsentExtension/);
  assert.match(source, /organisationListSchema\.parse/);
});

test('own revocation invalidates Supabase grants after immediate application revocation', async () => {
  const source = await read('src/supacharger/agents/agent-connections-panel.tsx');
  const databasePosition = source.indexOf('mutateAgentConnection');
  const authPosition = source.indexOf('oauth.revokeGrant');

  assert.ok(databasePosition >= 0);
  assert.ok(authPosition > databasePosition);
  assert.match(source, /connection\.isOwn/);
  assert.match(source, /revokedGrantPending/);
});

test('configuration gates every managed agent route and supplies complete English copy', async () => {
  const [contract, config, consentRoute, accountRoute, organisationRoute, englishSource] = await Promise.all([
    read('src/supacharger/supacharger-config-contract.ts'),
    read('src/supacharger.config.ts'),
    read('src/app/(supacharger)/auth/oauth/consent/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/account/agents/page.tsx'),
    read('src/app/(supacharger)/(authenticated)/[handle]/settings/agents/page.tsx'),
    read('messages/en.json'),
  ]);
  const english = JSON.parse(englishSource);

  assert.match(contract, /AGENT_CONNECTIONS/);
  assert.match(config, /AGENT_CONNECTIONS:\s*\{\s*ENABLED: false/s);
  for (const source of [consentRoute, accountRoute, organisationRoute]) {
    assert.match(source, /SC_CONFIG\.AGENT_CONNECTIONS\.ENABLED/);
    assert.match(source, /notFound\(\)/);
  }
  assert.ok(english.AgentConnections.consent.title.trim());
  assert.ok(english.AgentConnections.revokedGrantPending.trim());
});

test('organisation routing redirects only genuine access outcomes', async () => {
  const service = await read('src/supacharger/organisations/organisation-service.ts');

  assert.match(service, /code === 'P0002' \|\| code === '42501'/);
  assert.match(service, /throw error/);
  assert.doesNotMatch(service, /catch \{\s*redirect/s);
});
