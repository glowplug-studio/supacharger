'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { resolveCoreServices } = require('./services.cjs');
const validId = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(value);

function localPath(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid extension integration path');
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Extension integration paths cannot contain symlinks');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}

/** Parse literals only. Never import, transpile or execute downloaded configuration. */
function readConfig(filename) {
  const source = fs.readFileSync(filename, 'utf8');
  if (Buffer.byteLength(source) > 16384) throw new Error('Extension config is too large');
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (tree.parseDiagnostics.length || tree.statements.length !== 1 || !ts.isExportAssignment(tree.statements[0]) || tree.statements[0].isExportEquals) throw new Error('Extension config must contain one default literal export');
  function literal(node) {
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) return literal(node.expression);
    if (ts.isObjectLiteralExpression(node)) {
      const result = Object.create(null);
      for (const item of node.properties) {
        if (!ts.isPropertyAssignment(item) || !(ts.isIdentifier(item.name) || ts.isStringLiteral(item.name))) throw new Error('Extension config accepts literal properties only');
        const key = item.name.text;
        if (['__proto__', 'prototype', 'constructor'].includes(key) || Object.hasOwn(result, key)) throw new Error('Invalid or duplicate extension config property');
        result[key] = literal(item.initializer);
      }
      return result;
    }
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    throw new Error('Extension config accepts literal values only');
  }
  const config = literal(tree.statements[0].expression);
  if (!config || Array.isArray(config) || typeof config.enabled !== 'boolean') throw new Error('Extension config needs a boolean enabled property');
  return config;
}

function verifyProvider(root, id) {
  if (!validId(id)) throw new Error('Invalid configured provider ID');
  const receipt = localPath(root, `.supacharger/extensions/${id}.json`);
  if (!fs.existsSync(receipt)) throw new Error(`Configured provider ${id} is not installed`);
  const { manifest } = JSON.parse(fs.readFileSync(receipt, 'utf8'));
  if (manifest?.id !== id || manifest.name !== `supacharger-ext-${id}` || !Array.isArray(manifest.files) || !manifest.files.length || manifest.files.length > 1000) throw new Error('Invalid provider installation record');
  for (const file of manifest.files) {
    const target = localPath(root, file.target);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) throw new Error(`Configured provider ${id} has missing source files`);
  }
}

/** Called from next.config before dev/build. Never contacts or changes a database. */
function prepareExtensions({ root, extensions = [] }) {
  root = fs.realpathSync(root);
  const outputRelative = 'src/supacharger.adapters/generated/extensions';
  const output = localPath(root, outputRelative);
  const results = [];
  const seen = new Set();
  const requiredServices = new Set();
  // Validate every registration before writing any generated module.
  for (const registration of extensions) {
    const { id, fallback, providers = {} } = registration;
    if (!validId(id) || seen.has(id)) throw new Error('Invalid or duplicate extension registration');
    seen.add(id);
    const fallbackFile = localPath(root, fallback);
    if (!fs.existsSync(fallbackFile) || !fs.statSync(fallbackFile).isFile()) throw new Error(`Missing ${id} unavailable adapter`);
    const base = `src/app/(project)/(extensions)/(sc_extensions)/(${id})`;
    const configFile = localPath(root, `${base}/supacharger-ext-${id}.config.ts`);
    const installed = fs.existsSync(localPath(root, base));
    if (installed && !fs.existsSync(configFile)) throw new Error(`Installed ${id} has no configuration`);
    const config = installed ? readConfig(configFile) : { enabled: false };
    const enabled = config.enabled;
    if (enabled) {
      const receipt = localPath(root, `.supacharger/extensions/${id}.json`);
      if (fs.existsSync(receipt)) {
        const manifest = JSON.parse(fs.readFileSync(receipt, 'utf8')).manifest;
        if (manifest.core_services !== undefined && (!Array.isArray(manifest.core_services) || manifest.core_services.some(name => typeof name !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(name)))) throw new Error('Invalid required core services');
        for (const service of manifest.core_services ?? []) requiredServices.add(service);
      }
    }
    if (enabled && Object.hasOwn(config, 'emailProvider')) {
      if (typeof config.emailProvider !== 'string' || !Object.hasOwn(providers, config.emailProvider)) throw new Error(`Unsupported ${id} email provider`);
      verifyProvider(root, providers[config.emailProvider]);
    }
    const entry = enabled ? localPath(root, `${base}/index.ts`) : fallbackFile;
    if (!fs.existsSync(entry) || !fs.statSync(entry).isFile()) throw new Error(`Missing ${id} entry point`);
    const specifier = './' + path.relative(output, entry).split(path.sep).join('/').replace(/\.tsx?$/, '');
    const catalogue = enabled ? localPath(root, `${base}/messages/en.json`) : null;
    let content = '// Generated by Supacharger extension preparation. Do not edit.\n';
    content += `export const extensionEnabled = ${enabled};\nexport * from ${JSON.stringify(specifier)};\n`;
    if (catalogue && fs.existsSync(catalogue)) {
      const messages = JSON.parse(fs.readFileSync(catalogue, 'utf8'));
      if (!messages || Array.isArray(messages) || typeof messages !== 'object') throw new Error('Invalid extension English catalogue');
      content += `export { default as extensionMessages } from ${JSON.stringify('./' + path.relative(output, catalogue).split(path.sep).join('/'))};\n`;
    } else content += 'export const extensionMessages = {};\n';
    results.push({ id, enabled, config, filename: localPath(root, `${outputRelative}/${id}.ts`), content });
  }
  const services = resolveCoreServices(root, [...requiredServices]);
  const serviceOutput = localPath(root, 'src/supacharger.adapters/generated/services');
  fs.mkdirSync(serviceOutput, { recursive: true });
  for (const [name, binding] of Object.entries(services.bindings)) {
    const entry = localPath(root, binding.server);
    const specifier = './' + path.relative(serviceOutput, entry).split(path.sep).join('/').replace(/\.tsx?$/, '');
    const content = '// Generated by Supacharger. Server-only installed service entry.\nimport "server-only";\n' + `export * from ${JSON.stringify(specifier)};\n`;
    const filename = path.join(serviceOutput, `${name}.ts`);
    if (!fs.existsSync(filename) || fs.readFileSync(filename, 'utf8') !== content) fs.writeFileSync(filename, content);
  }
  for (const filename of fs.readdirSync(serviceOutput)) {
    if (/^[a-z][a-z0-9_]*\.ts$/.test(filename) && !Object.hasOwn(services.bindings, filename.slice(0, -3))) fs.unlinkSync(path.join(serviceOutput, filename));
  }
  if (results.length) fs.mkdirSync(output, { recursive: true });
  for (const item of results) {
    if (!fs.existsSync(item.filename) || fs.readFileSync(item.filename, 'utf8') !== item.content) fs.writeFileSync(item.filename, item.content);
  }
  return results.map(({ id, enabled, config }) => ({ id, enabled, config }));
}

module.exports = { prepareExtensions, readConfig };
