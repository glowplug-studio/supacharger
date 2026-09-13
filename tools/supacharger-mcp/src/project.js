import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));

export const repositoryRoot = path.resolve(sourceDirectory, '../../..');

const ignoredTreeNames = new Set(['.git', '.next', '.turbo', '.vercel', 'build', 'coverage', 'node_modules', 'out']);

const guidanceFiles = {
  mission: 'docs/agents/project-overview.md',
  ownership: 'docs/agents/ownership.md',
  cli_upgrades: 'docs/agents/cli-upgrades.md',
  extensions: 'docs/agents/extensions.md',
  localisation: 'docs/agents/localisation.md',
  authentication: 'docs/agents/authentication-and-claims.md',
  mobile_auth: 'docs/agents/mobile-auth-deep-linking.md',
  database: 'docs/agents/database-foundation.md',
  input_validation: 'docs/agents/input-validation.md',
  image_transforms: 'docs/agents/image-transformation.md',
  loading_ui: 'docs/agents/loading-ui.md',
  project_widgets: 'docs/agents/project-widgets.md',
  profile: 'docs/agents/profile-identity-and-onboarding.md',
  account_settings: 'docs/agents/account-settings.md',
  organisations: 'docs/agents/organisation-settings.md',
  billing: 'docs/agents/billing.md',
  workflow: 'docs/agents/workflow.md',
  instructions: 'AGENTS.md',
  agent_guidance: 'docs/agents/agent-guidance.md',
  working_rules: '.agents/supacharger/guidance.md',
};

function normaliseRelativePath(inputPath) {
  return inputPath.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
}

export function resolveRepositoryPath(inputPath = '.') {
  const relativePath = normaliseRelativePath(inputPath || '.');
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  const relativeToRoot = path.relative(repositoryRoot, absolutePath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error('Path must remain inside the Supacharger repository.');
  }

  const pathSegments = relativeToRoot.split(path.sep);
  if (
    pathSegments.some(
      (segment) =>
        segment === '.git' ||
        segment === 'node_modules' ||
        segment === '.next' ||
        segment === '.vercel' ||
        segment === '.temp' ||
        segment.startsWith('.env'),
    )
  ) {
    throw new Error('That path is excluded from the repository knowledge MCP.');
  }

  return absolutePath;
}

export function classifyPath(inputPath) {
  const relativePath = normaliseRelativePath(inputPath);

  if (relativePath === '.agents/supacharger/guidance.md' || relativePath === 'CHANGELOG.md') {
    return { ownership: 'cli-managed-core', guidance: 'Shared guidance or Core changelog. Application overrides belong in .agents/project/AGENTS.md; application history belongs in CHANGELOG.project.md.' };
  }
  if (relativePath === '.agents/supacharger/core-development' || relativePath.startsWith('.agents/supacharger/core-development/')) {
    return { ownership: 'git-submodule', guidance: 'Optional private Core contributor instructions. Normal CLI use ignores this path; use supacharger coredev install or supacharger coredev update explicitly. Updates refuse local submodule changes.' };
  }
  if (relativePath === 'AGENTS.md' || relativePath === 'CHANGELOG.project.md' || relativePath === '.gitmodules' || relativePath === '.supacharger/skills-lock.json' || relativePath.startsWith('.agents/')) {
    return { ownership: 'developer-owned', guidance: 'Preserved during Core updates. Optional contributor instructions load only when installed; legacy directives are inactive. Read docs/agents/agent-guidance.md.' };
  }

  if (relativePath === 'test' || relativePath.startsWith('test/')) {
    return { ownership: 'developer-owned', guidance: 'Do not create or restore application tests; Supacharger Core does not install, generate or run them.' };
  }

  if (relativePath.startsWith('extensions/') || relativePath.startsWith('tools/supacharger-extensions/')) {
    return { ownership: 'canonical-extension-tooling', guidance: 'Core owns bundles and installer. Read docs/agents/extensions.md; these are not automatically installed application runtime files.' };
  }
  if (/^supabase\/migrations\/\d{14}_ext_[a-z0-9_]+\.sql$/.test(relativePath)) {
    return { ownership: 'forward-only-migration', guidance: 'Optional extension migration: verify the extension lock. Never rewrite installed history; apply reviewed new migrations separately from file installation.' };
  }
  if (relativePath.startsWith('src/supacharger.extensions/') || relativePath.startsWith('supabase/functions/_shared/extensions/') || relativePath.startsWith('supabase/functions/ext-') ||
      relativePath.startsWith('docs/extensions/') || relativePath.startsWith('.supacharger/extensions/')) {
    return { ownership: 'extension-managed', guidance: 'Read .supacharger/extensions/<id>.json and docs/extensions/<id>/INSTALL.md. Keep product adapters outside extension source. Installation does not advance the Core lock.' };
  }

  if (
    relativePath === 'src/assets/svgr/ui/inline-loader.svg' ||
    relativePath === 'src/assets/svgr/ui/inline-loader-dark.svg' ||
    relativePath === 'src/assets/svgr/ui/image-loader.svg'
  ) {
    return {
      ownership: 'developer-owned',
      guidance:
        'Brand-customisable loading asset. CLI updates must preserve this exact file; import it through SVGR and replace it in place to customise the animation.',
    };
  }

  if (
    relativePath === 'src/proxy.ts' ||
    relativePath === 'src/lib/supabase/client.ts' ||
    relativePath === 'src/lib/supabase/server.ts' ||
    relativePath === 'src/lib/supabase/supacharger/proxy.ts' ||
    relativePath === 'postcss.config.mjs' ||
    relativePath === 'tailwind.config.ts' ||
    relativePath === 'supabase/functions/_shared/image-target-contract.ts' ||
    relativePath === 'supabase/functions/_shared/image-transform.ts' ||
    relativePath === 'supabase/functions/process-image-upload' ||
    relativePath.startsWith('supabase/functions/process-image-upload/') ||
    relativePath === 'components.json' ||
    relativePath === 'tsconfig.json'
  ) {
    return {
      ownership: 'cli-managed-core',
      guidance:
        'Canonical shared implementation or schema. Follow the matching authentication, database, or billing guidance, land changes in core first, and propagate them through the CLI.',
    };
  }

  if (
    relativePath === 'package.json' ||
    relativePath === 'package-lock.json' ||
    relativePath === 'supabase/config.toml'
  ) {
    return {
      ownership: 'merge-managed-contract',
      guidance:
        'Core supplies requirements, but the application owns additional values. Merge the canonical contract without byte-replacing product dependencies or project configuration.',
    };
  }

  if (relativePath === 'tailwind.project.config.ts') {
    return {
      ownership: 'developer-owned',
      guidance:
        'Preserved Tailwind preset for project and installed-extension configuration. Add Tailwind plugins or additive configuration here; do not edit the Core-managed tailwind.config.ts.',
    };
  }

  if (relativePath === 'supabase/migrations' || relativePath.startsWith('supabase/migrations/')) {
    return {
      ownership: 'forward-only-history',
      guidance:
        'Permanent project migration history. Copy only new Core migrations; never replace, delete, reorder, or rewrite an installed migration.',
    };
  }

  if (relativePath === '.supacharger/migration-aliases.json') {
    return {
      ownership: 'developer-owned',
      guidance:
        'Audited canonical-to-consumer mapping for an intentionally adapted immutable migration. The CLI validates targets and preserves this file.',
    };
  }

  if (
    relativePath === 'src/lib/stripe' ||
    relativePath.startsWith('src/lib/stripe/') ||
    relativePath === 'src/features' ||
    relativePath.startsWith('src/features/') ||
    relativePath === 'src/lib/supabase/types.ts'
  ) {
    return {
      ownership: 'application-integration',
      guidance:
        'Application schema and product integration code. Preserve product-specific shapes while satisfying the stable interfaces used by protected Core routes.',
    };
  }

  if (relativePath === 'src/supacharger.config.ts') {
    return {
      ownership: 'developer-owned',
      guidance: 'Application configuration seam. CLI updates must preserve this file.',
    };
  }

  if (
    relativePath === 'src/supacharger/organisations' ||
    relativePath.startsWith('src/supacharger/organisations/') ||
    relativePath === 'src/app/(supacharger)/(authenticated)/account/organisation' ||
    relativePath.startsWith('src/app/(supacharger)/(authenticated)/account/organisation/') ||
    relativePath === 'src/app/(supacharger)/(authenticated)/[handle]/settings' ||
    relativePath.startsWith('src/app/(supacharger)/(authenticated)/[handle]/settings/') ||
    relativePath === 'src/app/(supacharger)/api/organisations' ||
    relativePath.startsWith('src/app/(supacharger)/api/organisations/')
  ) {
    return {
      ownership: 'cli-managed-core',
      guidance:
        'Canonical organisation chooser, settings, service, or server-validation behaviour. Land changes in Core first, keep exact managed consumers byte-identical, avoid parallel pages for managed public routes, and preserve product-only UI through page, navigation, chrome, profile, and CSS adapters.',
    };
  }

  if (relativePath === 'supabase/functions/_shared/image-targets.ts') {
    return {
      ownership: 'developer-owned',
      guidance:
        'Application image-target policy. Keep destinations and transform settings in this file; CLI updates must preserve it.',
    };
  }

  if (relativePath === 'src/app/layout.tsx') {
    return {
      ownership: 'developer-owned-template',
      guidance:
        'Installed root-layout template. Keep it wired to the protected root-document helper, but preserve application fonts, providers, body classes, and intentional head additions during CLI updates.',
    };
  }

  if (relativePath === 'src/app/(project)' || relativePath.startsWith('src/app/(project)/')) {
    return {
      ownership: 'developer-owned',
      guidance:
        'Application routes and presentation. Preserve these paths during Core updates; reusable framework boundaries belong in the protected route group.',
    };
  }

  if (relativePath === 'src/supacharger.adapters' || relativePath.startsWith('src/supacharger.adapters/')) {
    return {
      ownership: 'developer-owned',
      guidance:
        'Application adapters for authentication, account chrome and extensions, billing, organisations, and post-sign-in onboarding. Account chrome may supply a header, application sidebar, and footer around the managed settings shell. CLI updates must preserve this path.',
    };
  }

  if (
    relativePath === 'src/i18n/config.ts' ||
    relativePath === 'src/i18n/request.ts' ||
    relativePath === 'messages' ||
    relativePath.startsWith('messages/')
  ) {
    return {
      ownership: 'developer-owned',
      guidance:
        'Application localisation seam. The CLI preserves locale configuration and secondary catalogues, and merges only missing or empty canonical English keys.',
    };
  }

  if (relativePath === 'src/styles/project.css') {
    return {
      ownership: 'developer-owned',
      guidance: 'Application styling seam. Keep the project name accurate; CLI updates must preserve this file.',
    };
  }

  if (relativePath === 'src/styles/supacharger-auth.css') {
    return {
      ownership: 'developer-owned',
      guidance:
        'Authentication presentation seam for managed sc-auth-* markup. The CLI installs a missing starter and preserves established product CSS.',
    };
  }

  if (
    relativePath === 'src/styles/supacharger-account.css' ||
    relativePath === 'src/styles/supacharger-organisations.css'
  ) {
    return {
      ownership: 'developer-owned',
      guidance:
        'Complete presentation seam for managed semantic account or organisation markup. The CLI installs a missing starter and preserves established product CSS.',
    };
  }

  if (relativePath === 'src/supacharger.adapters/auth/auth-sidecar.tsx') {
    return {
      ownership: 'developer-owned',
      guidance:
        'Authentication branding seam. Export AuthSidecar and AuthMobileBrand; the CLI installs a missing starter and preserves product presentation.',
    };
  }

  if (relativePath === '.supacharger/managed-files.json') {
    return {
      ownership: 'cli-managed-core',
      guidance: 'Canonical versioned ownership manifest. Consumer copies must be byte-identical to Core.',
    };
  }

  if (relativePath.startsWith('.supacharger/')) {
    return {
      ownership: 'cli-metadata',
      guidance: 'CLI-owned installation metadata. Do not store application settings here.',
    };
  }

  if (
    relativePath === 'src/supacharger' ||
    relativePath.startsWith('src/supacharger/') ||
    relativePath === 'src/app/(supacharger)' ||
    relativePath.startsWith('src/app/(supacharger)/') ||
    relativePath === 'src/lib/supabase/supacharger' ||
    relativePath.startsWith('src/lib/supabase/supacharger/')
  ) {
    return {
      ownership: 'cli-managed-core',
      guidance:
        'Protected core implementation. Change it here as a core maintainer; consumers receive it through the CLI.',
    };
  }

  if (relativePath === 'src/components/sc_demo' || relativePath.startsWith('src/components/sc_demo/')) {
    return {
      ownership: 'developer-owned-example',
      guidance:
        'Replaceable example presentation intended for application customisation. Keep demo-only assets here; import UI SVGs through SVGR so deleting the demo removes its assets too.',
    };
  }

  if (relativePath === 'src/components/sc_widgets' || relativePath.startsWith('src/components/sc_widgets/')) {
    return {
      ownership: 'developer-owned-widget',
      guidance:
        'Supacharger-provided editable widget installed during project initialisation and preserved by Core updates. Later widget additions require an explicit reviewed copy. Read docs/agents/project-widgets.md; keep shadcn primitives in components/ui and complete demonstrations in components/sc_demo.',
    };
  }

  if (relativePath === 'tools/supacharger-mcp' || relativePath.startsWith('tools/supacharger-mcp/') || relativePath === 'tools/supacharger-skills' || relativePath.startsWith('tools/supacharger-skills/')) {
    return {
      ownership: 'core-tooling',
      guidance: 'Repository-maintainer tooling. The knowledge MCP stays read-only; the public skills installer performs explicitly requested local installations and is distributed through the CLI.',
    };
  }

  if (relativePath === 'AGENTS.md' || relativePath.startsWith('docs/agents/')) {
    return {
      ownership: 'core-guidance',
      guidance: 'Canonical repository guidance maintained with the implementation.',
    };
  }

  return {
    ownership: 'unclassified-shared-or-application',
    guidance:
      'Not automatically CLI-owned. Inspect its callers and document an explicit seam before treating it as managed core.',
  };
}

export async function readGuidance(topic) {
  const relativePath = guidanceFiles[topic];
  if (!relativePath) {
    throw new Error(`Unknown guidance topic: ${topic}`);
  }
  return fs.readFile(resolveRepositoryPath(relativePath), 'utf8');
}

async function renderDirectory(absoluteDirectory, relativeDirectory, depth, maxDepth, lines) {
  const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    if (ignoredTreeNames.has(entry.name) || entry.name.startsWith('.env')) continue;

    const relativePath = path.join(relativeDirectory, entry.name);
    const displayPath = relativePath.replaceAll(path.sep, '/');
    lines.push(`${'  '.repeat(depth)}${entry.isDirectory() ? '📁' : '📄'} ${displayPath}`);

    if (entry.isDirectory() && depth < maxDepth) {
      await renderDirectory(path.join(absoluteDirectory, entry.name), relativePath, depth + 1, maxDepth, lines);
    }
  }
}

export async function projectTree(area = '.', maxDepth = 3) {
  const absoluteArea = resolveRepositoryPath(area);
  const stat = await fs.stat(absoluteArea);
  if (!stat.isDirectory()) throw new Error('Tree area must be a directory.');

  const relativeArea = path.relative(repositoryRoot, absoluteArea);
  const lines = [];
  await renderDirectory(absoluteArea, relativeArea, 0, maxDepth, lines);
  return lines.join('\n');
}

export async function searchGuidance(query) {
  const normalisedQuery = query.trim().toLowerCase();
  if (!normalisedQuery) throw new Error('Search query must not be empty.');

  const matches = [];
  for (const [topic, relativePath] of Object.entries(guidanceFiles)) {
    const content = await fs.readFile(resolveRepositoryPath(relativePath), 'utf8');
    const lines = content.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].toLowerCase().includes(normalisedQuery)) continue;
      matches.push({
        topic,
        path: relativePath,
        line: index + 1,
        text: lines[index].trim(),
      });
      if (matches.length >= 25) return matches;
    }
  }
  return matches;
}
