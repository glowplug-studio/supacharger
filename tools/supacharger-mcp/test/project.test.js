import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyPath, projectTree, resolveRepositoryPath, searchGuidance } from '../src/project.js';

test('classifies protected and developer-owned paths', () => {
  assert.equal(classifyPath('src/supacharger/components/forms').ownership, 'cli-managed-core');
  assert.equal(classifyPath('src/supacharger.config.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('src/components/sc_demo/header.tsx').ownership, 'developer-owned-example');
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
