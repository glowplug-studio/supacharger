import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyPath, projectTree, readGuidance, resolveRepositoryPath, searchGuidance } from '../src/project.js';

test('extension guidance distinguishes canonical bundles, installed modules and product adapters', async () => {
  assert.equal(classifyPath('extensions/brevo-email/extension.json').ownership, 'canonical-extension-tooling');
  assert.equal(classifyPath('supabase/functions/_shared/extensions/brevo-email/send-template.ts').ownership, 'extension-managed');
  assert.equal(classifyPath('supabase/functions/ext-brevo-email/index.ts').ownership, 'extension-managed');
  assert.equal(classifyPath('supabase/migrations/20260910120000_ext_brevo_email_delivery.sql').ownership, 'forward-only-migration');
  assert.equal(classifyPath('src/supacharger.adapters/email/actions.ts').ownership, 'developer-owned');
  const guidance = await readGuidance('extensions');
  assert.match(guidance, /published `@glowplug\/supacharger-cli` package deliberately excludes extension and plugin installation commands/);
  assert.match(guidance, /command does not exist/);
  assert.match(guidance, /not implemented/);
  assert.match(guidance, /Specdrive/);
});

test('classifies protected and developer-owned paths', () => {
  assert.equal(classifyPath('src/supacharger/components/forms').ownership, 'cli-managed-core');
  assert.equal(classifyPath('src/supacharger.config.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('src/i18n/request.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('messages/en.json').ownership, 'developer-owned');
  assert.equal(classifyPath('src/styles/project.css').ownership, 'developer-owned');
  assert.equal(classifyPath('src/styles/supacharger-auth.css').ownership, 'developer-owned');
  assert.equal(classifyPath('src/styles/supacharger-account.css').ownership, 'developer-owned');
  assert.equal(classifyPath('src/styles/supacharger-organisations.css').ownership, 'developer-owned');
  assert.equal(classifyPath('src/supacharger.adapters/auth/auth-sidecar.tsx').ownership, 'developer-owned');
  assert.equal(classifyPath('src/supacharger.adapters/account/navigation.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('src/supacharger.adapters/organisations/profile-fields.tsx').ownership, 'developer-owned');
  assert.equal(classifyPath('src/supacharger/organisations/organisation-service.ts').ownership, 'cli-managed-core');
  assert.equal(
    classifyPath('src/app/(supacharger)/(authenticated)/organisation/[org-handle]/settings/page.tsx').ownership,
    'cli-managed-core',
  );
  assert.equal(classifyPath('src/assets/svgr/ui/inline-loader.svg').ownership, 'developer-owned');
  assert.equal(classifyPath('src/assets/svgr/ui/image-loader.svg').ownership, 'developer-owned');
  assert.equal(classifyPath('src/assets/svgr/ui/inline-loader-dark.svg').ownership, 'developer-owned');
  assert.equal(classifyPath('src/supacharger/styles/supacharger.css').ownership, 'cli-managed-core');
  assert.equal(classifyPath('src/components/sc_demo/header.tsx').ownership, 'developer-owned-example');
  assert.equal(
    classifyPath('src/components/sc_demo/assets/logos/demo-logo-09.svg').ownership,
    'developer-owned-example',
  );
  assert.match(classifyPath('src/components/sc_demo/assets/logos/demo-logo-09.svg').guidance, /SVGR/);
  assert.equal(classifyPath('src/components/sc_widgets/file-upload/file-upload-widget.tsx').ownership, 'developer-owned-widget');
  assert.match(classifyPath('src/components/sc_widgets/image-upload/project-image-policy.ts').guidance, /project-widgets/);
  assert.equal(classifyPath('src/lib/stripe/stripe-events.ts').ownership, 'application-integration');
  assert.equal(classifyPath('src/features/pricing/controllers/upsert-price.ts').ownership, 'application-integration');
  assert.equal(classifyPath('src/lib/supabase/types.ts').ownership, 'application-integration');
  assert.equal(classifyPath('package.json').ownership, 'merge-managed-contract');
  assert.equal(classifyPath('tailwind.config.ts').ownership, 'cli-managed-core');
  assert.equal(classifyPath('tailwind.project.config.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('supabase/migrations/20260812113258_billing.sql').ownership, 'forward-only-history');
  assert.equal(classifyPath('.supacharger/migration-aliases.json').ownership, 'developer-owned');
  assert.equal(classifyPath('test/billing-schema-contract.test.mjs').ownership, 'developer-owned');
  assert.equal(classifyPath('test/project-billing-schema-contract.test.mjs').ownership, 'developer-owned');
  assert.match(classifyPath('test/project-billing-schema-contract.test.mjs').guidance, /Do not create or restore/);
  assert.equal(classifyPath('postcss.config.mjs').ownership, 'cli-managed-core');
  assert.equal(classifyPath('supabase/functions/process-image-upload-v2/index.ts').ownership, 'cli-managed-core');
  assert.equal(classifyPath('supabase/functions/_shared/image-transform.ts').ownership, 'cli-managed-core');
  assert.equal(classifyPath('src/supacharger.adapters/media/image-targets.ts').ownership, 'developer-owned');
  assert.equal(classifyPath('src/app/(project)/account/page.tsx').ownership, 'developer-owned');
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
  assert.ok(matches.every((match) => match.path === 'AGENTS.md' || match.path.startsWith('docs/agents/') || match.path === '.agents/supacharger/guidance.md'));
});

test('searches the localisation guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('locale-based routing');
  assert.ok(matches.some((match) => match.path === 'docs/agents/localisation.md'));
});

test('searches the billing guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('STRIPE_EVENT_PROCESSOR_SECRET');
  assert.ok(matches.some((match) => match.path === 'docs/agents/billing.md'));
});

test('searches the account settings guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('supacharger:account-summary-changed');
  assert.ok(matches.some((match) => match.path === 'docs/agents/account-settings.md'));
});

test('searches the organisation settings guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('Invitation links are displayed once');
  assert.ok(matches.some((match) => match.path === 'docs/agents/organisation-settings.md'));
});

test('searches the CLI upgrade guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('migration-aliases.json');
  assert.ok(matches.some((match) => match.path === 'docs/agents/cli-upgrades.md'));
});

test('searches the direct file-comparison guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('directly compares');
  assert.ok(matches.some((match) => match.path === 'docs/agents/cli-upgrades.md'));
});

test('searches the image transformation guidance exposed to the MCP', async () => {
  const matches = await searchGuidance('oriented source pixels');
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


test('routes agent knowledge separately from project and optional contributor instructions', async () => {
  assert.equal(classifyPath('.agents/project/AGENTS.md').ownership, 'developer-owned');
  assert.equal(classifyPath('.agents/supacharger/core-development/AGENTS.md').ownership, 'git-submodule');
  assert.equal(classifyPath('.agents/skills/changelog/SKILL.md').ownership, 'developer-owned');
  assert.equal(classifyPath('.agents/supacharger/guidance.md').ownership, 'cli-managed-core');
  assert.equal(classifyPath('CHANGELOG.md').ownership, 'cli-managed-core');
  assert.equal(classifyPath('CHANGELOG.project.md').ownership, 'developer-owned');
  assert.match(await readGuidance('agent_guidance'), /technical references/);
  assert.match(await readGuidance('working_rules'), /project\/AGENTS.md/);
});
