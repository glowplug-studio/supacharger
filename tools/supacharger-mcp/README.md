# Supacharger repository MCP

This read-only local MCP gives coding agents a durable understanding of the Supacharger core mission, ownership model, project structure, and promotion workflow.

## Run

```bash
npm install
npm start
```

The server uses stdio and is registered for Codex by the repository's `.codex/config.toml`.

## Capabilities

- Read curated mission, ownership, workflow, and agent guidance resources.
- Classify repository paths before editing them.
- Render a filtered project tree.
- Search curated guidance without exposing environment files.

The MCP is descriptive and read-only. It does not supersede `AGENTS.md`, edit files, run migrations, or access sibling applications.
