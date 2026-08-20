# Supacharger agent workflow

## Orient

1. Read `AGENTS.md`.
2. Classify every affected file as CLI-managed, developer-owned, documentation, tooling, or unresolved shared integration.
3. Inspect existing interfaces before introducing a new seam.

## Compare and promote

For reusable changes, compare the core with SnapScreen and Wakekeeper. Inspect Specdrive when its non-visual contracts or unique functionality are relevant, but treat its Untitled UI presentation as licence-restricted.

Report:

- current core behaviour;
- unique consumer behaviour;
- compatibility and migration risks;
- recommended canonical behaviour; and
- any decision still required from the human owner.

After approval, update the core first, then human documentation, then consumers.

## Protect updates

Never solve updateability by overwriting the complete application. CLI changes must distinguish managed files from developer files, detect edits against the installed baseline, preserve configuration, and surface conflicts.

Configuration schema evolution should provide defaults or an explicit migration. It must not silently replace `src/supacharger.config.ts`.

The Bruno collection at `docs/bruno/supacharger-rpc/` must remain in parity with the canonical client-callable `api` RPCs. Every RPC migration must update its request example and pass `npm run check:bruno-rpcs`. Consumer-only RPCs remain in their owning application and must not be copied into the core collection.

## Verify

Run the narrowest relevant checks first. For cross-project interface changes, verify each affected application independently and report pre-existing failures separately from regressions introduced by the change.
