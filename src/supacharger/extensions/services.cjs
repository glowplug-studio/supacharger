'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { namespacePrefix } = require('../namespace.cjs');

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
  if (!namespace || !ts.isStringLiteral(namespace)) throw new Error('PROJECT_NAMESPACE must be a literal string');
  namespacePrefix(namespace.text);
  if (providers.auth !== 'supabase') throw new Error('Supabase is the supported auth implementation');
  return { namespace: namespace.text, providers };
}

/** Resolve configured implementations from their installed source. Never execute payloads. */
function resolveCoreServices(root, required = []) {
  const config = readServiceConfig(root);
  const bindings = Object.create(null);
  for (const [service, provider] of Object.entries(config.providers)) {
    if (service === 'auth' || provider === null) continue;
    if (!/^supacharger-ext-[a-z][a-z0-9-]{0,63}$/.test(provider)) throw new Error(`Invalid ${service} implementation`);
    const id = provider.slice('supacharger-ext-'.length);
    const base = `src/app/(project)/(extensions)/(sc_extensions)/(${id})`;
    const server = `${base}/index.ts`;
    const selectedConfig = require('./prepare.cjs').readConfig(safeFile(root, `${base}/supacharger-ext-${id}.config.ts`));
    if (!selectedConfig.enabled) throw new Error(`Selected service ${service} is disabled`);
    safeFile(root, server);
    bindings[service] = { provider, server };
  }
  for (const service of required) if (service !== 'auth' && !bindings[service]) throw new Error(`Required core service ${service} is unavailable`);
  return { ...config, bindings };
}

module.exports = { readServiceConfig, resolveCoreServices };
