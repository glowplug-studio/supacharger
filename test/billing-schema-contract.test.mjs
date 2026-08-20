import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/20260820192834_rename_stripe_customer_mapping_table.sql', import.meta.url),
  'utf8',
);
const generatedTypes = readFileSync(new URL('../src/lib/supabase/types.ts', import.meta.url), 'utf8');

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

test('preserves canonical billing RPC arguments and service-only grants', () => {
  assert.match(migration, /billing_get_account_by_customer\(\s*p_stripe_customer_id text\s*\)/);
  assert.match(
    migration,
    /billing_put_customer_for_account\(\s*p_billing_account_id uuid,\s*p_stripe_customer_id text,/,
  );
  assert.match(
    migration,
    /revoke all on function api_edge\.billing_get_account_by_customer\(text\)\s+from public, anon, authenticated;/,
  );
  assert.match(
    migration,
    /grant execute on function api_edge\.billing_get_account_by_customer\(text\)\s+to service_role;/,
  );
});
