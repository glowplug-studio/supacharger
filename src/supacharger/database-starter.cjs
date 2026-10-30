'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { namespacePrefix } = require('./namespace.cjs');
const { renderDeclarativeSql, prepareStarterSchemas } = require('./declarative-namespace.cjs');
const sha256 = contents => crypto.createHash('sha256').update(contents).digest('hex');

function schemaSources(root) {
  const result = {};
  const directory = path.join(root, 'supabase/schemas');
  function visit(relative) {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Database definitions must not contain symbolic links');
      if (entry.isDirectory()) visit(name);
      else if (entry.name.endsWith('.sql')) result[name] = fs.readFileSync(path.join(directory, name), 'utf8');
    }
  }
  visit('');
  return result;
}

// Called only while preparing a newly downloaded starter, before linking Supabase.
// Existing applications must retain their history and use forward migrations.
function prepareFreshDatabase(root, namespace) {
  namespacePrefix(namespace);
  const templateDir = path.join(root, 'src/supacharger/database-starter');
  const contract = JSON.parse(fs.readFileSync(path.join(templateDir, 'contract.json'), 'utf8'));
  if (contract.version !== 1) throw new Error('Unsupported database starter contract');
  if (fs.existsSync(path.join(root, 'supabase/.temp/project-ref'))) throw new Error('Refusing to flatten a linked project');
  const initial = fs.readFileSync(path.join(templateDir, 'initial.sql'), 'utf8');
  const bootstrap = fs.readFileSync(path.join(templateDir, 'bootstrap.sql'), 'utf8');
  if (sha256(initial) !== contract.initialSha256 || sha256(bootstrap) !== contract.bootstrapSha256) throw new Error('Database starter checksum mismatch');
  const sources = schemaSources(root);
  if (Object.keys(sources).length !== Object.keys(contract.schemas).length || Object.entries(contract.schemas).some(([name, hash]) => !Object.hasOwn(sources, name) || sha256(sources[name]) !== hash)) {
    throw new Error('Database starter is stale or already customised; regenerate and verify the initial migration from the current definitions');
  }
  const directory = path.join(root, 'supabase/migrations');
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  if (entries.some(entry => !entry.isFile() || !Object.hasOwn(contract.historicalMigrations, entry.name) || sha256(fs.readFileSync(path.join(directory, entry.name))) !== contract.historicalMigrations[entry.name]) || entries.length !== Object.keys(contract.historicalMigrations).length) {
    throw new Error('Refusing to replace an unknown or modified migration history');
  }
  const sql = renderDeclarativeSql(`${initial}\n${bootstrap}`, namespace);
  // Rendering completes and checks collisions before any history is removed.
  prepareStarterSchemas(root, namespace);
  const destination = path.join(directory, contract.initialMigration);
  fs.writeFileSync(destination, sql, { flag: 'wx' });
  for (const entry of entries) fs.unlinkSync(path.join(directory, entry.name));
  return destination;
}
module.exports = { prepareFreshDatabase, schemaSources, sha256 };
if (require.main === module) {
  if (process.argv[2] !== '--fresh') throw new Error('Use --fresh only for an unlinked, new installation');
  const root = process.cwd();
  const { namespace } = require('./extensions/services.cjs').readServiceConfig(root);
  console.log(prepareFreshDatabase(root, namespace));
}
