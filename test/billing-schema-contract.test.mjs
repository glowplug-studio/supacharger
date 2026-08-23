import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const migrationsDirectory = new URL('../supabase/migrations/', import.meta.url);
const migrationSources = readdirSync(migrationsDirectory)
  .filter((fileName) => fileName.endsWith('.sql'))
  .sort()
  .map((fileName) => readFileSync(new URL(fileName, migrationsDirectory), 'utf8'));
const migrations = migrationSources.join('\n');
const generatedTypes = readFileSync(new URL('../src/lib/supabase/types.ts', import.meta.url), 'utf8');
const billingAccessRepairMigration = migrationSources
  .toReversed()
  .find(
    (source) =>
      /api\.has_billing_access_by_current_user\(\s*input_feature_lookup_key text default null\s*\)/.test(
        source,
      ) && /entitlement\.feature_lookup_key = \$1/.test(source),
  );

test('uses an unambiguous Stripe customer mapping table and local key', () => {
  assert.match(migrations, /alter table app\.stripe_customers rename to stripe_customer_mappings;/);
  assert.match(migrations, /rename column id to stripe_customer_mapping_id;/);
  assert.match(migrations, /stripe_customer_mappings_account_mode_key/);
  assert.match(migrations, /stripe_customer_mappings_external_customer_key/);
  assert.match(migrations, /stripe_customer_mappings_billing_account_idx/);

  assert.match(generatedTypes, /stripe_customer_mappings: \{/);
  assert.match(generatedTypes, /stripe_customer_mapping_id: string/);
  assert.doesNotMatch(generatedTypes, /stripe_customers: \{/);
});

test('renames exposed RPC arguments while preserving service-only grants', () => {
  assert.match(migrations, /rpc_argument_rename_grants/);
  assert.match(migrations, /revoke all on function/);
  assert.match(migrations, /grant %s on function/);
  assert.doesNotMatch(generatedTypes.slice(0, generatedTypes.indexOf('\n  app: {')), /\bp_[a-zA-Z0-9_]+/);
  assert.match(generatedTypes, /billing_get_account_by_customer:[\s\S]*?stripe_customer_id: string/);
  assert.match(generatedTypes, /billing_put_customer_for_account:[\s\S]*?billing_account_id: string/);
  assert.match(
    migrations,
    /revoke all on function api_edge\.billing_get_account_by_customer\(text\)\s+from public, anon, authenticated;/,
  );
  assert.match(
    migrations,
    /grant execute on function api_edge\.billing_get_account_by_customer\(text\)\s+to service_role;/,
  );
});

test('keeps the billing access argument distinct from the entitlement column', () => {
  assert.ok(billingAccessRepairMigration, 'expected a feature-scoped billing-access repair migration');
  assert.match(
    billingAccessRepairMigration,
    /api\.has_billing_access_by_current_user\(\s*input_feature_lookup_key text default null\s*\)/,
  );
  assert.match(billingAccessRepairMigration, /entitlement\.feature_lookup_key = \$1/);
  assert.doesNotMatch(billingAccessRepairMigration, /\.input_feature_lookup_key/);
});
