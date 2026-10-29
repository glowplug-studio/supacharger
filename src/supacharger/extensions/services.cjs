'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const ts = require('typescript');

function safeFile(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Invalid service binding path');
  let file = root;
  for (const part of relative.split('/')) {
    file = path.join(file, part);
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Service bindings cannot use symlinks');
  }
  if (!fs.statSync(file).isFile()) throw new Error('Service binding must be a file');
  return file;
}

/** Read the two literal configuration fields without executing application code. */
function readServiceConfig(root) {
  const filename = safeFile(root, 'src/supacharger.config.ts');
  const tree = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
  const matches = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'SC_CONFIG') matches.push(node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (tree.parseDiagnostics.length || matches.length !== 1) throw new Error('Expected one SC_CONFIG declaration');
  const unwrap = node => ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;
  const properties = node => {
    node = unwrap(node);
    if (!ts.isObjectLiteralExpression(node)) throw new Error('Core service configuration must be literal');
    const result = Object.create(null);
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) throw new Error('Core service configuration must use literal properties');
      if (Object.hasOwn(result, property.name.text)) throw new Error('Duplicate configuration property');
      result[property.name.text] = property.initializer;
    }
    return result;
  };
  const rootProperties = properties(matches[0]);
  const services = properties(rootProperties.CORE_SERVICES);
  const providers = Object.create(null);
  for (const [name, expression] of Object.entries(services)) {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(name)) throw new Error('Invalid core service name');
    const fields = properties(expression);
    if (Object.keys(fields).length !== 1 || !fields.provider) throw new Error('Expected a service provider');
    const value = unwrap(fields.provider);
    if (value.kind !== ts.SyntaxKind.NullKeyword && !ts.isStringLiteral(value)) throw new Error('Service provider must be a string or null');
    providers[name] = value.kind === ts.SyntaxKind.NullKeyword ? null : value.text;
  }
  const namespace = rootProperties.PROJECT_NAMESPACE && unwrap(rootProperties.PROJECT_NAMESPACE);
  if (!namespace || !ts.isStringLiteral(namespace) || !/^[a-z][a-z0-9_]{0,19}$/.test(namespace.text)) throw new Error('PROJECT_NAMESPACE must be 1–20 lowercase letters, digits or underscores, starting with a letter');
  if (providers.auth !== 'supabase') throw new Error('Supabase is the supported auth implementation');
  return { namespace: namespace.text, providers };
}

/** Resolve installed, hash-verified implementation descriptors. Never execute payloads. */
function resolveCoreServices(root, required = []) {
  const config = readServiceConfig(root);
  const bindings = Object.create(null);
  for (const [service, provider] of Object.entries(config.providers)) {
    if (service === 'auth' || provider === null) continue;
    if (!/^supacharger-ext-[a-z][a-z0-9-]{0,63}$/.test(provider)) throw new Error(`Invalid ${service} implementation`);
    const id = provider.slice('supacharger-ext-'.length);
    const record = JSON.parse(fs.readFileSync(safeFile(root, `.supacharger/extensions/${id}.json`), 'utf8'));
    const manifest = record.manifest;
    if (manifest?.id !== id || manifest.name !== provider || !Array.isArray(manifest.files)) throw new Error('Invalid service installation record');
    const descriptor = manifest.provides_services?.[service];
    if (!descriptor || descriptor.contractVersion !== 1 || typeof descriptor.server !== 'string' || !descriptor.database || !/^[a-z][a-z0-9_]*$/.test(descriptor.database.enqueueRpc) || descriptor.database.enqueueRpc.length > 63 || descriptor.database.schema !== 'api_edge') throw new Error(`No compatible ${service} binding in ${provider}`);
    if (!manifest.files.some(file => file.target === descriptor.server && file.kind !== 'config')) throw new Error('Service entry must be extension-managed');
    const configFile = manifest.files.find(file => file.kind === 'config');
    if (!configFile) throw new Error('Service implementation needs developer-owned configuration');
    const selectedConfig = require('./prepare.cjs').readConfig(safeFile(root, configFile.target));
    if (!selectedConfig.enabled) throw new Error(`Selected service ${service} is disabled`);
    if (descriptor.configFingerprint && createHash('sha256').update(JSON.stringify(selectedConfig)).digest('hex') !== descriptor.configFingerprint) throw new Error(`Prepare ${provider} again after changing its configuration`);
    for (const file of manifest.files) {
      const bytes = fs.readFileSync(safeFile(root, file.target));
      if (file.kind !== 'config' && createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`Modified service implementation: ${file.target}`);
    }
    bindings[service] = { provider, ...descriptor };
  }
  for (const service of required) if (service !== 'auth' && !bindings[service]) throw new Error(`Required core service ${service} is unavailable`);
  return { ...config, bindings };
}

module.exports = { readServiceConfig, resolveCoreServices };
