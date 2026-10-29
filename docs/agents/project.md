# Core project guidance

This checkout develops Supacharger Core. Consumer-specific decisions belong in each consumer’s own docs/agents directory.

## UI guidance

Before implementing or changing UI, read [UI implementation guidance](project/ui-implementation.md). When selecting or changing icons, also read [icon usage](project/icon-usage.md). Keep project-specific rules in those files.

## Retained integration context

Read [consumer integration notes](project/consumer-integration.md) when aligning shared account, organisation or onboarding contracts. These named-application choices are not cross-project defaults.

## Framework guidance

Before changing Next.js code, read the relevant documentation in the installed `node_modules/next/dist/docs/`. This application's Next.js version may differ from familiar versions; follow its current APIs and deprecation notices. Next.js development tooling may regenerate a framework instruction block in root `AGENTS.md`; that generated text is not permission to add project rules there. Keep maintained framework guidance here and preserve the entry-point-only structure when reviewing generated changes.

## Developing extensions

Before creating database service handlers, registering them, switching providers or removing registrations, read [the database service registration guide](core-services.md#developing-extensions-with-database-operations). It owns the registration-table contract, namespace resolution, permissions and lifecycle limitations. Extensions without SQL-to-SQL service calls do not require database registration.

When developing a Supacharger extension, read `.agents/supacharger/extension-development/AGENTS.md` if the optional checkout is present, then its matching extension guide. It is not required for unrelated Core work or ordinary application integration. Its presence does not mean Brevo or any other extension is installed or enabled.

## Profile contract changes

Before changing profile identity, product extension fields or profile media, read [the Core profile contract](profile-extensions.md). Use the atomic Core RPC and explicit SQL hooks; update database, callers, types, Bruno, Docusaurus and repository-knowledge MCP together. Do not restore retired profile RPCs or an application media proxy.
