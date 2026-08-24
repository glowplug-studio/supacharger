import assert from 'node:assert/strict';
import { readdirSync,readFileSync } from 'node:fs';
import test from 'node:test';

const claimsExtensionMigration = new URL(
  '../supabase/migrations/20260824130917_add_custom_claims_extension_contract.sql',
  import.meta.url,
);

test('custom claims have a protected developer extension seam', () => {
  const sql = readFileSync(claimsExtensionMigration, 'utf8');

  assert.match(sql, /app\.custom_access_token_claims_extension\(jsonb, jsonb\)/i);
  assert.match(sql, /security invoker/i);
  assert.match(sql, /to supabase_auth_admin/i);
  assert.match(sql, /from public, anon, authenticated, service_role/i);
  assert.match(sql, /custom claim name .* is reserved/i);
  assert.match(sql, /claims := claims \|\| extension_claims/i);
});

const migrationsDirectory = new URL('../supabase/migrations/', import.meta.url);
const organisationMigrations = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith('_add_organisation_management.sql'));
assert.equal(organisationMigrations.length, 1, 'expected one immutable organisation-management migration');
const migration = readFileSync(new URL(organisationMigrations[0], migrationsDirectory), 'utf8');
const types = readFileSync(new URL('../src/lib/supabase/types.ts', import.meta.url), 'utf8');
const bruno = readFileSync(
  new URL('../docs/bruno/supacharger-rpc/organisations.bru', import.meta.url),
  'utf8',
);

test('installs the complete organisation management foundation', () => {
  assert.match(migration, /create table app\.organisation_invitations/i);
  assert.match(migration, /create table app\.organisation_access_requests/i);
  assert.match(migration, /'organisation-logos'[\s\S]*?5242880/i);
  assert.match(migration, /organisation_logos_select_members/i);
  assert.match(migration, /organisation_logos_insert_managers/i);
  assert.match(migration, /organisation_logos_update_managers/i);
  assert.match(migration, /organisation_logos_delete_managers/i);
  assert.match(migration, /bind_organisation_billing_account/i);
});

test('protects invitations, ownership, membership, and session context', () => {
  assert.match(migration, /extensions\.digest\(invitation_token, 'sha256'\)/i);
  assert.match(migration, /Invitation not found, expired, revoked, or already used/i);
  assert.match(migration, /Cannot demote the last owner/i);
  assert.match(migration, /Cannot remove the last owner/i);
  assert.match(migration, /context_version = context\.context_version \+ 1/i);
  assert.match(migration, /delete from app\.user_session_contexts context/i);
  assert.match(migration, /access_policy = 'request'/i);
});

test('keeps generated types and Bruno aligned with the organisation contract', () => {
  assert.match(types, /organisation_access_requests: \{/);
  assert.match(types, /organisation_invitations: \{/);
  assert.match(types, /organisation_access_policy: "closed" \| "request"/);
  assert.match(types, /organisation_role: "owner" \| "admin" \| "member"/);
  for (const action of [
    'list',
    'create',
    'switch',
    'read',
    'update',
    'members.add',
    'members.updateRole',
    'members.remove',
    'invites.create',
    'invites.accept',
    'invites.revoke',
    'access.request',
    'access.approve',
    'access.reject',
  ]) {
    assert.match(bruno, new RegExp(action.replace('.', '\\.'), 'i'));
  }
});

test('does not expose legacy p_-prefixed organisation arguments', () => {
  const exposedDefinitions = [...migration.matchAll(/create(?: or replace)? function (?:api|api_edge)\.[\s\S]*?\$\$;/gi)]
    .map((match) => match[0])
    .join('\n');
  assert.doesNotMatch(exposedDefinitions, /\bp_[a-zA-Z0-9_]+/);
});
