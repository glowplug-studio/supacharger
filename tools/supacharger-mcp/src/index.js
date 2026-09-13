import { pathToFileURL } from 'node:url';
import { z } from 'zod';

import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';

import {
  classifyPath,
  projectTree,
  readGuidance,
  readEmailTemplate,
  emailTemplateFiles,
  repositoryRoot,
  resolveRepositoryPath,
  searchGuidance,
} from './project.js';

const guidanceTopics = [
  'email_templates',
  'mission',
  'ownership',
  'cli_upgrades',
  'extensions',
  'localisation',
  'authentication',
  'mobile_auth',
  'database',
  'input_validation',
  'image_transforms',
  'loading_ui',
  'profile',
  'account_settings',
  'organisations',
  'billing',
  'workflow',
  'instructions',
  'agent_guidance',
  'working_rules',
];

function textResult(text) {
  return { content: [{ type: 'text', text }] };
}

export function createServer() {
  const server = new McpServer(
    { name: 'supacharger-repository', version: '0.1.0' },
    {
      instructions:
        'Use supacharger_get_guidance before changing shared behaviour. Classify affected paths before editing. This server is read-only; AGENTS.md and the repository implementation remain authoritative.',
    },
  );

  for (const template of Object.keys(emailTemplateFiles)) {
    server.registerResource(
      `supacharger-email-${template}`,
      `supacharger://email-templates/${template}`,
      { title: `Supacharger email: ${template}`, description: 'Complete copyable HTML email source.', mimeType: 'text/html' },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/html', text: await readEmailTemplate(template) }] }),
    );
  }
  server.registerTool(
    'supacharger_get_email_template',
    {
      title: 'Get email template HTML',
      description: 'Return optional email HTML from resources/sc-email-templates. Read email_templates guidance before applying through the connected Supabase MCP when requested.',
      inputSchema: { template: z.enum(Object.keys(emailTemplateFiles)) },
    },
    async ({ template }) => textResult(await readEmailTemplate(template)),
  );

  for (const topic of guidanceTopics) {
    server.registerResource(
      `supacharger-${topic}`,
      `supacharger://project/${topic}`,
      {
        title: `Supacharger ${topic}`,
        description: `Curated Supacharger repository guidance: ${topic}.`,
        mimeType: 'text/markdown',
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: await readGuidance(topic),
          },
        ],
      }),
    );
  }

  server.registerTool(
    'supacharger_get_guidance',
    {
      title: 'Get Supacharger guidance',
      description:
        'Read canonical guidance for mission, ownership, CLI upgrades, extensions, localisation, authentication, database, validation, media, profiles, accounts, organisations, billing or workflow. Extension token delivery is deferred.',
      inputSchema: {
        topic: z.enum(guidanceTopics).describe('Guidance topic to read.'),
      },
    },
    async ({ topic }) => textResult(await readGuidance(topic)),
  );

  server.registerTool(
    'supacharger_classify_path',
    {
      title: 'Classify Supacharger path ownership',
      description:
        'Determine whether a repository path is CLI-managed, developer-owned, guidance, tooling, or unresolved shared code.',
      inputSchema: {
        path: z.string().min(1).describe('Repository-relative path to classify.'),
      },
    },
    async ({ path: inputPath }) => {
      const absolutePath = resolveRepositoryPath(inputPath);
      let exists = true;
      try {
        await import('node:fs/promises').then(({ access }) => access(absolutePath));
      } catch {
        exists = false;
      }
      return textResult(
        JSON.stringify(
          {
            path: inputPath,
            exists,
            ...classifyPath(inputPath),
          },
          null,
          2,
        ),
      );
    },
  );

  server.registerTool(
    'supacharger_project_tree',
    {
      title: 'Show Supacharger project tree',
      description: 'Render a filtered repository tree without secrets, dependencies, build output, or Git internals.',
      inputSchema: {
        area: z.string().default('.').describe('Repository-relative directory to inspect.'),
        depth: z.number().int().min(0).max(5).default(3).describe('Maximum recursion depth.'),
      },
    },
    async ({ area, depth }) => textResult(await projectTree(area, depth)),
  );

  server.registerTool(
    'supacharger_search_guidance',
    {
      title: 'Search Supacharger guidance',
      description:
        'Search curated repository and agent guidance. This does not search environment files or arbitrary source content.',
      inputSchema: {
        query: z.string().min(1).describe('Case-insensitive text to search for.'),
      },
    },
    async ({ query }) => textResult(JSON.stringify(await searchGuidance(query), null, 2)),
  );

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void serveStdio(createServer);
  console.error(`Supacharger repository MCP serving ${repositoryRoot}`);
}
