# Setup documentation and distribution review

## Changes

Manual prerequisites have their own Getting Started page. Agent setup begins in an empty project folder and uses the remote bootstrap payload before Core is present. The full advanced manual guide remains alongside Easy setup; Setup Core is the final local configuration stage.

`docs/reports/sc-install/first-install-handhold-me.md` is the developer-owned live record supplied by the starter. The sibling `first-install-handhold-me-core.md` is explicitly DO NOT EDIT and exact CLI-managed. Updates refresh the latter and preserve the former. Shared guidance, installation references, anatomy and MCP ownership descriptions use this distinction.

The MCP working-rules and agent-guidance topics include the production Markdown index and full documentation URLs. Remote bootstrap instructions require manual system prerequisites and continue from installed guidance after cloning.

The previously partial guidance and bootstrap changes are reconciled under the human's explicit instruction to complete parity and publish. Consumer updates preserve application configuration, migration histories and existing installation progress.

## Existing work included

Login email validation uses the current input value, displays accessible errors and clears passwordless pending state on failure. Reports remain tracked but excluded from Vercel uploads and Next.js runtime traces. Contributor icon conventions are published through their separate Git submodule before the Core pointer advances.

## Verification boundary

No database or API contract changes are introduced and no migration is required. Documentation build, TypeScript, MCP checks and exact consumer file comparison are checked during publication. Live deployment and a clean-machine installation are outside this verification; source publication does not establish their success.
