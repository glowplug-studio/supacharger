# Supacharger repository MCP

This read-only local MCP gives coding agents a durable understanding of the Supacharger core mission, ownership model, project structure, and promotion workflow.

## Run

```bash
npm install
npm start
```

The server uses stdio and is registered for Codex by the repository's `.codex/config.toml`.

## Capabilities

- Read curated mission, ownership, localisation, authentication, profile/onboarding, account-settings, agent-connections, database, input-validation, image-transformation, inline-loading UI, billing, workflow, and agent guidance resources.
- Classify repository paths before editing them.
- Render a filtered project tree.
- Search curated guidance without exposing environment files.

The ownership guidance distinguishes byte-identical managed paths, merge-managed contracts, forward-only migrations, and developer-owned code. `src/supacharger/styles/` and `postcss.config.mjs` are exact managed; `tailwind.config.ts` is merge-managed; `src/styles/project.css` is the named application's developer-owned styling seam. Managed authentication, account, and organisation markup uses semantic hooks; the CLI preserves `src/styles/supacharger-auth.css`, `src/styles/supacharger-account.css`, and `src/styles/supacharger-organisations.css` as their complete presentation seams. `src/supacharger.adapters/auth/auth-sidecar.tsx` preserves desktop/mobile authentication branding. The shared base layer centrally gives enabled native and ARIA interactive controls a pointer cursor while excluding disabled controls. Global same-page fragment scrolling combines its native CSS fallback with one protected `SmoothAnchorNavigation` instance in the editable root layout so ordinary anchors and Next.js links behave consistently, respect reduced motion, and need no page-specific handler. Agents can retrieve the full rules through the `ownership` guidance resource or classify either path directly.

Unlayered account and organisation presentation must scope shared `sc-control-*` rules to their owning surface roots. Otherwise those declarations override layered authentication themes across consumer applications.

The same ownership resource describes semantic brand colours and application error pages. `--primary`/`--primary-foreground` and the related foreground, muted, accent, and ring variables are consumed through Tailwind semantic utilities. The application-owned `/error` and not-found surfaces stay outside the protected route group, render authenticated chrome only after a server user check, remain standalone for public visitors, and require `/error` in the unauthenticated allow-list for auth-only applications. Proxy also exempts `/error` from profile-onboarding redirects. Error copy uses a field-by-field protected English fallback whenever the developer-owned `ErrorPage` namespace is absent or incomplete, avoiding a secondary `MISSING_MESSAGE` failure inside the error boundary.

The same ownership resource records the root-document contract. `src/app/layout.tsx` is installed as an editable developer template and preserved by updates; `src/supacharger/root-document.tsx` is protected. The managed helper supplies canonical metadata and title-template factories, page-level canonical/social metadata, viewport and favicon declarations, production-aware indexing, and configured Google/Vercel analytics without a hard-coded measurement ID. Application configuration owns values and provider switches.

The favicon path contract keeps `public/favicon.ico` at the public root and groups every other standard favicon/manifest asset under `public/favicons/`. Protected metadata uses `/favicons/...` for those grouped files; product artwork remains application-owned.

The `loading_ui` resource defines the developer-owned primary and dark inline-loader branding seams, SVGR-only UI asset convention, `fill` override behaviour, and replacement-file workflow. Path classification reports both exact loader paths as developer-owned even though adjacent shared assets may follow a different ownership policy.

The `ownership` resource and path classifier define demo presentation and its colocated assets under `src/components/sc_demo/` as developer-owned examples. UI SVGs stay with their owning source and are imported through SVGR; `public/` is reserved for assets that genuinely require a URL.

The MCP is descriptive and read-only. It does not supersede `AGENTS.md`, edit files, run migrations, or access sibling applications.

The localisation resource records the locale-neutral routing contract, English-only copy-authoring default, empty or untouched secondary-language policy unless translation is explicitly requested, the transient `?lang=<two-letter-code>` marketing handoff, profile persistence in `app.profiles.language_code`, and the precedence used to restore a preference. It also identifies `src/i18n/` plus `messages/` as developer-owned paths that the CLI must preserve.

The database and profile resources record the one-profile-per-Auth-user model, three-state username policy, post-sign-in onboarding guard, optional organisation management contract, owner/admin/member roles, hashed single-use invitations, reviewable access requests, reserved handles, billing-subject synchronisation, private `user-avatars` and `organisation-logos` paths, the one-query account-summary RPC/service and standard browser refresh event, batched signed-media resolution, safe identity fallback/general projection, generic agent connections, and the `app`/`api`/`api_edge` schema boundary.

The account-settings resource records the managed `/account` shell and mutation boundary, profile media cleanup order, language persistence, visible cancellation policy, descriptor-driven privacy/notification surfaces, honest disabled defaults, and preserved navigation, field, persistence, and presentation adapters.

The organisations resource records the managed chooser and root-handle settings routes, disabled-route behaviour, session refresh before context navigation, owner/admin/member visibility, hashed invitation and reviewed-access UX, private media paths, organisation billing visibility, `FormProvider` extension seam with authoritative server Zod validation, Specdrive compatibility redirects, and the exclusion of product usage and agent-licence surfaces from Core.

The CLI-upgrades resource records the version 2 ownership flow, disabled-safe configuration migration, missing-only English merge, one-time developer adapter starters, explicit adapted-migration aliases, post-update checks, lock advancement, and read-only doctor findings.

The input-validation resource records the authoritative server-side Zod boundary for forms and untrusted requests, appropriate Edge Function parsing before privileged work, and the separate PostgreSQL validation, constraint, authentication, authorisation, grant, and RLS duties required for RPCs.

The image-transformation resource records the authenticated `process-image-upload` boundary, RLS-scoped Storage client, managed transformer, developer-owned target policy, safe path and format limits, PNG/JPEG encoding contract, and the rule that request data never supplies destinations or transform settings.

The ownership resource also records the build-runtime boundary: the root Next.js `tsconfig.json` excludes `supabase/functions/**/*`, while Edge Function source is type-checked and tested with Deno. Agents must preserve that separation rather than teaching the Next.js compiler to accept Deno-only globals and imports.

The authentication resource records the one-client/one-verification Proxy contract, pre-client sanitisation of sensitive Auth query fields while safe return data survives, response cookie and anti-cache-header invariant, strict-mode option, anonymous-user policy, verified/onboarded/full-app server boundaries, recovery-route ancestry invariant, configured password/magic-link/link-or-OTP journey, `NEXT_PUBLIC_SITE_URL` as the sole runtime application-origin source, aligned initial and resent link-confirmation redirects, safe already-used/expired confirmation handling based on a fresh current-user check, provider-first direct routes, mode-preserving “Continue with email”, the compact three-icon social switcher, direct email-form opening when no social provider is enabled, reveal-mode password-confirmation collapse and validation, the floating non-reflowing password checklist, serialisable safe Auth Server Action results, localised Supabase error codes, magic-link visibility gates, complete typed social OAuth provider map, guarded provider initiation, managed provider-icon path, conditional provider divider, action-specific pending states, same-origin GET/POST server-route logout, absence of a redundant JSON signup route, SnapScreen-based shared presentation contract, responsive single-logo handoff, private global-role source, custom access-token hook, JWT freshness limitations, and organisation-context boundary. It also records that managed tests validate portable shared contracts without prescribing developer-owned configuration choices, route pages, root-layout composition, or source formatting. The mobile-auth resource records the developer-owned native identifiers, generated iOS and Android association endpoints, PKCE client boundary, Proxy bypass, callback validation, and platform verification requirements.

The same authentication resource records managed Supabase Auth TOTP enrolment, cancellation, AAL1-to-AAL2 sign-in challenge, factor removal, provider-aware email/password settings, and the rule that application tables never store TOTP secrets.

The workflow resource also records the managed Bruno parity rule. Client-callable Core `api` RPC changes must update `docs/bruno/supacharger-rpc/` and pass `npm run check:bruno-rpcs`. Consumers receive the exact collection and checker, verify the canonical subset, and keep product-specific RPCs separately.

The billing resource records the billing-account domain, explicit personal/organisation subject service, session-derived personal ownership, organisation resolver adapter, scoped overview rules, managed settings/acquisition/Portal routes, multi-subscription and multi-item projection, entitlement boundary, Dynamic Payment Methods, flexible billing mode, schema ownership, durable event/reconciliation contract, required event list, secrets, and verification rules. Organisation guidance also records Core route ownership and the developer-owned page, navigation, chrome, profile, and CSS seams used to preserve product-only behaviour without parallel pages. It is descriptive only and cannot access Stripe, read secrets, or apply migrations.
