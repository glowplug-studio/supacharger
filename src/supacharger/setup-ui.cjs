// Run from the application root during the local Setup Wizard.
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const starter = ['badge', 'button', 'card', 'input', 'label', 'separator', 'skeleton', 'textarea'];
const missing = starter.filter(name => !existsSync(join('src/components/ui', name + '.tsx')));
if (missing.length) {
  const { status, error } = spawnSync(process.execPath, [
    require.resolve('shadcn'), 'add', ...missing, '--yes',
  ], { stdio: 'inherit' });
  if (error) throw error;
  process.exitCode = status ?? 1;
}
