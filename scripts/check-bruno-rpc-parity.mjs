import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = process.cwd();
const migrationsDirectory = path.join(repositoryRoot, 'supabase', 'migrations');
const collectionDirectory = path.join(repositoryRoot, 'docs', 'bruno', 'supacharger-rpc');

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

const requestFiles = (await readdir(collectionDirectory)).filter((file) => file.endsWith('.bru'));
const documentedRpcNames = new Set();
for (const requestFile of requestFiles) {
  const request = await readFile(path.join(collectionDirectory, requestFile), 'utf8');
  const match = request.match(/\/rest\/v1\/rpc\/([a-z][a-z0-9_]*)/);
  if (match) documentedRpcNames.add(match[1]);
}

const missing = [...currentRpcNames].filter((name) => !documentedRpcNames.has(name)).sort();
const stale = [...documentedRpcNames].filter((name) => !currentRpcNames.has(name)).sort();

if (missing.length || stale.length) {
  if (missing.length) console.error(`Missing Bruno RPC requests: ${missing.join(', ')}`);
  if (stale.length) console.error(`Stale Bruno RPC requests: ${stale.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Bruno RPC parity passed for ${currentRpcNames.size} api functions.`);
}
