#!/usr/bin/env node
const { install, doctor } = require('./installer.cjs');
async function main() {
  const [action, id, ...args] = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan') options.plan = true;
    else if (['--source', '--root'].includes(args[i]) && args[i + 1]) options[args[i++].slice(2)] = args[i];
    else throw new Error('Unknown or incomplete option');
  }
  if (!['install', 'doctor'].includes(action)) throw new Error('Usage: cli.cjs install|doctor <id> [--source <bundle>] [--root <project>] [--plan]');
  const result = await (action === 'install' ? install : doctor)(id, options);
  console.log(JSON.stringify(result, null, 2));
  if (result.healthy === false) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
