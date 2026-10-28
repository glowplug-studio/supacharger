# Supacharger repository MCP

Use `supacharger_get_guidance` with `topic: "extensions"` or `supacharger://project/extensions` for the retained experimental source architecture, Brevo integration, ownership and deferred distribution plan. The published npm CLI has no extension or plugin installation commands. The MCP does not install bundles, execute the CLI or accept credentials. Future commercial tokens/downloads will be managed through Specdrive; they are not available yet.

Manifest v2 supports extension-owned worker files and immutable forward migrations. Brevo 2.0.0 owns immediate post-commit delivery and Supabase retries; apps pass authorised props and optionally provide bulk privacy resolvers. Follow the installed guide for explicit migration, deployment and Vault configuration steps; file installation does not activate sending.

This read-only local MCP gives coding agents a durable understanding of the Supacharger core mission, ownership model, project structure, and promotion workflow.

The CLI currently marks `init`, remote `coreupdate`, `doctor` and `coredev` with a yellow demonstration warning before they contact private development repositories on GitHub. Public-skills operations and local `--source` comparisons do not print it.

## Run

```bash
npm install
npm start
```

The server uses stdio and is registered for Codex by the repository's `.codex/config.toml`.

## Capabilities

- Read curated mission, ownership, localisation, authentication, profile/onboarding, account-settings, database, input-validation, image-transformation, inline-loading UI, billing, workflow, and agent guidance resources.
- Classify repository paths before editing them.
- Render a filtered project tree.
- Search curated guidance without exposing environment files.

The ownership guidance distinguishes byte-identical managed paths, merge-managed contracts, forward-only migrations, and developer-owned code. `src/supacharger/styles/`, `tailwind.config.ts`, and `postcss.config.mjs` are exact managed; `tailwind.project.config.ts` is the preserved configuration seam for project and installed-extension additions; and `src/styles/project.css` is the named application's developer-owned styling seam. Managed authentication, account, and organisation markup uses semantic hooks; the CLI preserves `src/styles/supacharger-auth.css`, `src/styles/supacharger-account.css`, and `src/styles/supacharger-organisations.css` as their complete presentation seams. `src/supacharger.adapters/auth/auth-sidecar.tsx` preserves desktop/mobile authentication branding. The shared base layer centrally gives enabled native and ARIA interactive controls a pointer cursor while excluding disabled controls. Global same-page fragment scrolling combines its native CSS fallback with one protected `SmoothAnchorNavigation` instance in the editable root layout so ordinary anchors and Next.js links behave consistently, respect reduced motion, and need no page-specific handler. Agents can retrieve the full rules through the `ownership` guidance resource or classify either path directly.

Unlayered account and organisation presentation must scope shared `sc-control-*` rules to their owning surface roots. Otherwise those declarations override layered authentication themes across consumer applications.

The same ownership resource describes semantic brand colours and application error pages. `--primary`/`--primary-foreground` and the related foreground, muted, accent, and ring variables are consumed through Tailwind semantic utilities. The application-owned `/error` and not-found surfaces stay outside the protected route group, render authenticated chrome only after a server user check, remain standalone for public visitors, and require `/error` in the unauthenticated allow-list for auth-only applications. Proxy also exempts `/error` from profile-onboarding redirects. Error copy uses a field-by-field protected English fallback whenever the developer-owned `ErrorPage` namespace is absent or incomplete, avoiding a secondary `MISSING_MESSAGE` failure inside the error boundary.

The same ownership resource records the root-document contract. `src/app/layout.tsx` is installed as an editable developer template and preserved by updates; `src/supacharger/root-document.tsx` is protected. The managed helper supplies canonical metadata and title-template factories, page-level canonical/social metadata, viewport and favicon declarations, production-aware indexing, and configured Google/Vercel analytics without a hard-coded measurement ID. Application configuration owns values and provider switches.

The favicon path contract keeps `public/favicon.ico` at the public root and groups every other standard favicon/manifest asset under `public/favicons/`. Protected metadata uses `/favicons/...` for those grouped files; product artwork remains application-owned.

The `loading_ui` resource defines the developer-owned primary and dark inline-loader branding seams, SVGR-only UI asset convention, `fill` override behaviour, and replacement-file workflow. Path classification reports both exact loader paths as developer-owned even though adjacent shared assets may follow a different ownership policy.

The `ownership` resource and path classifier define demo presentation and its colocated assets under `src/components/sc_demo/` as developer-owned examples. UI SVGs stay with their owning source and are imported through SVGR; `public/` is reserved for assets that genuinely require a URL.

The `project_widgets` resource documents Supacharger-provided, project-owned widgets under `src/components/sc_widgets/`. The path classifier reports them as `developer-owned-widget`: initialisation supplies the current starter set while updates preserve local code, styling, crop ratios, browser limits and upload destination choices. A widget introduced by a later Core release requires an explicit reviewed copy into an existing project. Server image size, compression, format, bucket and fallback destination remain in developer-owned `src/supacharger.adapters/media/image-targets.ts`.

The MCP is descriptive and read-only. It does not supersede `AGENTS.md`, edit files, run migrations, or access sibling applications.

The localisation resource records the locale-neutral routing contract, English-only copy-authoring default, empty or untouched secondary-language policy unless translation is explicitly requested, the transient `?lang=<two-letter-code>` marketing handoff, profile persistence in `app.profiles.language_code`, and the precedence used to restore a preference. It also identifies `src/i18n/` plus `messages/` as developer-owned paths that the CLI must preserve.

The database and profile resources record the one-profile-per-Auth-user model, three-state username policy, post-sign-in onboarding guard, optional organisation management contract, owner/admin/member roles, hashed single-use invitations, reviewable access requests, reserved handles, billing-subject synchronisation, private `user-avatars` and `organisation-logos` paths, the one-query account-summary RPC/service and standard browser refresh event, batched signed-media resolution, safe identity fallback/general projection, and `app`/`api`/`api_edge` schema boundary. OAuth agent connections, restricted agent roles, consent, connection ledgers, and agent-facing RPCs remain Specdrive-owned and outside Core.

The account-settings resource records the managed `/account` shell and mutation boundary, profile media cleanup order, language persistence, visible cancellation policy, descriptor-driven privacy/notification surfaces, honest disabled defaults, and preserved navigation, field, persistence, and presentation adapters.

The organisations resource records the managed chooser and organisation-prefixed settings routes, disabled-route behaviour, session refresh before context navigation, owner/admin/member visibility, hashed invitation and reviewed-access UX, private media paths, organisation billing visibility, `FormProvider` extension seam with authoritative server Zod validation, the organisation chooser 301 redirect, and the exclusion of product usage and agent-licence surfaces from Core.

The CLI-upgrades resource records the version 2 ownership flow, direct three-way file comparison, configuration-property comparison, developer-owned preservation, migration handling and Core-lock advancement.

The input-validation resource records the authoritative server-side Zod boundary for forms and untrusted requests, appropriate Edge Function parsing before privileged work, and the separate PostgreSQL validation, constraint, authentication, authorisation, grant, and RLS duties required for RPCs.

The image-transformation resource records the authenticated `process-image-upload-v2` boundary, RLS-scoped Storage client, managed transformer, developer-owned target policy, validated user-relative destinations, safe path and format limits, PNG/JPEG encoding contract, and server-signed permits that bind user identity, file hash, crop and processing settings. Browsers request permission from the application server, then upload directly to Edge. The processor crops before resizing; malformed metadata returns 400 and out-of-bounds crops return 422.

The ownership resource also records the build-runtime boundary: the root Next.js `tsconfig.json` excludes `supabase/functions/**/*`. Agents must preserve that separation rather than teaching the Next.js compiler to accept Deno-only globals and imports.

The authentication resource records the byte-identical compact `tokens-only` browser/server/Proxy cookie contract, one-client/one-verification Proxy contract, pre-client sanitisation of sensitive Auth query fields while safe return data survives, response cookie and anti-cache-header invariant, strict-mode option, anonymous-user policy, verified/onboarded/full-app server boundaries, recovery-route ancestry invariant, configured password/magic-link/link-or-OTP journey, canonical `NEXT_PUBLIC_SITE_URL` separated from validated request-origin Auth/billing destinations and optional `APP_ALLOWED_ORIGINS`, aligned initial and resent link-confirmation redirects, safe already-used/expired confirmation handling based on a fresh current-user check, provider-first direct routes, mode-preserving “Continue with email”, the compact three-icon social switcher, direct email-form opening when no social provider is enabled, reveal-mode password-confirmation collapse and validation, the floating non-reflowing password checklist, serialisable safe Auth Server Action results, localised Supabase error codes, magic-link visibility gates, complete typed social OAuth provider map, guarded provider initiation, managed provider-icon path, conditional provider divider, action-specific pending states, same-origin GET/POST server-route logout, absence of a redundant JSON signup route, SnapScreen-based shared presentation contract, responsive single-logo handoff, private global-role source, custom access-token hook, JWT freshness limitations, and organisation-context boundary. The mobile-auth resource records the developer-owned native identifiers, generated iOS and Android association endpoints, PKCE client boundary, Proxy bypass, callback validation, and platform verification requirements.

The same authentication resource records managed Supabase Auth TOTP enrolment, cancellation, AAL1-to-AAL2 sign-in challenge, factor removal, provider-aware email/password settings, and the rule that application tables never store TOTP secrets.

The workflow resource records that client-callable Core `api` RPC changes must update `docs/bruno/supacharger-rpc/`. Consumers receive the exact documentation collection and may keep product-specific RPC documentation separately.

The billing resource records the billing-account domain, explicit personal/organisation subject service, session-derived personal ownership, organisation resolver adapter, scoped overview rules, managed settings/acquisition/Portal routes, multi-subscription and multi-item projection, entitlement boundary, Dynamic Payment Methods, flexible billing mode, schema ownership, durable event/reconciliation contract, required event list, secrets, and verification rules. Organisation guidance also records Core route ownership and the developer-owned page, navigation, chrome, profile, and CSS seams used to preserve product-only behaviour without parallel pages. It is descriptive only and cannot access Stripe, read secrets, or apply migrations.

## Image loading placeholders

Use `src/assets/svgr/ui/image-loader.svg` through SVGR for pending images and thumbnails. This developer-owned, three-bar animation sits beside the inline loader assets and must survive CLI updates. Keep the image container positioned (`relative`) with reserved dimensions or an aspect ratio. Centre the loader vertically and horizontally behind the image using `pointer-events-none absolute inset-0 flex items-center justify-center`; size the SVG at the call site (normally `size-[50px]`) and use a suitable muted `currentColor`. Keep the image above it. Hide the decorative loader (`aria-hidden="true"`) when the image loads or fails; reset the pending state when its source changes and handle already-cached images. Do not animate when reduced motion is requested; show static bars instead. Keep buttons and form actions on the existing inline loader.

## Signup terms notice

Set `AUTHENTICATION.SIGN_UP_TERMS_URL` in developer-owned `src/supacharger.config.ts` to an absolute HTTP(S) URL. The default `null` hides the notice; invalid, relative and credential-bearing URLs are not rendered. The link opens a new tab with `noopener noreferrer`.

The shared login/signup form displays the notice beneath signup actions and on the provider chooser, where a social action can create an account even from sign-in. Wording follows the configured password, passwordless and social signup methods. `AuthJourney.signUpTerms`, `signUpTermsSocial`, `signUpTermsSocialOnly`, `signUpTermsPasswordless` and `signUpTermsPasswordlessSocial` are complete rich-text messages; preserve the `<terms>...</terms>` link tag when translating. English values are supplied; secondary catalogues remain pending translation.

This is a displayed notice, not a required checkbox or stored consent record. `ACCOUNT_REQUIRED_TERMS_AGREEMENT_PATH` remains separate. CLI upgrades add the missing setting as `null` and preserve an existing URL. Existing consumers receive the same property without changing their authentication methods. Configure the application's real terms URL before expecting a visible notice.

The authentication resource also describes the standalone branded HTTP 503 recovery document, original-destination retry, English `ServiceUnavailable` catalogue fallback, unchanged API JSON errors and session preservation during temporary Auth refresh failures.

## Instruction routing and public skills

The `instructions` topic exposes root `AGENTS.md`, `working_rules` exposes `.agents/supacharger/guidance.md`, and `agent_guidance` exposes `docs/agents/agent-guidance.md`. Technical topics read the same `docs/agents/` files used locally; there is no separate knowledge copy. Optional contributor instructions and inactive legacy files are not automatically added to the guidance catalogue.

Project instructions and installed skills are developer-owned. The independent public-skills installer is maintained in `tools/supacharger-skills/` and distributed through the CLI. The optional private Core contributor submodule remains absent and inert unless a contributor explicitly runs `supacharger coredev install`; `supacharger coredev update` is its only CLI update path and refuses local changes. This knowledge MCP remains read-only. See [Agent guidance](https://supacharger.dev/docs/agents) and [Contributing](https://supacharger.dev/docs/contributing).

Application copies of `docs/agents/` are developer-owned. Core updates install missing references and preserve existing ones; review changed conventions against the actual installed implementation. The MCP exposes those local references and does not imply that the application is at the latest Core revision.

Installed skills are local tooling in Core and are not part of its committed reference set. The changelog skill is maintained in the public skills catalogue; contributor policy owns Core-specific decisions.

## Email template sources

Use `supacharger_get_email_template` with `supabase_reset_password` or `brevo` for complete HTML. The same sources are available at `supacharger://email-templates/supabase_reset_password` and `supacharger://email-templates/brevo`. Read the `email_templates` guidance topic for branding and usage.

Email sources live in `resources/sc-email-templates/`. The catalogue covers the generic Brevo example and all thirteen Supabase Auth/security email types. Read `email_templates` guidance before an explicitly requested upload. Verify the Supabase MCP target and capabilities; use the Management API or dashboard when Auth editing is unavailable, and read back the hosted result. Agents must corroborate provider and Auth intent in `src/supacharger.config.ts` against hosted provider settings, email templates, redirect callers and verification handlers before selecting tokens. Report contradictions with their effect on the flow and a proposed correction; distinguish intentional differences and unverified settings, and do not silently change Auth policy. This repository MCP supplies read-only sources and guidance; the agent performs authorised hosted inspection and updates through the available Supabase tools or Management API.

Use `profile_extensions` for atomic account extensions, public profiles and Supabase media.
