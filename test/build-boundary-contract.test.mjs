import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Next TypeScript excludes Supabase Edge Functions owned by the Deno runtime', async () => {
  const tsconfig = JSON.parse(await read('tsconfig.json'));
  assert.ok(
    tsconfig.exclude?.includes('supabase/functions/**/*'),
    'tsconfig.json must exclude supabase/functions/**/* from the Next.js TypeScript program',
  );
});
test('every statically imported OAuth provider asset resolves through the project alias', async () => {
  const tsconfig = JSON.parse(await read('tsconfig.json'));
  const aliasPattern = tsconfig.compilerOptions?.paths?.['@/*']?.[0];
  assert.equal(typeof aliasPattern, 'string');

  const candidates = [
    'src/supacharger/components/buttons/auth-provider-buttons.tsx',
    'components/auth-provider-buttons.tsx',
  ];

  let source = '';
  for (const candidate of candidates) {
    try {
      source = await read(candidate);
      break;
    } catch {}
  }
  assert.ok(source, 'OAuth provider button source was not found');

  const imports = [...source.matchAll(/from ['"](@\/[^'"]+\.svg)['"]/g)].map((match) => match[1]);
  assert.ok(imports.length > 0, 'No OAuth provider SVG imports were found');

  for (const importPath of imports) {
    const resolvedRelativePath = aliasPattern.replace('*', importPath.slice(2));
    await assert.doesNotReject(
      access(new URL(`../${resolvedRelativePath.replace(/^\.\//, '')}`, import.meta.url)),
      `${importPath} must resolve inside the project`,
    );
  }
});
