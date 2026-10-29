'use strict';

/** Pure naming contract shared by application builds and installation tooling. */
function namespacePrefix(namespace) {
  if (typeof namespace !== 'string' || (namespace !== '' && !/^[a-z][a-z0-9_]{0,5}$/.test(namespace))) {
    throw new Error('PROJECT_NAMESPACE must be empty or 1–6 lowercase letters, digits or underscores, starting with a letter');
  }
  return namespace ? `sc_${namespace}_` : 'sc_';
}

function resourceName(namespace, logicalName, kind = 'schema') {
  const prefix = namespacePrefix(namespace);
  const pattern = kind === 'schema' || kind === 'secret' ? /^[a-z][a-z0-9_]*$/ : /^[a-z][a-z0-9_-]*$/;
  if (!['schema', 'bucket', 'function', 'secret', 'job', 'role'].includes(kind) || typeof logicalName !== 'string' || !pattern.test(logicalName)) {
    throw new Error('Expected a lowercase logical resource name and a supported resource kind');
  }
  if (logicalName.startsWith('sc_')) throw new Error('Pass a logical resource name without its sc_ prefix');
  if (kind === 'schema' && ['auth', 'storage', 'public', 'extensions', 'graphql', 'graphql_public', 'realtime', 'supabase_migrations', 'vault', 'cron', 'net', 'information_schema', 'pgbouncer'].includes(logicalName)) {
    throw new Error('Platform schemas must not be namespaced');
  }
  const name = `${prefix}${logicalName}`;
  if (name.length > 63) throw new Error('Resolved resource name exceeds 63 ASCII characters');
  return kind === 'secret' ? name.toUpperCase() : name;
}

module.exports = { namespacePrefix, resourceName };
