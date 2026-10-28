#!/usr/bin/env node
const { doctor } = require('./installer.cjs');
const { runExtension, normaliseId } = require('./update.cjs');
async function main() {
  const [action, name, ...args] = process.argv.slice(2); const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan') options.plan = true;
    else if (['--source', '--root', '--baseline-source', '--registry', '--baseline-registry'].includes(args[i]) && args[i + 1]) {
      const key = args[i++].slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); options[key] = args[i];
    } else throw new Error('Unknown or incomplete option');
  }
  if (!name || !['install', 'update', 'doctor'].includes(action)) throw new Error('Usage: cli.cjs install|update|doctor <name> [--source <directory>] [--baseline-source <directory>] [--registry <file>] [--root <project>] [--plan]. ZIP fetching is coming soon.');
  if (process.stdin.isTTY && process.stdout.isTTY) options.askReview = async () => {
    const input = require('node:readline/promises').createInterface({ input: process.stdin, output: process.stdout });
    try { return /^y(es)?$/i.test((await input.question('Local changes block automatic update. Prepare source copies and an AI comparison prompt? [y/N] ')).trim()); }
    finally { input.close(); }
  };
  const result = action === 'doctor' ? await doctor(normaliseId(name), options) : await runExtension(action, name, options);
  console.log(JSON.stringify(result, null, 2));
  if (result.healthy === false || result.reviewRequired) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
