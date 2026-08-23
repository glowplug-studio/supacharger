import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = process.cwd();
const migrationsDirectory = path.join(repositoryRoot, 'supabase', 'migrations');
const collectionDirectory = path.join(repositoryRoot, 'docs', 'bruno', 'supacharger-rpc');
const coreLockPath = path.join(repositoryRoot, '.supacharger', 'core-lock.json');

const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith('.sql'))
  .sort();
const currentRpcNames = new Set();
const rpcStatement =
  /\b(create(?:\s+or\s+replace)?|drop)\s+function(?:\s+if\s+exists)?\s+api\.([a-z][a-z0-9_]*)\s*\(/gi;

for (const migrationFile of migrationFiles) {
  const sql = await readFile(path.join(migrationsDirectory, migrationFile), 'utf8');
  for (const match of sql.matchAll(rpcStatement)) {
    const action = match[1].toLowerCase();
    const rpcName = match[2];
    if (action.startsWith('drop')) currentRpcNames.delete(rpcName);
    else currentRpcNames.add(rpcName);
  }
}

const requestFiles = (await readdir(collectionDirectory)).filter((file) => file.endsWith('.bru')).sort();
const documentedRpcNames = new Set();
const malformedRequests = [];
const duplicateRpcNames = [];
for (const requestFile of requestFiles) {
  const request = await readFile(path.join(collectionDirectory, requestFile), 'utf8');
  const match = request.match(/\/rest\/v1\/rpc\/([a-z][a-z0-9_]*)/);
  if (!match) {
    malformedRequests.push(requestFile);
    continue;
  }
  if (documentedRpcNames.has(match[1])) duplicateRpcNames.push(match[1]);
  documentedRpcNames.add(match[1]);
}

let isConsumer = true;
try {
  await access(coreLockPath);
} catch {
  isConsumer = false;
}

const missingRequests = isConsumer
  ? []
  : [...currentRpcNames].filter((name) => !documentedRpcNames.has(name)).sort();
const missingImplementations = [...documentedRpcNames]
  .filter((name) => !currentRpcNames.has(name))
  .sort();

if (
  malformedRequests.length ||
  duplicateRpcNames.length ||
  missingRequests.length ||
  missingImplementations.length
) {
  if (malformedRequests.length) {
    console.error(`Bruno requests without an RPC endpoint: ${malformedRequests.join(', ')}`);
  }
  if (duplicateRpcNames.length) {
    console.error(`Duplicate Bruno RPC requests: ${duplicateRpcNames.join(', ')}`);
  }
  if (missingRequests.length) {
    console.error(`Missing Bruno RPC requests: ${missingRequests.join(', ')}`);
  }
  if (missingImplementations.length) {
    console.error(`Missing canonical RPC implementations: ${missingImplementations.join(', ')}`);
  }
  process.exitCode = 1;
} else {
  const scope = isConsumer ? 'canonical Supacharger' : 'Core api';
  console.log(`Bruno RPC parity passed for ${documentedRpcNames.size} ${scope} functions.`);
}
