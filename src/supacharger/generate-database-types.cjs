'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { readServiceConfig } = require('./extensions/services.cjs');
const { resourceName } = require('./namespace.cjs');
const root = process.cwd();
const { namespace } = readServiceConfig(root);
const args = process.argv.slice(2);
if (![1, 3].includes(args.length) || !['--local', '--linked'].includes(args[0]) || (args.length === 3 && args[1] !== '--schemas')) {
  throw new Error('Choose --local or --linked, optionally followed by --schemas <additional-logical-schemas>');
}
const additional = args.length === 3 ? args[2].split(',') : [];
const mapping = Object.fromEntries([...new Set(['app', 'api', 'api_edge', ...additional])].map(name => [resourceName(namespace, name), name]));
let source = execFileSync(path.join(root, 'node_modules/.bin/supabase'), ['gen', 'types', 'typescript', args[0], '--schema', ['public', ...Object.keys(mapping)].join(',')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
if (!source.includes('export type Database')) throw new Error('Expected generated Supabase database types');
for (const [resolved, logical] of Object.entries(mapping)) {
  source = source.replaceAll(`"${resolved}"`, `"${logical}"`).replace(new RegExp(`^(\\s*)${resolved}:`, 'gm'), `$1${logical}:`);
}
source = '// Generated logical schema contracts. Runtime clients map these through supacharger/database-types.ts.\n' + source;
fs.writeFileSync(path.join(root, 'src/lib/supabase/types.ts'), source);
