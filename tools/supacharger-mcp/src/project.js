import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));

export const repositoryRoot = path.resolve(sourceDirectory, '../../..');

const ignoredTreeNames = new Set([
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'build',
  'coverage',
  'node_modules',
  'out',
]);

const guidanceFiles = {
  mission: 'docs/agents/project-overview.md',
  ownership: 'docs/agents/ownership.md',
  localisation: 'docs/agents/localisation.md',
  billing: 'docs/agents/billing.md',
  workflow: 'docs/agents/workflow.md',
  instructions: 'AGENTS.md',
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
        segment.startsWith('.env')
    )
  ) {
    throw new Error('That path is excluded from the repository knowledge MCP.');
  }

  return absolutePath;
}

export function classifyPath(inputPath) {
  const relativePath = normaliseRelativePath(inputPath);

  if (
    relativePath === 'src/lib/stripe' ||
    relativePath.startsWith('src/lib/stripe/') ||
    relativePath === 'src/features/pricing' ||
    relativePath.startsWith('src/features/pricing/') ||
    relativePath === 'supabase/migrations' ||
    relativePath.startsWith('supabase/migrations/') ||
    relativePath === 'src/lib/supabase/types.ts' ||
    [
      'get-customer-id.ts',
      'get-or-create-customer.ts',
      'get-subscription.ts',
      'upsert-user-subscription.ts',
    ].some((file) => relativePath === `src/features/account/controllers/${file}`)
  ) {
    return {
      ownership: 'cli-managed-core',
      guidance: 'Canonical billing implementation or schema. Follow the billing guidance, land changes in core first, and propagate them through the CLI.',
    };
  }

  if (relativePath === 'src/supacharger.config.ts') {
    return {
      ownership: 'developer-owned',
      guidance: 'Application configuration seam. CLI updates must preserve this file.',
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
      guidance: 'Application localisation seam. The CLI installs starters, then preserves locale configuration and the complete messages directory.',
    };
  }

  if (relativePath === 'src/styles/project.css') {
    return {
      ownership: 'developer-owned',
      guidance: 'Application styling seam. Keep the project name accurate; CLI updates must preserve this file.',
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
      guidance: 'Protected core implementation. Change it here as a core maintainer; consumers receive it through the CLI.',
    };
  }

  if (relativePath === 'src/components/sc_demo' || relativePath.startsWith('src/components/sc_demo/')) {
    return {
      ownership: 'developer-owned-example',
      guidance: 'Replaceable example presentation intended for application customisation.',
    };
  }

  if (relativePath === 'tools/supacharger-mcp' || relativePath.startsWith('tools/supacharger-mcp/')) {
    return {
      ownership: 'core-tooling',
      guidance: 'Repository-maintainer tooling. Keep it read-only unless a mutating design is explicitly approved.',
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
    guidance: 'Not automatically CLI-owned. Inspect its callers and document an explicit seam before treating it as managed core.',
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
      await renderDirectory(
        path.join(absoluteDirectory, entry.name),
        relativePath,
        depth + 1,
        maxDepth,
        lines
      );
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
