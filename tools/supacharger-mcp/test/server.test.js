import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.resolve(testDirectory, '../src/index.js');

test('serves repository resources and read-only tools over stdio', async () => {
  const client = new Client({ name: 'supacharger-mcp-test', version: '0.1.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    stderr: 'pipe',
  });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.ok(tools.some((tool) => tool.name === 'supacharger_get_guidance'));
    assert.ok(tools.some((tool) => tool.name === 'supacharger_classify_path'));

    const result = await client.callTool({
      name: 'supacharger_classify_path',
      arguments: { path: 'src/supacharger.config.ts' },
    });
    assert.match(result.content[0].text, /developer-owned/);

    const projectBillingTest = await client.callTool({
      name: 'supacharger_classify_path',
      arguments: { path: 'test/project-billing-schema-contract.test.mjs' },
    });
    assert.match(projectBillingTest.content[0].text, /developer-owned-contract-test/);

    const { resources } = await client.listResources();
    assert.ok(resources.some((resource) => resource.uri === 'supacharger://project/ownership'));
    assert.ok(resources.some((resource) => resource.uri === 'supacharger://project/cli_upgrades'));
    assert.ok(resources.some((resource) => resource.uri === 'supacharger://project/extensions'));
    assert.ok(resources.some((resource) => resource.uri === 'supacharger://project/input_validation'));
    assert.ok(resources.some((resource) => resource.uri === 'supacharger://project/loading_ui'));
  } finally {
    await client.close();
  }
});
