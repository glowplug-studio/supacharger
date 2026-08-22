import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/20260820192834_rename_stripe_customer_mapping_table.sql', import.meta.url),
  'utf8',
);
const generatedTypes = readFileSync(new URL('../src/lib/supabase/types.ts', import.meta.url), 'utf8');
const argumentRenameMigration = readFileSync(
  new URL('../supabase/migrations/20260822110057_remove_p_prefix_from_exposed_rpc_arguments.sql', import.meta.url),
  'utf8',
);

test('uses an unambiguous Stripe customer mapping table and local key', () => {
  assert.match(migration, /alter table app\.stripe_customers rename to stripe_customer_mappings;/);
  assert.match(migration, /rename column id to stripe_customer_mapping_id;/);
  assert.match(migration, /stripe_customer_mappings_account_mode_key/);
  assert.match(migration, /stripe_customer_mappings_external_customer_key/);
  assert.match(migration, /stripe_customer_mappings_billing_account_idx/);

  assert.match(generatedTypes, /stripe_customer_mappings: \{/);
  assert.match(generatedTypes, /stripe_customer_mapping_id: string/);
  assert.doesNotMatch(generatedTypes, /stripe_customers: \{/);
});

test('renames exposed RPC arguments while preserving service-only grants', () => {
  assert.match(argumentRenameMigration, /rpc_argument_rename_grants/);
  assert.match(argumentRenameMigration, /revoke all on function/);
  assert.match(argumentRenameMigration, /grant %s on function/);
  assert.doesNotMatch(generatedTypes.slice(0, generatedTypes.indexOf('\n  app: {')), /\bp_[a-zA-Z0-9_]+/);
  assert.match(generatedTypes, /billing_get_account_by_customer:[\s\S]*?stripe_customer_id: string/);
  assert.match(generatedTypes, /billing_put_customer_for_account:[\s\S]*?billing_account_id: string/);
  assert.match(
    migration,
    /revoke all on function api_edge\.billing_get_account_by_customer\(text\)\s+from public, anon, authenticated;/,
  );
  assert.match(
    migration,
    /grant execute on function api_edge\.billing_get_account_by_customer\(text\)\s+to service_role;/,
  );
});
