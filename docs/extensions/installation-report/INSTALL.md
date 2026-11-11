# Installing the installation report

Supacharger Core ships this temporary local bundle. Install it with the reviewed local extension installer. It reads the developer-owned `docs/reports/sc-install/first-install-handhold-me.md` file and never writes checklist state.

The enabled extension contributes `page-hook.tsx`. Core discovers the hook during `next.config` preparation, so no application layout import is required. The report is disabled in production mode and refreshes its Server Component while the popup is open.

When installation is complete, an agent must remove all targets listed in `extension.json`. Deleting `src/app/(project)/(extensions)/(sc_extensions)/(installation-report)/` removes the runtime UI; restarting development or building regenerates the shared page-hook registry without it. Also remove its installed documentation under `docs/extensions/installation-report/` and `docs/agents/extensions/supacharger-ext-installation-report/`. No other application source requires editing.
