# Consumer integration context

These retained notes describe named applications and their integration history. They are not defaults for every Supacharger application. Apply only the statements relevant to the current project; verify current code before treating a historical status as current.

## profile-identity-and-onboarding.md

Keep Wakekeeper and Specdrive's established profile-setup presentation. SnapScreen has onboarding disabled. Shared visual auth changes apply to core, SnapScreen, and Wakekeeper; Specdrive retains its authorised Untitled UI presentation while its non-visual config, RPC, and database contracts remain aligned.


## organisation-settings.md

Specdrive is a semantic consumer: Core owns its `/organisation/choose` and `/organisation/{org-handle}/settings` route identities and reusable structure, while developer-owned adapters preserve its authorised product chooser, application chrome, usage, and agent-licence behaviour. `/organisation` returns a 301 redirect to `/organisation/choose`, preserving safe query parameters. The chooser is a standalone page outside the account settings frame. Previous chooser and root-handle settings routes are removed without compatibility redirects. Its licensed presentation remains confined to Specdrive's developer CSS and product components and must not be copied into Core.

## account-settings.md

Wakekeeper's privacy adapter maps its RLS-protected vessel RPC to this shared renderer and validates UUID keys before calling `upsert_vessels` with `scope: "privacy"`. Its vessel/trip-log tables remain product-owned. No consumer currently supplies a notification persistence service, so notifications render an explicit unavailable state.
