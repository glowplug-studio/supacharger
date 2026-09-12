---
name: changelog
description: Curate notable changes when asked for a changelog, release notes, version history, or "do the changelog", and before commits when repository instructions require it. Follow the repository's destination, format and authorisation policy.
license: Apache-2.0
---

# Changelog writing

Read the repository's instruction entry point and changelog policy first. Establish the intended audience, destination, format and authorised scope. Never assume a JSON file, application footer, Core changelog, release version, commit or publication is intended. A repository may require review on every authorised commit; the skill itself does not impose that obligation on every project.

## Review evidence

1. Read the existing changelog, its most recent entry date and any review checkpoint. Record the current UTC review boundary. Prefer immutable commit checkpoints alongside timestamps: commit dates alone can miss rebased, cherry-picked or delayed changes.
2. Inspect main-branch history since the checkpoint and relevant branch commits. Check whether main is local or a fetched remote ref; refresh read-only remote history when available. If the remote cannot be inspected, disclose that the review covers local history only. Never claim unseen history was reviewed.
3. Read the staged diff for a proposed commit and inspect relevant unstaged changes to distinguish included work from unfinished or excluded work. Commit subjects and touched files help triage, but inspect actual diffs to verify outcomes, compatibility and completion. Do not include someone else's uncommitted work merely because it exists locally.
4. Compare findings with existing entries. Group related changes, remove duplicates, and revise unreleased wording when a later change supersedes it. Do not silently rewrite released history. Review the full relevant range even if some commits contain only housekeeping.

If no checkpoint exists, use the latest entry date as a discovery boundary and verify coverage against Git history. For a new changelog, record an explicit baseline and disclose that older history is not audited; do not imply a complete historical backfill. Ask only when choosing the baseline materially changes the requested scope.

## Write for the reader

- Explain meaningful outcomes at feature or capability level in plain language, using the project's language convention. Group small related fixes into one useful sentence.
- For application users, prioritise workflows, pages, settings, uploads, validation, navigation, permissions, billing and usage behaviour.
- For library or developer-tool users, also include public APIs, configuration, installation, security, compatibility and required migration or upgrade actions. Describe breaking changes and what the reader must do.
- Omit formatting-only work, trivial visual adjustments, internal agent notes, test implementation details, mechanical migrations, generated API documentation and dependency housekeeping unless they have a meaningful effect on the intended audience. A migration requirement or a new supported developer workflow may be notable; do not exclude it solely because it is technical.
- Do not dump commit subjects, file lists, internal jargon or unsupported marketing claims. Exclude unfinished features and speculative benefits. Never expose credentials, personal data or unpublished security details.

## Preserve the output contract

Use the repository's required format. For Keep a Changelog 1.1.0, retain `[Unreleased]`, use relevant `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` and `Security` headings, omit empty categories, and order released versions newest first with `YYYY-MM-DD` dates. Add real version/compare links; do not invent tags or release a version merely to record a commit. See https://keepachangelog.com/en/1.1.0/.

For other formats, preserve their schema and ordering. Validate the result. Review every required commit without inventing an entry for changes that are not notable.

When the repository uses an HTML review comment, record UTC time, the inspected main tip and a reachable commit immediately before the proposed commit; the next review should re-check the checkpoint-bearing commit and deduplicate it. Never attempt to embed the resulting commit's own hash. Advance the checkpoint only after the review succeeds, and never mark excluded changes as covered.

A request for changelog edits does not authorise committing, tagging, publishing or changing another repository's history. Summarise any incomplete history or blocked verification accurately.
