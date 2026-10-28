# Core project guidance

This checkout develops Supacharger Core. Consumer-specific decisions belong in each consumer’s own docs/agents directory.

## UI guidance

Before implementing or changing UI, read [UI implementation guidance](project/ui-implementation.md). When selecting or changing icons, also read [icon usage](project/icon-usage.md). Keep project-specific rules in those files.

## Retained integration context

Read [consumer integration notes](project/consumer-integration.md) when aligning shared account, organisation or onboarding contracts. These named-application choices are not cross-project defaults.

## Developing extensions

When developing a Supacharger extension, read `.agents/supacharger/extension-development/AGENTS.md` if the optional checkout is present, then its matching extension guide. It is not required for unrelated Core work or ordinary application integration. Its presence does not mean Brevo or any other extension is installed or enabled.

## Profile contract changes

Before changing profile identity, product extension fields or profile media, read [the Core profile contract](profile-extensions.md). Use the atomic Core RPC and explicit SQL hooks; update database, callers, types, Bruno, Docusaurus and repository-knowledge MCP together. Do not restore retired profile RPCs or an application media proxy.
