# Account settings contract

## Managed surface

The canonical account details route is `/account`. Its route scaffold, settings shell, base navigation, Zod schema, form, media controls, and `/api/account/details` server boundary are CLI-managed. The mutation authenticates with `getUser()`, validates the request server-side, calls `api.update_account_profile_by_current_user` once for identity, language and product fields atomically, and returns a refreshed account summary. Browser validation is only a usability layer.

`PROFILE_IDENTITY.USERNAME` controls whether username is absent, optional, or required. `PROFILE_IDENTITY.AVATAR` and `HEADER_IMAGE` control their corresponding media controls. `ACCOUNT_SETTINGS.LANGUAGE` controls language persistence. Account cancellation is hidden or visibly unavailable unless a separately approved deletion and retention contract supplies real behaviour.

Profile media uploads go through the authenticated `process-image-upload-v2` Edge Function. Persist the new canonical path before deleting the previous object. If the database mutation fails, delete the newly uploaded object and preserve the old one. Successful details and media mutations publish `supacharger:account-summary-changed` so active menus update without a browser restart.

Managed account JSX uses only stable `sc-account-*` and shared `sc-control-*` class hooks for presentation. Layout, spacing, typography, colours, borders, dimensions, responsive behaviour, and interaction styling belong in the unlayered developer-owned `src/styles/supacharger-account.css`. The CLI installs that starter only when absent and preserves it on updates. Do not add Tailwind presentation utilities to managed account JSX; applications must be able to restyle the complete account surface without editing managed files.

## Developer-owned extensions

The CLI installs missing starters under `src/supacharger.adapters/account/` once and preserves them on later updates:

- `navigation.ts` adds ordered product-specific account links;
- `profile-fields.tsx` renders extra fields inside the managed `FormProvider`;
- `profile-extension.ts` exports the strict validation schema for the matching extension payload;
- `details-page.tsx` may replace the details content for an authorised product presentation;
- `presentation.ts` selects the managed shell or a product-owned passthrough layout; and
- `chrome.tsx` wraps the managed settings shell with application chrome such as a header, application sidebar, and footer.

The Core starter implements `chrome.tsx` with the example `AuthenticatedAppShell`, so Korunet renders its header and footer around `/account`. Existing consumers keep their own adapter byte-for-byte during CLI updates. Keep account navigation and form content inside the managed `AccountSettingsShell`; use the chrome adapter only for the outer application frame so project routes do not acquire duplicate headers or footers.

Keep an extension's client and server schemas aligned. The managed route validates the extension object before sending it to the private SQL hook inside the Core transaction. Product fields, tables, and route values remain application-owned. `ACCOUNT_SETTINGS.PRODUCT_PROFILE_PATH` links to a genuine product profile route or is `null`; do not point it at mock controls.

## Configuration and ownership

`ACCOUNT_SETTINGS`, profile media policies, organisation chooser settings, and billing subjects are required fields in the typed `SupachargerConfig` contract. The values remain developer-owned. Managed account code must be byte-identical in CLI-installed consumers, while messages and account adapters remain preserved developer paths.

Specdrive consumes the non-visual contracts but retains its licensed presentation through the details-page and passthrough adapters. Do not copy that presentation into Core.

## Privacy and notification preferences

`/account/privacy` and `/account/notifications` are managed descriptor-driven routes. `preferenceSurfaceSchema` accepts plain-text labels/descriptions, boolean option values, and an explicit `enabled` or `disabled` availability. The managed mutation authenticates the current user, parses the submitted boolean record with Zod, reloads the authoritative descriptor, rejects missing or extra option IDs, and only then invokes the developer persistence adapter.

Developer-owned `privacy.ts` and `notifications.ts` adapters must return honest availability. The default starters are disabled and their update functions throw; they never simulate a save. Product adapters must validate again against their own domain identifiers, authorise through their server boundary and database policies, and persist real state. Descriptions are rendered as text, not injected HTML.

Wakekeeper's privacy adapter maps its RLS-protected vessel RPC to this shared renderer and validates UUID keys before calling `upsert_vessels` with `scope: "privacy"`. Its vessel/trip-log tables remain product-owned. No consumer currently supplies a notification persistence service, so notifications render an explicit unavailable state.

See [Profile extensions and media](profile-extensions.md) for the atomic hooks, public projection and Supabase media endpoint.
