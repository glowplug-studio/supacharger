import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

const canonicalOrganisationMigration = 'supabase/migrations/20260824100000_add_organisation_management.sql';
const canonicalOrganisationMigrationUrl = new URL(`../${canonicalOrganisationMigration}`, import.meta.url);
let organisationMigrationUrl = canonicalOrganisationMigrationUrl;
if (!existsSync(canonicalOrganisationMigrationUrl)) {
  const aliases = JSON.parse(
    readFileSync(new URL('../.supacharger/migration-aliases.json', import.meta.url), 'utf8'),
  );
  assert.equal(typeof aliases[canonicalOrganisationMigration], 'string');
  organisationMigrationUrl = new URL(`../${aliases[canonicalOrganisationMigration]}`, import.meta.url);
}
const migration = readFileSync(organisationMigrationUrl, 'utf8');
const migrationsDirectory = new URL('../supabase/migrations/', import.meta.url);
const migrationLedger = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => readFileSync(new URL(file, migrationsDirectory), 'utf8'))
  .join('\n');
const storagePolicyIsolationMigrationName = readdirSync(migrationsDirectory).find((file) =>
  file.endsWith('_isolate_organisation_logo_storage_policies.sql'),
);
assert.equal(typeof storagePolicyIsolationMigrationName, 'string');
const storagePolicyIsolationMigration = readFileSync(
  new URL(storagePolicyIsolationMigrationName, migrationsDirectory),
  'utf8',
);
const types = readFileSync(new URL('../src/lib/supabase/types.ts', import.meta.url), 'utf8');
const organisationContract = readFileSync(
  new URL('../src/supacharger/organisations/organisation-contract.ts', import.meta.url),
  'utf8',
);
const bruno = readFileSync(
  new URL('../docs/bruno/supacharger-rpc/organisations.bru', import.meta.url),
  'utf8',
);

test('installs the complete organisation management foundation', () => {
  assert.match(migrationLedger, /create table(?: if not exists)? app\.organisation_invitations/i);
  assert.match(migrationLedger, /create table(?: if not exists)? app\.organisation_access_requests/i);
  assert.match(migrationLedger, /'organisation-logos'[\s\S]*?5242880/i);
  assert.match(migrationLedger, /organisation_logos_select_(?:members|org_members)/i);
  assert.match(migrationLedger, /organisation_logos_insert_(?:managers|org_admins)/i);
  assert.match(migrationLedger, /organisation_logos_update_(?:managers|org_admins)/i);
  assert.match(migrationLedger, /organisation_logos_delete_(?:managers|org_admins)/i);
  assert.match(migrationLedger, /(?:bind|ensure)_organisation_billing_account/i);
});

test('keeps organisation media policies isolated from unrelated storage buckets', () => {
  assert.doesNotMatch(storagePolicyIsolationMigration, /from app\.organisations/i);
  assert.match(storagePolicyIsolationMigration, /case[\s\S]*?storage\.foldername\([^)]*name[^)]*\)[\s\S]*?::uuid/i);
  assert.match(storagePolicyIsolationMigration, /(?:app\.is_organisation_member|authz\.is_org_member)/i);
  assert.match(storagePolicyIsolationMigration, /(?:app\.can_manage_organisation|authz\.can_manage_org)/i);
});

test('protects invitations, ownership, membership, and session context', () => {
  assert.match(migrationLedger, /extensions\.digest\(invitation_token, 'sha256'\)/i);
  assert.match(migrationLedger, /Invitation not found, expired, revoked, or already used/i);
  assert.match(migrationLedger, /Cannot demote the last owner/i);
  assert.match(migrationLedger, /Cannot remove the last owner/i);
  assert.match(migrationLedger, /(?:context_version|org_context_version) = context\.(?:context_version|org_context_version) \+ 1/i);
  assert.match(migrationLedger, /delete from app\.user_session_contexts context/i);
  assert.match(migrationLedger, /access_policy = 'request'/i);
});

test('keeps generated types and Bruno aligned with the organisation contract', () => {
  assert.match(types, /organisation_access_requests: \{/);
  assert.match(types, /organisation_invitations: \{/);
  assert.match(types, /organisation_access_policy: "closed" \| "request"/);
  assert.match(types, /organisation_role: "owner" \| "admin" \| "(?:member|contributor)"/);
  assert.match(organisationContract, /organisationRoleSchema = z\.enum\(\['owner', 'admin', 'member'\]\)/);
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
