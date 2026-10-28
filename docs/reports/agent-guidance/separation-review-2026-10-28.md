# Agent guidance separation review

Created: 2026-10-28; time unknown (Asia/Bangkok)
Last edited: 2026-10-28T20:30:37+07:00 (Asia/Bangkok)

28 October 2026. Review only; no instruction files moved or rewritten. Scope: all 21 Markdown files (1,138 lines) in Core docs/agents, compared with the same 21 paths in Wakekeeper, SnapScreen and Specdrive. Reviewed unique consumer additions and differences, existing instruction routing, ownership manifest, MCP topic routing and the recently added project UI/icon structure. This assesses document responsibility, not runtime correctness, hosted configuration or external provider documentation.

## Conclusion

The intended separation exists, but it is not consistently applied. The earlier explanation that docs/agents contains explanations whereas rules contains instructions was too absolute. Shared technical contracts naturally contain mandatory requirements. Their imperative wording does not make them project working rules.

Classify by subject, owner and lifetime:

| Material | Canonical home |
| --- | --- |
| Shared implementation contracts, invariants, supported integration and usage | docs/agents/<topic>.md |
| Application-specific decisions or behavioural constraints for agents | .agents/project/rules/<topic>.md, explicitly linked from project AGENTS.md |
| Shared agent permissions, approval boundaries and instruction routing | .agents/supacharger/guidance.md |
| Core maintainer promotion/release procedures and named-consumer synchronisation policy | .agents/supacharger/core-development/ |
| A concrete agent execution plan | .agents/instructions/ |
| Human review, audit, decision history or progress | docs/reports/<topic>/ |
| Reusable, separately maintained task workflow | A skill, where genuinely useful; do not create one merely to relocate prose |

Do not move universal validation, authentication or migration safeguards into optional project rules. Do not make consumer agents depend on an optional Core contributor checkout for required runtime contracts. Existing installation-checklist locations are an explicit established exception: retain them unless that contract is deliberately changed.

## Complete Core inventory

All paths below are relative to docs/agents/. “Extract” means retain the reference and move only identified sections, not remove the whole file.

| File | Assessment | Recommended treatment |
| --- | --- | --- |
| account-settings.md | Mainly shared routes, adapters and validation; ends with named consumer implementation/status notes | Keep contract. Move Wakekeeper vessel-adapter specifics to its project guidance; put the cross-consumer support/status claim in a dated report. Keep general licensed-presentation boundary. |
| agent-guidance.md | Correct orientation index; duplicates some working rules and changelog policy | Keep as concise routing/index and topic discovery. Link the canonical policy rather than restating it. |
| authentication-and-claims.md | Shared security contract mixed with exact presentation choices, named-application promotion policy and rollout history | Keep auth, cookies, claims, validation, route and callback contracts. Separate named-consumer visual synchronisation policy into contributor guidance. Put project-specific presentation choices in local UI rules; retain shared semantic CSS/adapter interfaces in reference documentation. Do not remove approved shared visual requirements without relocating and linking them. |
| billing.md | Shared domain/security/lifecycle contract plus broad verification and release instructions | Keep. Distinguish technical acceptance cases from permission to run migrations, contact hosted services or create tests. Link shared test/approval policy. Maintainer release choreography can move to contributor guidance. |
| cli-upgrades.md | Correct operational reference for CLI semantics, ownership and migration handling | Keep. Dated migration/adoption instructions can be linked from a versioned upgrade guide when superseded; do not move CLI behaviour into project rules. |
| database-foundation.md | Shared schema, grants, profile/storage contracts and migration invariants | Keep. Replace named Specdrive role mapping with a general adapter explanation and a link to its local mapping where appropriate. Shared migration/argument constraints stay accessible. |
| email-templates.md | Resource reference mixed with a long “Agent application workflow” | Keep template/token/runtime requirements and resource catalogue. Extract repeatable hosted inspection/upload procedure into an appropriately routed task procedure or skill; keep project-specific target selection in local rules. Do not place universal email contracts in project-only rules. Remove the duplicate top-level heading during cleanup. |
| extensions.md | Current bundle layout, ownership, installer behaviour and limitations | Keep. Future contributor-only publication/checksum responsibilities belong in the planned extension contributor repository; do not publish unimplemented plans as current behaviour. |
| image-transformation.md | Shared request/target/security contract with usage and verification | Keep. Clarify that the deploy command in Verification is a separate authorised release action, not an automatic audit step. No reason to move the request contract into rules. |
| input-validation.md | Mandatory reusable engineering contract | Keep. “Use Zod” and database boundary requirements are technical invariants, not application preferences. Verification wording must not imply permission to create consumer tests. |
| installation.md | Intentional routing guide to the established installation record and skill | Keep the entry point. Deduplicate general handhold behaviour against the skill/shared guidance; retain checklist ownership and resume pointers. Do not relocate the live record into rules. |
| loading-ui.md | Shared loader component/asset contract, with repeated generic SVG instructions | Keep component lifecycle/API/branding seams. Replace general SVG placement/sizing duplication with a link to svg-guidance.md. Local aesthetic overrides belong in UI rules. |
| localisation.md | Runtime contract plus shared English/translation authoring policy | Keep runtime and key/catalogue invariants. The permission restriction on secondary translation authoring is a shared working policy; centralise it in shared guidance with a link here if deduplicating, not independently in every project's rules. Preserve existing translation-authoring links. |
| mobile-auth-deep-linking.md | Shared configuration, trust boundary and operational verification | Keep. Real application identifiers/selected policies belong in developer config and local project guidance. No whole-file move. |
| organisation-settings.md | Shared API/UI seams with a long Specdrive migration/status paragraph | Keep generic routes, permissions and adapters. Move Specdrive-specific adoption details into its own project reference/rules or a dated transition report; keep general licence boundary. |
| ownership.md | Useful ownership reference overloaded with approval policy and UI implementation details | Keep ownership classes and extension seams. Replace Consumer configuration approval boundary with a link to shared guidance; consolidate generic SVG/loading detail in existing topic references. Keep ownership facts here. |
| profile-identity-and-onboarding.md | Compact shared policy; final paragraph prescribes specific consumer behaviour | Keep shared configuration and access-layer contract. Move current SnapScreen onboarding choice and named-consumer preservation instructions to their local rules; contributor synchronisation exception belongs in contributor policy. |
| project-overview.md | Correct architecture overview with promotion and translation-policy repetition | Keep overview; link contributor workflow and localisation rather than duplicating their policy. Replace stale “plugin” terminology with current extension wording during cleanup. |
| project-widgets.md | Correct editable-widget ownership and usage reference | Keep. Technical default widget behaviour belongs here; local product styling does not. Link loading lifecycle to its canonical reference rather than expanding duplicate versions. |
| svg-guidance.md | Shared SVGR integration conventions and valid examples | Keep. These apply to the shared toolchain even though written as instructions. Project-specific icon meanings belong in icon-usage.md; SVG import/render contracts do not. |
| workflow.md | Predominantly agent process, approval routing and named-consumer promotion | Strongest relocation candidate. Put shared orientation/approval routing in shared guidance; Core promotion procedure in optional core-development guidance; retain or link technical updater/Bruno invariants from their owning references. Preserve a short compatibility pointer until MCP/callers are deliberately migrated. |

## Consumer comparison

Each consumer has the same 21 file names; no extra docs/agents files were found. Byte differences from Core: Wakekeeper 8, SnapScreen 9, Specdrive 8. Differences are not automatically defects: docs/agents is developer-owned in consumers and preserved by updates.

Common differing paths are agent-guidance.md, authentication-and-claims.md, cli-upgrades.md, installation.md, loading-ui.md, organisation-settings.md, ownership.md and project-widgets.md. SnapScreen also differs in billing.md. Some differences are missing newer Core sections rather than added policy. Do not overwrite them or claim runtime drift solely from documentation differences.

### Wakekeeper

Its authentication reference includes flotilla/vessel invitation rules, public-resource guards, selected passwordless/signup modes, provider choices and native integration settings. Those are valuable local policy/integration details. Extract durable “preserve this product behaviour” instructions into project rules (for example authentication.md and invitations.md); keep explanatory local API documentation as references. Preserve authorisation requirements while splitting.

Its UI/icon rules have just been separated into project/rules. The docs/agents loader reference still has an older image-pending description than Core's decode-before-reveal wording. This is documented drift to reconcile against actual code, not evidence that every consumer renders incorrectly.

### SnapScreen

Its authentication reference combines shared contracts, hosted target-selection safeguards, site/redirect setup, selected providers/onboarding/billing settings and detailed local smoke-test steps. Move target-selection and durable application choices into project rules; move procedural smoke checks into an explicit task procedure. Keep reusable authentication mechanics in the technical reference. Do not repeat concrete hosted identifiers in generic Core guidance.

The billing reference is a shorter locally scoped version. Its disabled-enforcement choice is project policy; shared account-based billing invariants remain reference material.

### Specdrive

It already has separate ui-implementation.md and icon-usage.md rules. Preserve its Untitled UI policy and product mappings. Its shortened authentication reference focuses on outage presentation/recovery and states different installed scope through its orientation file. Do not replace it with Core wholesale or interpret the same filename as proof of identical supported features.

The main Specdrive project AGENTS.md repeats multiple mappings already in icon-usage.md. That is another duplication to consolidate into pointers, outside this docs/agents review's changes. The icon guide itself mentions both Briefcase for Project and FolderKanban for general project navigation: clarify their scopes with the owner before standardising them; this audit does not choose an icon.

## Specific separation problems and risks

1. Approval boundaries are defined in shared guidance and repeated in ownership/workflow. Updating one copy can leave contradictory permission rules.
2. Named product settings/status in distributed Core references can be mistaken for universal defaults or current production truth.
3. SVG/loading contracts are repeated across ownership, loading-ui, project-widgets and project instructions. Existing decoder-lifecycle wording already differs.
4. Operational verification prose sometimes includes deployment/migration commands. Reading a reference must not be interpreted as approval to execute them.
5. The new UI rules correctly route application-specific choices, but the broad “instructions versus explanations” description should be corrected in agent/Docusaurus guidance. The real distinction is shared technical contract versus project policy versus agent operating procedure.
6. MCP topics expose the server checkout, not automatically the consuming application's policy. Relocation must update guidanceFiles, guidanceTopics, resource links and documentation together; avoid silently removing discoverable safety guidance.

## Recommended cleanup order — not executed

1. Clarify the classification rule in shared routing, agent index and Docusaurus. Do not alter technical requirements.
2. Deduplicate approval policy and extract Core promotion process from workflow.md. Read existing contributor files before choosing an exact destination; avoid a parallel policy.
3. Extract named consumer decisions to their own project rules and link them. Preserve shared visual contracts and Specdrive's exclusion.
4. Consolidate SVG/loading detail into its existing shared references; verify consumer code before reconciling version differences.
5. Separate email operation procedure and maintainer release checklists where useful. Retain installation's established routing exception.
6. Update MCP topic/resource pointers and all links atomically; run existing MCP checks and Docusaurus validation. Consumer changes are guidance-only unless a separately reviewed code issue is found.

Protected shared guidance changes require the Core gate. This review does not approve a move, change security policy, apply migrations, run hosted checks, commit or publish. No database/API/Bruno contracts changed. Verification for this audit was file inventory, document reading and content comparison; runtime tests were not required.

## Subsequent decision

The human subsequently chose a single docs/agents home. Recommendations to move durable guidance into a rules tree are superseded by 2026-10-28-guidance-consolidation.md.
