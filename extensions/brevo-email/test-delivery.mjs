import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const source = fileURLToPath(new URL('./', import.meta.url));
const root = await mkdtemp(path.join(tmpdir(), 'brevo-installed-runtime-'));
try {
  const manifest = JSON.parse(await readFile(path.join(source, 'extension.json'), 'utf8'));
  for (const file of manifest.files) {
    const target = path.join(root, file.target);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(path.join(source, file.source)));
  }
  const tests = (await readFile(path.join(source, 'delivery.test.ts.txt'), 'utf8'))
    .replaceAll('./payload/', './supabase/functions/_shared/extensions/brevo-email/');
  const entry = path.join(root, 'delivery.test.ts');
  await writeFile(entry, tests);
  const result = spawnSync('npx', ['-y', 'deno@2.9.5', 'test', '--no-config', '--no-lock', entry], { stdio: 'inherit', cwd: root });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
