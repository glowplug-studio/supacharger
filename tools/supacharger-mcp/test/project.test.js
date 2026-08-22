import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyPath, projectTree, resolveRepositoryPath, searchGuidance } from '../src/project.js';

test('classifies protected and developer-owned paths', () => {
  assert.equal(classifyPath('src/supacharger/components/forms').ownership, 'cli-managed-core');
  assert.equal(classifyPath('src/supacharger.config.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('src/i18n/request.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('messages/en.json').ownership, 'developer-owned');
  assert.equal(classifyPath('src/styles/project.css').ownership, 'developer-owned');
  assert.equal(classifyPath('src/assets/svgr/ui/inline-loader.svg').ownership, 'developer-owned');
  assert.equal(classifyPath('src/assets/svgr/ui/inline-loader-dark.svg').ownership, 'developer-owned');
  assert.equal(classifyPath('src/supacharger/styles/supacharger.css').ownership, 'cli-managed-core');
  assert.equal(classifyPath('src/components/sc_demo/header.tsx').ownership, 'developer-owned-example');
  assert.equal(
    classifyPath('src/components/sc_demo/assets/logos/demo-logo-09.svg').ownership,
    'developer-owned-example',
  );
  assert.match(classifyPath('src/components/sc_demo/assets/logos/demo-logo-09.svg').guidance, /SVGR/);
  assert.equal(classifyPath('src/lib/stripe/stripe-events.ts').ownership, 'cli-managed-core');
  assert.equal(classifyPath('src/features/pricing/controllers/upsert-price.ts').ownership, 'cli-managed-core');
  assert.equal(classifyPath('supabase/migrations/20260812113258_billing.sql').ownership, 'cli-managed-core');
  assert.equal(classifyPath('supabase/functions/process-image-upload/index.ts').ownership, 'cli-managed-core');
  assert.equal(classifyPath('supabase/functions/_shared/image-transform.ts').ownership, 'cli-managed-core');
  assert.equal(classifyPath('supabase/functions/_shared/image-targets.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('src/lib/supabase/types.ts').ownership, 'cli-managed-core');
});

test('rejects paths outside the repository and sensitive paths', () => {
  assert.throws(() => resolveRepositoryPath('../outside'), /inside the Supacharger repository/);
  assert.throws(() => resolveRepositoryPath('.env.local'), /excluded/);
});

test('renders a filtered project tree', async () => {
  const tree = await projectTree('docs/agents', 1);
  assert.match(tree, /ownership\.md/);
  assert.doesNotMatch(tree, /node_modules/);
});

test('searches curated guidance', async () => {
  const matches = await searchGuidance('clean-room');
  assert.ok(matches.length > 0);
  assert.ok(matches.every((match) => match.path === 'AGENTS.md' || match.path.startsWith('docs/agents/')));
});

test('searches the localisation guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('locale-based routing');
  assert.ok(matches.some((match) => match.path === 'docs/agents/localisation.md'));
});

test('searches the billing guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('STRIPE_EVENT_PROCESSOR_SECRET');
  assert.ok(matches.some((match) => match.path === 'docs/agents/billing.md'));
});

test('searches the image transformation guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('request never supplies a bucket or path');
  assert.ok(matches.some((match) => match.path === 'docs/agents/image-transformation.md'));
});

test('searches the input validation guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('Browser-callable RPCs are public server boundaries');
  assert.ok(matches.some((match) => match.path === 'docs/agents/input-validation.md'));
});

test('searches the inline loading guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('every inline loading indicator');
  assert.ok(matches.some((match) => match.path === 'docs/agents/loading-ui.md'));
});
