# Supacharger agent workflow

## Orient

1. Read `AGENTS.md`.
2. Inspect `.supacharger/managed-files.json`, the consumer's `.supacharger/core-lock.json` when present, and the repository ownership rules.
3. Classify every affected file as CLI-managed, developer-owned, documentation, tooling, or unresolved shared integration.
4. Classify every protected-contract change under the project core gate or the Supacharger Core gate before seeking approval.
5. Inspect existing interfaces before introducing a new seam.

## Compare and promote

For reusable changes, compare the core with SnapScreen and Wakekeeper. Inspect Specdrive when its non-visual contracts or unique functionality are relevant, but treat its Untitled UI presentation as licence-restricted.

Report:

- current core behaviour;
- unique consumer behaviour;
- compatibility and migration risks;
- recommended canonical behaviour; and
- any decision still required from the human owner.

For a Supacharger Core gate report, state that Supacharger Core is affected, identify every consumer requiring synchronisation, and update Supacharger Core first after approval, then human documentation, then consumers. For a project core gate report, state that Supacharger Core and other consumers are unaffected, then change only the owning application's protected contract after approval.

## Protect updates

Never solve updateability by overwriting the complete application. CLI changes must distinguish managed files from developer files, detect edits against the installed baseline, preserve configuration, and surface conflicts.

Configuration schema evolution should provide defaults or an explicit migration. It must not silently replace `src/supacharger.config.ts`.

The exact managed Bruno collection documents canonical client-callable `api` RPCs. Every shared RPC migration must update its request example. Consumers may keep additional product RPC documentation separately; the CLI does not install or run a parity checker.

## Verify

Run the narrowest relevant checks first. For cross-project interface changes, verify each affected application independently and report pre-existing failures separately from regressions introduced by the change.
