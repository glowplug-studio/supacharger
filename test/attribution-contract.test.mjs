import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('developer-owned Supacharger attribution uses a colocated SVGR mark', async () => {
  const [component, mark, englishMessages] = await Promise.all([
    read('src/components/attribution/supacharger-attribution.tsx'),
    read('src/components/attribution/supacharger-mark.svg'),
    read('messages/en.json'),
  ]);
  const root = mark.match(/<svg\b([^>]*)>/)?.[1] ?? '';

  assert.match(component, /remove[\s\S]*http:\/\/127\.0\.0\.1:4000\/product\/pricing/i);
  assert.match(component, /import SupachargerMark from '.\/supacharger-mark\.svg'/);
  assert.match(component, /getTranslations\('Attribution'\)/);
  assert.match(component, /\{t\('builtWith'\)\}/);
  assert.match(component, /href='https:\/\/supacharger\.dev'/);
  assert.match(component, /target='_blank'/);
  assert.match(component, /rel='noreferrer'/);
  assert.match(component, /<SupachargerMark aria-hidden='true' className='size-\[1em\]/);
  assert.match(root, /\bviewBox="0 0 33 33"/);
  assert.doesNotMatch(root, /\b(?:width|height)=/);
  assert.equal(JSON.parse(englishMessages).Attribution.builtWith, 'Built with');
});

test('the demo footer centers its existing Glowplug attribution', async () => {
  const footer = await read('src/components/sc_demo/sc_footer.tsx');

  assert.match(footer, /sm:grid-cols-3/);
  assert.match(footer, /<p className='text-center'>\s*\{t\('firstBuiltIn'\)\}/);
  assert.match(footer, />\s*🇳🇿\{t\('newZealand'\)\}\s*<\/a>\s*<br \/>/);
  assert.match(footer, /@remoteproductdev\s*<\/a>\{' '\}\s*-\{' '\}/);
  assert.match(footer, /<div className='sm:justify-self-end'>\s*<SupachargerAttribution \/>/);
});

test('the demo footer has two link columns without About or social links', async () => {
  const footer = await read('src/components/sc_demo/sc_footer.tsx');

  assert.match(footer, /<div className='grid grid-cols-2 gap-10'>/);
  assert.doesNotMatch(footer, /href: '\/about'|t\('socials'\)/);
  assert.doesNotMatch(footer, /https:\/\/(?:x\.com|www\.instagram\.com|www\.linkedin\.com)/);
});
