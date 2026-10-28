# Agent guidance consolidation

Created: 2026-10-28T20:30:37+07:00 (Asia/Bangkok)
Last edited: 2026-10-29T03:18:44+07:00 (Asia/Bangkok)

## Final disposition

**Completed and published.** The guidance consolidation is published in Core 0cffa85, Wakekeeper 29fbc41, SnapScreen 4bae837 and Specdrive 8ff4ff5. Shared extension preparation and reporting policy were byte-compared across all four release checkouts. Application-specific guidance remains project-owned; no whole-tree byte parity is claimed. The former “no commits or pushes” statement below is historical.

Verification: published release records, shared-file comparisons, 16 existing repository-knowledge MCP checks and Docusaurus build/type checking. No runtime or public contract changes in this report-only reconciliation; no further Docusaurus or Bruno edit is required.

## Archived inspection

<details>
<summary>Read the original inspection and recommendations</summary>

Implemented the human-approved docs/agents convention across Core, Wakekeeper, SnapScreen and Specdrive. Root entry points and shared guidance are byte-identical; per-project decisions remain in each checkout's project.md and linked topics. Moved UI/icon files and other durable project rules out of .agents/project/rules. Preserved Specdrive presentation rules and Wakekeeper mappings. Consumer auth references are locally scoped and retained rather than overwritten with newer Core behaviour.

Consolidated duplicate approval definitions and SVG/loading instructions into links. Email template guidance documents HTML resources and remains available. Added report metadata policy, MCP topics and Docusaurus location/ownership explanations. Legacy .agents/project/AGENTS.md files are routing pointers only.

Historical reports are not bulk renamed or assigned invented creation timestamps. The current extension tracker and prior audit receive metadata on this edit. No runtime, API, database or migration behaviour changed. No commits or pushes. Shared guidance changes are intentional local drift pending a separately authorised release; Core locks are not advanced to an unpublished commit.

Verification: 16 existing MCP checks passed; direct shared-entry byte comparisons and moved-file Markdown links passed. Documentation typecheck and build passed with existing blog/LLM-description warnings. No consumer builds were needed for guidance-only changes. Named-consumer account/organisation/onboarding notes are separately scoped under docs/agents/project/consumer-integration.md.

</details>
