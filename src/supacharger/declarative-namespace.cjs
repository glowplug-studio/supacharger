'use strict';
const { namespacePrefix } = require('./namespace.cjs');

// Only use on distributed default-namespace declarative SQL, never migration history.
function renderDeclarativeSql(sql, namespace) {
  const prefix = namespacePrefix(namespace);
  return sql.replace(/\bsc_(?=(?:app|api|api_edge|internal|services|mcp_api|ext_[a-z0-9_]+|user-avatars|organisation-logos|profile-media)\b)/g, prefix);
}
module.exports = { renderDeclarativeSql };

function prepareStarterSchemas(root) {
  const fs = require('node:fs');
  const path = require('node:path');
  const { namespace } = require('./extensions/services.cjs').readServiceConfig(root);
  const directory = path.join(root, 'supabase/schemas');
  if (!namespace || !fs.existsSync(directory)) return;
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Declarative starter must not contain symbolic links');
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.sql') || entry.name === '.pgdelta-export.json') files.push(file);
    }
  }
  walk(directory);
  // Existing project trees are developer-owned. Only render the default Core starter.
  if (!fs.existsSync(path.join(directory, 'sc_app/schema.sql'))) return;
  const changes = files.map(file => ({ file, target: renderDeclarativeSql(file, namespace), contents: renderDeclarativeSql(fs.readFileSync(file, 'utf8'), namespace) }));
  for (const {file,target} of changes) if (file !== target && fs.existsSync(target)) throw new Error('Namespace rendering would overwrite an existing schema');
  for (const {target,contents} of changes) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, contents); }
  for (const {file,target} of changes) if (file !== target) fs.unlinkSync(file);
}
module.exports.prepareStarterSchemas = prepareStarterSchemas;
if (require.main === module) prepareStarterSchemas(process.cwd());
