import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the Core forward migration aligns profile media RPC arguments', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/20260912143000_align_profile_media_rpc_arguments.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /input_avatar_path text/);
  assert.match(migration, /input_header_image_path text/);
  assert.doesNotMatch(migration, /\bp_(?:avatar|header_image)_path\b/);
});
