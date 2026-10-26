# Organisation settings

## Routes and feature policy

The managed chooser is `/organisation/choose`. Organisation-handle mode exposes `/organisation/{org-handle}/settings`, `/organisation/{org-handle}/settings/team`, and, when organisation billing is enabled, `/organisation/{org-handle}/settings/billing`. Route helpers validate and encode handles. If `ORGANISATIONS.ENABLED` is false, the chooser and settings layout return a controlled not-found response and the account navigation omits the chooser.

Specdrive is a semantic consumer: Core owns its `/organisation/choose` and `/organisation/{org-handle}/settings` route identities and reusable structure, while developer-owned adapters preserve its authorised product chooser, application chrome, usage, and agent-licence behaviour. `/organisation` returns a 301 redirect to `/organisation/choose`, preserving safe query parameters. The chooser is a standalone page outside the account settings frame. Previous chooser and root-handle settings routes are removed without compatibility redirects. Its licensed presentation remains confined to Specdrive's developer CSS and product components and must not be copied into Core.

## Managed chooser

The chooser lists memberships and their active context and role. It creates organisations only after a server handle-availability check, switches through the authenticated RPC, refreshes the Supabase session before navigation, accepts one-time invitation tokens, and can request reviewed access by handle. Error, empty, busy, invitation, and success states use the application's English catalogue.

## Profile extension seam

The managed profile form owns `useForm`, `FormProvider`, canonical name/handle/bio/colour/access-policy/media fields, dirty state, and safe feedback. `src/supacharger.adapters/organisations/profile-fields.tsx` may call `useFormContext()` to register product fields. The paired `profile-extension.ts` must export the authoritative Zod schema, initial-value loader, and mutation. The `/api/organisations` route validates the extension on the server and invokes it only after the canonical RPC authorises and applies the owner/admin update.

Core owns the `/organisation/choose` and `/organisation/{org-handle}/settings` route identities. Products must not create parallel `page.tsx` files for those same public paths in another route group. Preserve product behaviour through `pages.tsx`: it can override chooser, team, and billing content or register product-only settings sections. Pair extra section IDs with `navigation.ts`; IDs are unique kebab-case values and cannot be `profile`, `team`, or `billing`. Use `chrome.tsx` for product application chrome and any stronger application access boundary. These adapters are developer-owned and installed only when missing.

Every managed organisation component exposes only stable `sc-organisation-*` and shared `sc-control-*` presentation hooks. Layout, spacing, typography, colours, borders, dimensions, responsive behaviour, and interaction styling belong in the unlayered developer-owned `src/styles/supacharger-organisations.css`. The CLI installs that starter only when absent and preserves it on updates. Do not add Tailwind presentation utilities to managed organisation JSX or edit managed markup to carry branding. Licence-restricted product components and styles remain in the authorised consumer and must not be copied into Core.

An extension cannot weaken role checks, handle validation, or Storage paths. Keep adapter values JSON-serialisable and do not simulate persistence in the default adapter.

## Team, invitations, and access review

Members can view the roster. Owners and admins can invite, revoke invitations, remove eligible members, and review access requests. Only owners can assign administrator/owner roles; the database remains authoritative for last-owner and cross-role restrictions. Invitation links are displayed once because only their hashes are stored.

## Media and billing

The browser uploads supported files directly to the private `organisation-logos` bucket under `<organisation-id>/logos/` or `<organisation-id>/headers/`; Storage RLS rechecks manager membership. The profile RPC persists paths only.

Organisation billing appears only when `BILLING.ACCOUNT_SUBJECTS.ORGANISATION` is true. Overview reads remain subject-scoped. Portal creation uses the developer-owned organisation resolver and the managed service's independent billing-manager check.

## Verification

Verify keyboard focus, mobile layout, empty and error states, owner/admin/member controls, reserved and duplicate handles, invitation expiry/replay/wrong-email denial and session refresh after switching. The CLI directly compares managed file contents during installation and diagnosis.
