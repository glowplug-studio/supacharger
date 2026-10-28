# Agent entry point

Read these files in order before working in this repository:

1. `.agents/supacharger/guidance.md` for shared working rules and protected-contract gates.
2. `docs/agents/project.md` for this application's own instructions and linked local topics.
3. `docs/agents/agent-guidance.md` for the task-specific guidance index.
4. `.agents/supacharger/core-development/AGENTS.md` for optional Core contributor instructions, only if installed. Do not install it merely to orient yourself.

Durable guidance lives in `docs/agents/`. Before UI work read `docs/agents/project/ui-implementation.md` and `docs/agents/project/icon-usage.md`; before creating or editing a report read `docs/agents/reporting.md`. The repository MCP exposes guidance from its own checkout, not another application's policies.

`.agents/project/AGENTS.md` is a compatibility routing pointer. Existing task procedures and skills remain under `.agents/instructions/` and `.agents/skills/`. Read them when relevant. `.agents/legacy/original-agents.md` is inactive historical material, not active instructions.


For profile identity, product fields and profile media changes, read `docs/agents/profile-extensions.md` before implementation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
