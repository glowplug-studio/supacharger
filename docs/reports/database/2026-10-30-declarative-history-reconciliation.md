# Declarative history reconciliation

Created: 2026-10-30T16:42:29+07:00 (Asia/Bangkok)
Last edited: 2026-10-30T16:42:29+07:00 (Asia/Bangkok)

## Result

Added and applied `20261030093347_reconcile_declarative_baseline.sql`. Full native migration replay now matches the complete desired schema tree: `No schema changes found`. A second disposable replay executing the reconciliation twice also reports no changes. Temporary verification migrations were removed afterwards. Existing installed migrations were not edited, removed or renamed.

Recreates the existing public automatic-RLS function/event trigger and grants in historical replay. No application-schema changes.

## Production verification

Read the relevant live state before reconciliation. Core's automatic-RLS trigger already existed; Specdrive's guidance-style column and old public manage_project wrapper were already absent, its current enum/vector/font/key-prefix definitions already existed, and the affected function bodies matched production; Wakekeeper's participation_approved column was already absent. Added guards refuse to remove populated legacy columns in other environments.

Applied only this reviewed forward migration through the Management API, recording the exact version and SQL in the same transaction. This avoids applying unrelated history or creating another timestamp alias. Read the migration row back and matched its SQL checksum to the local file. No blanket db push, migration repair, old-ledger changes, npm publication or UI change occurred.

## Validation and publication scope

Native CLI 2.122.0 passed full replay and no-change comparison, plus repeat application, in disposable shadows. Evidence: ignored `supabase/.temp/reconciliation-verify.log`, `reconciliation-repeat.log` and `reconciliation-ledger-verification.json`. SQL was applied to rehearsal shadows and production; existing application development databases were not reset. Diff whitespace checks pass. No application test suites or test scripts were introduced.

Commit scope includes the reconciliation, earlier native-planning/bootstrap fixes, current agent guidance and relevant changelog/Bruno corrections. Wakekeeper's reports remain local-only under its project policy. npm CLI publication is explicitly excluded.
