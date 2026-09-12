import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));

function flatten(value, path = '', result = new Map()) {
  if (typeof value === 'string') result.set(path, value);
  else if (Array.isArray(value)) value.forEach((item, index) => flatten(item, `${path}.${index}`, result));
  else if (value && typeof value === 'object')
    Object.entries(value).forEach(([key, item]) => flatten(item, path ? `${path}.${key}` : key, result));
  return result;
}

const placeholders = (value) => [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();

test('English is complete and secondary catalogues retain structural and placeholder parity', () => {
  const catalogues = {
    en: readJson('messages/en.json'),
    es: readJson('messages/es.json'),
    zh: readJson('messages/zh.json'),
  };
  const english = flatten(catalogues.en);

  for (const [locale, catalogue] of Object.entries(catalogues)) {
    const leaves = flatten(catalogue);
    assert.deepEqual([...leaves.keys()].sort(), [...english.keys()].sort(), `${locale} catalogue keys differ from English`);
    for (const [key, value] of leaves) {
      if (locale === 'en') assert.ok(value.trim(), `${locale}.${key} must not be empty`);
      if (!value.trim()) continue;
      assert.deepEqual(placeholders(value), placeholders(english.get(key)), `${locale}.${key} placeholders differ`);
    }
  }
});

test('supported locale policy replaces French with Spanish and Chinese', () => {
  const config = fs.readFileSync('src/i18n/config.ts', 'utf8');
  assert.match(config, /SUPPORTED_LOCALES = \['en', 'es', 'zh'\]/);
  assert.equal(fs.existsSync('messages/fr.json'), false);
  const appConfig = fs.readFileSync('src/supacharger.config.ts', 'utf8');
  assert.match(appConfig, /['"]\/api\/intl['"]/, 'the locale preference API must remain public');
});

test('landing page image placements are unique', () => {
  const source = fs.readFileSync('src/components/sc_demo/sc_marketing-landing.tsx', 'utf8');
  const paths = [...source.matchAll(/['"](\/images\/sc_demo\/sc-marketing-[^'"]+)['"]/g)].map((match) => match[1]);
  assert.equal(
    new Set(paths).size,
    paths.length,
    `duplicate landing images: ${paths.filter((path, index) => paths.indexOf(path) !== index).join(', ')}`,
  );
});
