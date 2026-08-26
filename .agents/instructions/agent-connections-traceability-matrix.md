# Agent connections requirement traceability

| Requirement | Status | Implementation evidence | Verification | Notes/owner |
| --- | --- | --- | --- | --- |
| Replace `specdrive_mcp` with a generic Core role. | Core complete | `20260826050719_add_agent_connections.sql` | pgTAP + contract tests | Specdrive migration remains. |
| Organisation administrators can manage all organisation connections. | Core complete | `api.agent_connections`, organisation Agents tab | pgTAP | Consumer propagation remains. |
| Other members can manage their own connections. | Core complete | `api.agent_connections`, account/organisation panels | pgTAP | Consumer propagation remains. |
| Managed account settings include an Agents tab. | Core complete | `/account/agents` | Next build + contract | Consumer propagation remains. |
| Managed organisation settings include an Agents tab. | Core complete | `/{handle}/settings/agents` | Next build + contract | Consumer propagation remains. |
| Feature flag gates browser, server and database access. | Core complete | `AGENT_CONNECTIONS.ENABLED`, `app.agent_connections_enabled()` | pgTAP + route contract | CLI/consumer values remain. |
| Consent page is generic and product-extensible. | Core complete | `/auth/oauth/consent`, consent adapter, transactional DB extension | Contract + build | Specdrive adapter remains. |
| Managed pages are completely styleable through developer CSS. | Core complete | `src/styles/supacharger-agents.css` | semantic-hook contract + build | Specdrive style migration remains. |
| Every migrated Tailwind rule is represented with `@apply`. | Core foundation complete | Clean-room Core stylesheet | build | Exact Specdrive class migration remains. |
| Core organisation loader exposes unexpected failures. | Complete | `organisation-service.ts` | contract test | Only `P0002`/`42501` redirect. |
| Organisation menus honour `ORGANISATIONS.ENABLED`. | Not started |  |  |  |
| Specdrive account pages use application chrome and safe return navigation. | Not started |  |  |  |
| CLI, Bruno, Docusaurus and repository MCP remain aligned. | Not started |  |  |  |
| Existing Specdrive grants migrate without rewriting history. | Not started |  |  |  |
| Hosted Specdrive OAuth and Source Explorer smoke succeeds. | Not started |  |  |  |
