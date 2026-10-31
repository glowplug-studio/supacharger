'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { namespacePrefix, resourceName } = require('./namespace.cjs');

/** Derived Edge projection, never a second editable namespace setting. No database writes. */
function prepareNamespace({ root, namespace }) {
  // Fresh installs supply the value just written to SC_CONFIG before npm install.
  // Normal regeneration reads the same authoritative configuration.
  if (namespace === undefined) namespace = require('./extensions/services.cjs').readServiceConfig(root).namespace;
  const resources = {
    schemas: Object.fromEntries(['app', 'api', 'api_edge', 'internal', 'services'].map(name => [name, resourceName(namespace, name)])),
    buckets: { profile: resourceName(namespace, 'user-avatars', 'bucket') },
    functions: {
      imageUpload: resourceName(namespace, 'process_image_upload', 'function'),
      profileMedia: resourceName(namespace, 'profile-media', 'function'),
    },
    secrets: { imageUploadSigning: resourceName(namespace, 'image_upload_signing_secret', 'secret') },
  };
  const relative = 'supabase/functions/_shared/supacharger-resources.ts';
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Namespace output cannot use symlinks');
  }
  const source = '// Generated from src/supacharger.config.ts. Regenerate; do not edit.\n' +
    `export const namespacePrefix = ${JSON.stringify(namespacePrefix(namespace))};\n` +
    `export const resources = ${JSON.stringify(resources, null, 2)} as const;\n`;
  fs.mkdirSync(path.dirname(current), { recursive: true });
  if (!fs.existsSync(current) || fs.readFileSync(current, 'utf8') !== source) fs.writeFileSync(current, source);
  return resources;
}

module.exports = { prepareNamespace };
if (require.main === module) prepareNamespace({ root: process.cwd() });
