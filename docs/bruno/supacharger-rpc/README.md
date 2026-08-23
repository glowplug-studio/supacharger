# Supacharger RPC Bruno collection

This collection documents and exercises the canonical client-callable RPCs in Supacharger's `api` schema. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and a signed-in user's `SUPABASE_ACCESS_TOKEN` in a local Bruno environment before running authenticated requests.

The collection and parity checker are exact CLI-managed Core assets. Managed consumers receive byte-identical copies. Do not add Specdrive, SnapScreen, Wakekeeper, or other consumer-specific RPCs here. Promote a reusable database contract into Supacharger before documenting it in this collection.

Run `npm run check:bruno-rpcs` whenever migrations change. In Core, the check requires one request for every current `api` RPC and rejects stale requests. In a managed consumer, it requires every canonical Supacharger RPC while allowing extra product-owned RPCs. Server-only `api_edge` functions are intentionally excluded because they require privileged credentials and mutate internal Stripe projections; their contracts remain documented in migrations and server code without placing secret-key workflows in the client RPC collection.
