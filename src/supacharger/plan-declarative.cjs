'use strict';
// Read-only planning against an explicitly selected disposable local database.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { values } = parseArgs({ options: { target: { type: 'string' }, shadow: { type: 'string' }, 'allow-cloned-shadow': { type: 'boolean', default: false } } });
function localUrl(value) {
  if (!value) throw new Error('Supply --target <disposable-local-postgres-url>');
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Only disposable local database endpoints are allowed');
  return url;
}
const target = localUrl(values.target);
const extra = [];
if (values.shadow) {
  const shadow = localUrl(values.shadow);
  if ((shadow.port || '5432') === (target.port || '5432')) throw new Error('The shadow must use a separate local PostgreSQL server');
  extra.push('--shadow', values.shadow, '--isolated-shadow');
  if (values['allow-cloned-shadow']) extra.push('--allow-same-database-identity');
} else if (values['allow-cloned-shadow']) throw new Error('--allow-cloned-shadow requires an explicit separate shadow');
const root = process.cwd();
const directory = path.join(root, 'supabase/schemas');
if (!fs.existsSync(directory)) throw new Error('No declarative schema tree');
const output = path.join(root, 'supabase/.temp/declarative-plan.sql');
fs.mkdirSync(path.dirname(output), { recursive: true });
const binary = path.join(path.dirname(require.resolve('@supabase/pg-delta')), 'cli/main.js');
const file = fs.openSync(output, 'w', 0o600);
try {
  const result = spawnSync(process.execPath, [binary, 'schema', 'apply', '--dir', directory, '--target', values.target, ...extra, '--profile', 'supabase', '--dry-run', '--out-plan', path.join(root, 'supabase/.temp/declarative-plan.json')], { stdio: ['ignore', file, 'inherit'] });
  if (result.error) throw result.error;
  if (result.status !== 0) { fs.unlinkSync(output); process.exit(result.status ?? 1); }
} finally { fs.closeSync(file); }
console.log('Plan saved to supabase/.temp/declarative-plan.sql; nothing applied. Review against migration history and production before creating a forward migration.');
