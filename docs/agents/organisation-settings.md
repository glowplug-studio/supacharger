# Organisation settings

## Routes and feature policy

The managed chooser is `/account/organisation`. Root-handle mode exposes `/{handle}/settings`, `/{handle}/settings/team`, and, when organisation billing is enabled, `/{handle}/settings/billing`. Route helpers validate and encode handles. If `ORGANISATIONS.ENABLED` is false, the chooser and settings layout return a controlled not-found response and the account navigation omits the chooser.

Specdrive is a semantic consumer: `/account/organisation` renders its existing authorised product chooser, while `/organisation` is a temporary allowlist-only redirect. Its existing `/{handle}/settings` presentation, usage, and agent-licence sections remain product-owned and must not be copied into Core.

## Managed chooser

The chooser lists memberships and their active context and role. It creates organisations only after a server handle-availability check, switches through the authenticated RPC, refreshes the Supabase session before navigation, accepts one-time invitation tokens, and can request reviewed access by handle. Error, empty, busy, invitation, and success states use the application's English catalogue.

## Profile extension seam

The managed profile form owns `useForm`, `FormProvider`, canonical name/handle/bio/colour/access-policy/media fields, dirty state, and safe feedback. `src/supacharger.adapters/organisations/profile-fields.tsx` may call `useFormContext()` to register product fields. The paired `profile-extension.ts` must export the authoritative Zod schema, initial-value loader, and mutation. The `/api/organisations` route validates the extension on the server and invokes it only after the canonical RPC authorises and applies the owner/admin update.

An extension cannot weaken role checks, handle validation, or Storage paths. Keep adapter values JSON-serialisable and do not simulate persistence in the default adapter.

## Team, invitations, and access review

Members can view the roster. Owners and admins can invite, revoke invitations, remove eligible members, and review access requests. Only owners can assign administrator/owner roles; the database remains authoritative for last-owner and cross-role restrictions. Invitation links are displayed once because only their hashes are stored.

## Media and billing

The browser uploads supported files directly to the private `organisation-logos` bucket under `<organisation-id>/logos/` or `<organisation-id>/headers/`; Storage RLS rechecks manager membership. The profile RPC persists paths only.

Organisation billing appears only when `BILLING.ACCOUNT_SUBJECTS.ORGANISATION` is true. Overview reads remain subject-scoped. Portal creation uses the developer-owned organisation resolver and the managed service's independent billing-manager check.

## Verification

Run `npm run test:organisation-ui`, the English-catalogue check, `next typegen`, TypeScript, and a production build. Verify keyboard focus, mobile layout, empty and error states, owner/admin/member controls, reserved and duplicate handles, invitation expiry/replay/wrong-email denial, session refresh after switching, and exact managed-path hashes in CLI-installed consumers.
