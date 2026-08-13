# Supacharger repository MCP

This read-only local MCP gives coding agents a durable understanding of the Supacharger core mission, ownership model, project structure, and promotion workflow.

## Run

```bash
npm install
npm start
```

The server uses stdio and is registered for Codex by the repository's `.codex/config.toml`.

## Capabilities

- Read curated mission, ownership, localisation, billing, workflow, and agent guidance resources.
- Classify repository paths before editing them.
- Render a filtered project tree.
- Search curated guidance without exposing environment files.

The ownership guidance includes the styling contract: `src/supacharger/styles/` is CLI-managed, while `src/styles/project.css` is the named application's developer-owned styling seam and must survive core updates. Agents can retrieve the full rules through the `ownership` guidance resource or classify either path directly.

The MCP is descriptive and read-only. It does not supersede `AGENTS.md`, edit files, run migrations, or access sibling applications.

The localisation resource records the locale-neutral routing contract and identifies `src/i18n/` plus `messages/` as developer-owned paths that the CLI must preserve.

The billing resource records the supported Stripe SDK/API tuple, schema ownership, durable event contract, required event list, secrets, and verification rules. It is descriptive only and cannot access Stripe, read secrets, or apply migrations.
