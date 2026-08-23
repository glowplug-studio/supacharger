<p align="center">
  <h1 align="center">Supacharger Demo</h1>
  <p align="center">
    <a href="https://supacharger.dev"><img src="/docs/gh-banner.jpg"/></a>
  </p>
</p>

<p align="center">
  <a href="https://glowplug.studio/" rel="nofollow"><img src="https://img.shields.io/badge/created%20by-Glowplug Studio-e57060.svg" alt="Created by Glowplug Studio"></a>
  <a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/glowplug-studio/supacharger" alt="License"></a>
</p>

## Introduction

This is a SaaS starter built with modern technologies.

### What's included

- Next.js 16.3.2
- [Supabase](https://supabase.com) - Postgres database & user authentication
- [Stripe](https://stripe.com) - [Checkout](https://stripe.com/docs/payments/checkout), [subscriptions](https://stripe.com/docs/billing/subscriptions/overview), and [customer portal](https://stripe.com/docs/customer-management)
- [Brevo](https://brevo.com) - Marketing and transactional emails
- [Tailwind CSS 4.3](https://tailwindcss.com/) - CSS framework
- [Lucide React 1.31](https://lucide.dev/) - Icon library
- [Zod 4.4](https://zod.dev/) - Runtime validation and typed schemas
- [shadcn/ui](https://ui.shadcn.com) - Prebuilt accessible components
- Durable Stripe event processing, scheduled reconciliation, multi-item subscriptions, and entitlement projection
- Stripe fixture to bootstrap product data
- Supabase migrations to bootstrap and manage your db schema
- Responsive, performant, and accessible prebuilt pages
- Brevo email integration for welcome emails and payment receipts

Shared runtime and tooling dependencies are exact-pinned in `package.json`. Consuming applications should use the same pinned version for every dependency they inherit from the Supacharger core; application-only packages remain independently managed.

### Application configuration

Every Supacharger application exposes the same option contract in `supacharger.config.ts`, enforced by `SupachargerConfig`. Values remain application-owned: branding, routes, providers, billing requirements, marketing URLs, and UI choices may differ without changing the available option names or shapes. The CLI preserves the settings file and distributes the protected contract used to detect missing or obsolete options.

### Core update ownership

The version 2 `.supacharger/managed-files.json` contract separates exact managed files, merge-managed configuration, forward-only migrations, and developer-owned paths. Exact paths—including `postcss.config.mjs`, the protected route/runtime trees, and shared contract tests—must be byte-identical in managed consumers. Package files, `supabase/config.toml`, and `tailwind.config.ts` are merged without discarding product settings. Migration histories are append-only. Product and account routes live under `src/app/(project)/`; reusable handlers remain under `src/app/(supacharger)/`.

Managed contract tests contain only reusable Core assertions. Keep product-specific catalogue, table, RPC, and policy checks in `test/project-billing-schema-contract.test.mjs`, which is an explicit developer-owned seam, and extend the consumer's merge-managed `test:billing-schema` script to run it beside the protected shared test.

### Input validation

Client-side form validation is for fast feedback; every submitted form and other untrusted payload must be parsed again with Zod in the receiving Server Action, route handler, or server-side JavaScript or TypeScript boundary before side effects or persistence. Structured Supabase Edge Function inputs should also use Zod where appropriate before privileged work or RPC calls. PostgreSQL RPCs cannot run Zod, so validate in the caller and independently enforce typed parameters, constraints, authentication, authorisation, grants, and RLS in PostgreSQL. See the [input validation guide](https://supacharger.dev/docs/Application%20Development/input-validation).

### Document metadata, providers, and analytics

New projects receive `src/app/layout.tsx` as an editable template. It is explicitly developer-owned after installation, so `supacharger coreupdate` does not overwrite fonts, body classes, product providers, or extra head content. The protected `src/supacharger/root-document.tsx` helper remains CLI-managed and supplies consistent metadata, viewport, favicon, SEO, and analytics behaviour.

Configure global defaults in `src/supacharger.config.ts`:

```ts
import { getSiteUrl } from '@/supacharger/utils/site-url';

METADATA: {
  SITE_URL: getSiteUrl(),
  TITLE_TEMPLATE: '%s | My Product',
  INDEXING_ENABLED: process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === 'production'
    : process.env.NODE_ENV === 'production',
  FAVICON_SET_ENABLED: true,
  SOCIAL_IMAGE: null,
  COLOR_SCHEME: 'light dark',
  THEME_COLOR: null,
},
ROOT_PROVIDERS: {
  INTERNATIONALISATION: true,
  THEME: true,
  TOASTS: true,
},
ANALYTICS: {
  GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || null,
  VERCEL_ANALYTICS_ENABLED: true,
},
```

Set the required `NEXT_PUBLIC_SITE_URL` once to the stable canonical application origin; do not duplicate it as a runtime fallback or use a preview deployment URL as the canonical base. `getSiteUrl()` validates and normalises it, while `getURL(path)` constructs application redirects. A missing value fails clearly instead of silently redirecting to a stale host or port. `INDEXING_ENABLED` prevents development and Vercel preview deployments from being indexed by default. Enable `FAVICON_SET_ENABLED` only when `public/favicon.ico` and the standard files under `public/favicons/` exist, and set `SOCIAL_IMAGE` when the application has an appropriate Open Graph image.

Child pages can export a normal Next.js `metadata` object to receive the configured title template, or use the protected helper when they also need consistent canonical and social metadata:

```ts
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { createSupachargerPageMetadata } from '@/supacharger/root-document';

export const metadata = createSupachargerPageMetadata(SC_CONFIG, {
  title: 'Pricing',
  description: 'Compare plans for My Product.',
  canonicalPath: '/pricing',
});
```

A page can use Next.js `title.absolute` when it deliberately needs to bypass the global template. Google Analytics is disabled when `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` is empty and is loaded through Next.js's `@next/third-parties/google` integration when configured. A GA4 measurement ID is public configuration, not a secret; use a different value per deployment where required.

Public content pages should expose page-specific canonical and social metadata and appear in `src/app/sitemap.ts`. Keep authenticated and authentication routes out of the sitemap. `src/app/robots.ts` follows `METADATA.INDEXING_ENABLED`. Proxy must bypass the complete `/_next/` framework namespace, `/robots.txt`, `/sitemap.xml`, `/.well-known/`, and public metadata such as `.webmanifest` files so framework assets, HMR, crawlers, association documents, and install manifests receive their direct responses rather than authentication redirects. Development also permits the narrow `127.0.0.1` hostname through `allowedDevOrigins` for loopback-origin asset requests.

Authentication uses one request-scoped SSR client and exactly one `getClaims()` verification call in Proxy. Before the Auth client runs, the protected Proxy removes password, email, MFA and organisation-registration fields that a non-hydrated Auth form might accidentally submit in the URL; safe return parameters remain intact. Anonymous Auth users are excluded unless the application deliberately enables them:

```ts
AUTH_SESSION: {
  ALLOW_ANONYMOUS_USERS: false,
},
```

Every Proxy redirect preserves refreshed cookies and Supabase's auth anti-cache headers. Proxy is an optimistic navigation layer only and performs no database RPCs. `src/supacharger/auth/server-access.ts` exposes three explicit server boundaries: `requireVerifiedUser()` for recovery routes that need only a verified identity, `requireOnboardedUser()` for billing acquisition without an entitlement check, and `requireAppAccess()` for full product access. Onboarding is evaluated before billing, disabled policies issue no corresponding RPC, and handler checks plus RLS remain authoritative.

A recovery destination must not inherit the guard for the condition it recovers. Keep profile setup under a verified-only route group, billing acquisition under an onboarded route group, and ordinary protected product routes under the full-app guard. Next.js route groups do not change the public URLs.

Authentication, identity, onboarding, and organisations are application policy behind one shared contract:

```ts
AUTHENTICATION: {
  EMAIL_PASSWORD: { SIGN_IN: true, SIGN_UP: true },
  PASSWORDLESS_EMAIL: {
    SIGN_IN: 'otp', // 'disabled' | 'otp' | 'link'
    SIGN_UP: 'disabled',
    OTP_LENGTH: 6, // 6 through 10
  },
  SIGN_UP_EMAIL_VERIFICATION: 'otp', // also supports 'otp-and-link'
  MFA_TOTP: { ENABLED: false },
},
PROFILE_IDENTITY: {
  USERNAME: 'disabled', // 'disabled' | 'optional' | 'required'
},
POST_SIGN_IN_ONBOARDING: {
  REQUIRED: true,
  REDIRECT_PATH: '/account/setup-profile',
},
ORGANISATIONS: {
  ENABLED: false,
  AUTHENTICATION_HANDLE: 'disabled', // 'disabled' | 'optional' | 'required'
},
```

The canonical login journey preserves SnapScreen's approved progressive visual structure across Core, SnapScreen, and Wakekeeper. Its public pages are exact managed routes at `/account/login`, `/account/create`, `/account/login-magic`, `/account/reset-password`, and `/account/reset-password/new`; `/auth/callback`, `/auth/confirm`, and the safe `/auth/error` page remain managed protocol/error routes. The managed shell imports the developer-owned `src/supacharger.adapters/auth/auth-sidecar.tsx`, while semantic `sc-auth-*` hooks are presented by the preserved `src/styles/supacharger-auth.css`. This keeps route logic and accessible structure upgradeable without replacing product imagery, branding, or licensed presentation.

The journey supports password authentication and one exclusive passwordless email experience per action: `disabled`, `otp`, or `link`. `PASSWORDLESS_EMAIL.OTP_LENGTH` controls every OTP field and accepts 6 through 10; keep the local `[auth.email] otp_length` and the hosted Supabase setting equal to it. Passwordless sign-in sets `shouldCreateUser: false` and verifies entered codes with `type: 'email'`. Password signup and `SIGN_UP_EMAIL_VERIFICATION` remain separate; signup verification supports `disabled`, `otp`, `link`, or `otp-and-link` and verifies codes with `type: 'signup'`. Passwordless OTP templates contain `{{ .Token }}` without a sign-in link, while passwordless link templates contain the link without an OTP. A local template or `config.toml` does not update a hosted project. Safe `next` paths are preserved across the journey. Specdrive uses the same managed route/form behaviour through its own developer-owned presentation and keeps its old `/auth/*` user routes only as temporary safe redirects.

Logout also uses a safe application-relative destination. `POST /account/logout` clears the SSR session and returns JSON containing that relative `redirectTo` path for the managed button. Direct navigation through `GET /account/logout` clears the same session and issues a `303` with a relative `Location` header, which the browser resolves against the incoming request origin. This keeps logout on the origin the user actually opened and prevents a stale `NEXT_PUBLIC_SITE_URL` host, scheme, or port from turning a successful logout into a failed client redirect.

### Mobile login verification and deep links

Supacharger can publish the verified HTTPS association files used by iOS Universal Links and Android App Links. This lets a magic link, link-based email confirmation, or password-reset link open an installed mobile app while retaining the same web URL as a browser fallback. An email OTP is entered directly and does not itself require a deep link.

Configure native identifiers in the developer-owned settings file; never copy another application's identifiers:

```ts
MOBILE_DEEP_LINKING: {
  ENABLED: true,
  ASSOCIATED_PATHS: [
    '/auth/callback',
    '/auth/confirm',
    '/account/reset-password/new',
  ],
  IOS: {
    // <Apple App ID prefix>.<bundle identifier>; not the numeric App Store ID.
    APP_IDS: ['ABCDE12345.com.example.myapp'],
  },
  ANDROID: {
    APPS: [{
      PACKAGE_NAME: 'com.example.myapp',
      SHA256_CERT_FINGERPRINTS: ['<PLAY_APP_SIGNING_SHA256_FINGERPRINT>'],
    }],
  },
},
```

When enabled for a configured platform, the protected core serves:

- `/.well-known/apple-app-site-association` for iOS; and
- `/.well-known/assetlinks.json` for Android.

Both must be available on the exact production HTTPS host with a `200` response, `application/json`, and no redirect. Add the exact production `/auth/callback`, `/auth/confirm`, and reset URLs to Supabase's redirect allow-list. For a wrapped web application, pass an incoming verified URL back into the same persistent web view that initiated the PKCE flow; a fully native application must initiate and exchange the code through the same native Supabase client instead. See the [mobile authentication deep-linking guide](https://supacharger.dev/docs/Application%20Development/mobile-auth-deep-linking) for Xcode, Android manifest, callback, and verification examples.

Username and organisation storage are always installed. A disabled policy leaves those nullable tables/fields dormant: forms, public username routes, and identity display must not expose them. Identity display falls back from name, to an enabled populated username, to owner-only email, to `Account`. Organisation creation and selection run only through authenticated, service-owned adapters and session context; handles are not arbitrary Auth metadata.

### Database and profile foundation

The canonical private user row is `app.profiles`. Shared fields use `first_name`, `last_name`, `username`, `email`, `avatar_path`, `header_image_path`, and `language_code`; product-specific fields may extend the row without introducing a second user table. Browser code uses the `api` RPC surface, while trusted Stripe and maintenance code uses `api_edge`.

Profile media lives in the private `user-avatars` bucket. Store paths using `<user-id>/avatar-…` and `<user-id>/headers/header-…`, then render short-lived signed URLs. The general profile lookup intentionally excludes email and complete profile rows. The optional `app.organisations`, `app.organisation_members`, and `app.user_session_contexts` foundation is private and dormant when disabled. See `docs/agents/database-foundation.md` for the full contract.

Authenticated application chrome should load `AccountSummary` through the managed `/api/account/summary` boundary or the server-only `loadAccountSummary()` service. The backing `api.get_account_summary_by_current_user()` RPC returns identity, active-organisation context, and organisation count in one query; the service verifies the user once and batch-signs only requested private media. Developer-owned menus retain their own presentation and subscribe through `useAccountSummary()`. Successful profile or avatar mutations call `publishAccountSummaryChanged()` so mounted menus refresh without a full reload.

The globally deployed `process-image-upload` Edge Function provides reusable image resizing and re-encoding. It requires a signed-in user and accepts only multipart `file` plus a named `target`; callers cannot supply a Storage bucket, destination folder, filename prefix, output format, dimensions, or compression value. Those values live in the developer-owned `supabase/functions/_shared/image-targets.ts` policy, while the transformer and HTTP boundary are CLI-managed. Uploads use the caller's JWT and Storage RLS, never a service-role client. The starter targets create a 300×300 JPEG avatar or a 1600×600 JPEG header; target policy can also select lossless PNG output, inside/cover resizing, JPEG quality, PNG compression effort, input byte/pixel limits, cache policy, and private signed or public URLs. See `docs/agents/image-transformation.md` and the [Edge Functions guide](https://supacharger.dev/docs/Application%20Development/edge).

Next.js and Supabase Edge Functions have separate TypeScript runtimes. The root `tsconfig.json` excludes `supabase/functions/**/*` from the Next.js compiler; keep that exact boundary in consuming applications and run Edge Function checks with their Deno-based scripts. Do not make Next.js resolve Deno globals, URL imports, or `jsr:` modules merely to make `npm run build` pass.

The private `app.user_roles` table and custom access-token hook add a compact `user_role` claim to newly issued or refreshed JWTs. Organisation and project roles remain membership data enforced through RLS; they are not flattened into the global role. See `docs/agents/authentication-and-claims.md` and the [human roles guide](https://supacharger.dev/docs/Application%20Development/roles-and-custom-claims).

### Localisation

Supacharger uses `next-intl` with locale-neutral routes. A signed-in page keeps the same URL in every language—for example, `/account` never becomes `/en/account`. The request locale comes from the validated `supacharger_locale` cookie, then the signed-in user's saved profile preference, and finally English.

All canonical applications enable Next.js Cache Components. The locale cookie determines `<html lang>` and the active messages before the document can render, so the developer-owned root layout is the single intentional `instant = false` boundary. Do not use the obsolete `dynamic = 'force-dynamic'` route export with Cache Components. Stream narrower request-time work through `Suspense`, opt reusable reads into `use cache`, and add lower route-level `instant = false` declarations only for project routes that development navigation validation proves must block.

A separate marketing site can hand off a language by linking to the SaaS with a standard query parameter such as `https://app.example.com/login?lang=es`. Supacharger accepts only a locale listed in `SUPPORTED_LOCALES`, stores it as the active preference, synchronises the locale code to `app.profiles.language_code` when the user is signed in, and redirects to the same URL without `lang`. If the visitor signs in later, the cookie preference is synchronised after authentication. Other query parameters are preserved. The demo catalogues currently cover English (`en`), Spanish (`es`), and Simplified Chinese (`zh`).

Applications own their locale policy and translations:

- `src/i18n/config.ts` declares supported and default locales;
- `src/i18n/request.ts` loads the request catalogue; and
- `messages/<locale>.json` contains application translations.

The protected `/api/intl` endpoint also persists authenticated language changes to `app.profiles.language_code`. The field accepts lowercase two-letter codes; application support remains controlled by `SUPPORTED_LOCALES`. The Supacharger CLI installs starter files for a new application, then preserves all of these paths during `coreupdate`. When adding or changing localised copy, always update `messages/en.json`; leave secondary-language values empty or untouched unless translation into those languages is explicitly requested. Core release notes identify required English keys and any empty secondary placeholders needed for structural compatibility. See the [localisation guide](https://supacharger.dev/docs/Application%20Development/localisation) for setup and extension details.

Canonical client-callable database RPC examples live in the CLI-managed Bruno collection at `docs/bruno/supacharger-rpc/`. Run `npm run check:bruno-rpcs` after an `api` RPC migration. Core requires every current `api` RPC; managed consumers require the canonical subset and may keep product RPCs separately.

## Live Demo

🚀 **[View Live Demo](https://demo.supacharger.dev/)**

The demo includes:

- User authentication with Supabase
- Stripe payment integration (test mode)
- Subscription management
- Email notifications via Brevo
- Responsive design with shadcn/ui components

## Quick Start for Development

### Prerequisites

- Node.js 22.0.0+
- Supabase account
- Stripe account (test mode at least)
- Brevo account

### Environment Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/glowplug-studio/supacharger.git
   cd supacharger
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in your environment variables in `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

### Node.js Version Management

This project requires Node.js 22.0.0+. We've included version management files to ensure consistency:

#### Using nvm (recommended)

```bash
# Install and use the correct Node version
nvm use

# Or install if you don't have Node 22
nvm install 22
```

#### Using other version managers

- **fnm**: `fnm use`
- **nodenv**: `nodenv install && nodenv local`
- **volta**: Volta will automatically use the correct version

#### Manual installation

If you don't use a version manager, ensure you have Node.js 22.0.0+ installed:

```bash
node --version  # Should show v20.x.x
```

## Getting started

### 1. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
1. Go to Project Settings → Database → Database password and click reset database password then click generate a new password
1. Save this password somewhere, you can't see it after closing the box

### 2. Setup Stripe

1. Go to [stripe.com](https://stripe.com) and create a project
1. Go to [Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal) and click the `Active test link` button

### 3. Setup Brevo

1. Go to [brevo.com](https://brevo.com) and create an account
1. Go to the [API Keys page](https://app.brevo.com/settings/keys/api) and create an API Key
1. Create email templates for welcome and receipt emails (or use template IDs 1 and 2 in the code)

### 4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fglowplug-studio%2Fsupacharger&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,SUPABASE_SECRET_KEY,SUPABASE_DB_PASSWORD,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,STRIPE_EVENT_PROCESSOR_SECRET,STRIPE_RECONCILIATION_SECRET,BREVO_API_KEY,NEXT_PUBLIC_SITE_URL&demo-title=Supacharger%20SaaS%20Starter&demo-url=https%3A%2F%2Fdemo.supacharger.dev&integration-ids=oac_VqOgBHqhEoFTPzGkPd7L0iH6)

1. Click the deploy button ⬆️
1. On the form create a new repo and add the Supabase integration
1. Add the environment variables that you have available
1. Make sure to include `NEXT_PUBLIC_SITE_URL` with your production domain
1. Click Deploy

### 5. Stripe Webhook

1. After deploying go to your Vercel dashboard and find your Vercel URL
1. In Stripe Workbench, create a Sandbox event destination using API version `2026-07-29.dahlia`
1. Enter your Vercel URL followed by `/api/webhooks`
1. Select only `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, `price.deleted`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, the implemented `customer.subscription.*` lifecycle events, and `entitlements.active_entitlement_summary.updated`
1. Scroll to the bottom of the page and click `Add endpoint`
1. Click to `Reveal` signing secret and copy it
1. Go to your `Vercel project settings` → `Environment Variables`
1. Update the value of the `STRIPE_WEBHOOK_SECRET` env with your newly acquired webhook secret. Press `Save`
1. Configure scheduled authenticated POST requests to `/api/(supacharger)/stripe/process-events` and `/api/(supacharger)/stripe/reconcile` using the distinct processor and reconciliation secrets. Adapt the route-group URL to the deployed path emitted by Next.js (`/api/stripe/...` where route groups are omitted).

### 6. Run Supabase Migration

1. Run `npx supabase login`
1. Run `npx supabase init`
1. Update your `package.json` with your Supabase project ID
1. Run `npm run supabase:link`
1. Run `npm run migration:up`

### 7. Run Stripe Fixture

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli#install)
1. Run `stripe fixtures ./stripe-fixtures.json --api-key YOUR_STRIPE_SECRET_KEY`

### 8. Test Your Setup

1. Run `npm i`
1. Run `npm run dev`
1. Go to the app and test the complete user flow:
   - Sign up with email
   - Subscribe with one and multiple recurring Prices
   - Verify that eligible local payment methods come from Stripe Dashboard configuration
   - Check for welcome and receipt emails
   - Manage each authorised billing account in Customer Portal
   - Run event processing and reconciliation, then verify subscription Items and entitlements in Supabase

**That's the end of the setup. The following are guides to help you code in your new codebase.**

---

## Guides

### Managing products

Products and Prices are managed in Stripe and can be bootstrapped in a Sandbox with `stripe-fixtures.json`. Stripe is authoritative; webhook processing and scheduled reconciliation maintain the Supabase projection.

Supacharger does not equate a login user with a Stripe Customer. `app.billing_accounts` represents the billable party, `app.billing_account_members` authorises users, and `app.stripe_customer_mappings` maps each account to the appropriate Stripe live/test Customer. Each mapping has a local `stripe_customer_mapping_id`; `stripe_customer_id` is reserved for Stripe's external `cus_…` identifier. A Customer may have multiple Subscriptions and every Subscription may have multiple rows in `app.subscription_items`. New application code must not authorise from the deprecated single `subscriptions.price_id` alias.

Checkout uses flexible billing mode and Stripe Dynamic Payment Methods. `payment_method_types` is intentionally omitted: enable eligible cards, wallets, bank debits, and local methods in Stripe Dashboard. Configure Automatic Tax, address collection, and promotion codes under `SC_CONFIG.BILLING`; Stripe tax registrations and Product tax codes are still required outside the application.

Use `createCheckoutAction({ items, billingAccountId })` for multi-item Checkout. The server resolves every Price directly from Stripe, requires active recurring Prices, validates positive quantities and one currency, and verifies that the current user can manage the billing account.

Do not use Price IDs or unvalidated Product metadata directly as access control. Define stable feature lookup keys and map Stripe Products through Stripe Entitlements or `app.product_features`. Stripe grants are projected into `app.entitlement_grants`; manual and promotional grants use the same read model and survive Stripe refreshes. Set `SC_CONFIG.BILLING_ACCESS.FEATURE_LOOKUP_KEY` to require a feature, or leave it `null` for the compatibility policy of any active/trialling Subscription.

The shared billing contract test covers this reusable account, mapping, RPC, grant, type, and entitlement-access contract. Product catalogue RPCs and application-only billing tables or policies remain application-owned and are tested separately in `test/project-billing-schema-contract.test.mjs`.

Then you can make use of it like this:

```ts
const products = await getProducts();
const billingAccounts = await getBillingOverview();
const featureKeys = billingAccounts.flatMap((account) => account.entitlements.map((grant) => grant.feature_lookup_key));
```

### Managing your database schema

[Migrations](https://supabase.com/docs/reference/cli/supabase-migration-new) are a powerful concept for managing your database schema. Any changes you make to your database schema should be done through migrations.

Say you want to add a table named `invites`.

First run `npm run migration:new add-invites-table`
Then edit your file to include:

```sql
create table invites (
  id uuid not null primary key default gen_random_uuid(),
  email text not null,
);
alter table invites enable row level security;
```

Then run `npm run migration:up` and your table will be added.

### Supported third-party authentication

Supacharger supports Apple (`apple`), Microsoft Azure (`azure`), Bitbucket (`bitbucket`), Discord (`discord`), Facebook (`facebook`), Figma (`figma`), GitHub (`github`), GitLab (`gitlab`), Google (`google`), Kakao (`kakao`), Keycloak (`keycloak`), LinkedIn OIDC (`linkedin_oidc`), Notion (`notion`), Twitch (`twitch`), X/Twitter OAuth 2.0 (`x`), Twitter OAuth 1.0a compatibility (`twitter`), Slack OIDC (`slack_oidc`), legacy Slack compatibility (`slack`), Spotify (`spotify`), WorkOS (`workos`), and Zoom (`zoom`).

Set a provider to `true` in the typed `AUTH_PROVDERS_ENABLED` map to render its login/signup button and permit the shared OAuth server action; disabled providers are rejected by that action. Configure the same provider in Supabase and allow the application's exact `/auth/callback` URL before enabling its UI flag. Prefer the OIDC and OAuth 2.0 options for new LinkedIn, Slack, and Twitter/X integrations.

The CLI-managed Supabase SVG set lives in `src/supacharger/assets/svgr/auth-providers/`. It also contains Email, Phone, SAML, and Web3 artwork for future method-specific journeys; those methods are not interchangeable with `signInWithOAuth`.

Follow the [Supabase social login guides](https://supabase.com/docs/guides/auth/social-login) for provider credentials and callback configuration.

### Styling

The application imports Tailwind once through `src/supacharger/styles/globals.css`. Styling is split by ownership:

- `src/supacharger/styles/globals.css` is the CLI-managed Tailwind entrypoint.
- `src/supacharger/styles/supacharger.css` contains reusable, CLI-managed Supacharger rules.
- `src/supacharger/styles/project.example.css` is the CLI-managed reference file and is not imported.
- `src/styles/project.css` is developer-owned. Put the named project's theme tokens, global defaults, product-specific classes, and overrides there; CLI updates preserve it.
- `src/styles/supacharger-auth.css` is developer-owned authentication presentation. The CLI installs it when absent, imports it after the managed shared styles, and preserves it thereafter.
- `src/supacharger.adapters/auth/auth-sidecar.tsx` supplies the desktop sidecar and compact mobile brand used by the managed authentication shell. The CLI installs the starter only when missing.

Prefer Tailwind utilities in components. When custom CSS is needed, use `@layer base` for element defaults and theme tokens, `@layer components` for semantic classes, and `@layer utilities` for narrowly scoped utilities. Do not import Tailwind again from `project.css`.

The shared `ModeToggle` opens a three-position System, Light, and Dark selector. Marketing presentation can pass `appearance='marketing'` so it matches the developer-owned locale switcher; the root theme provider must enable system mode for all three choices to work.

Keep UI SVGs with their owning source under a developer-owned `src/` path and import them as React components through SVGR. Demo-only SVGs belong under `src/components/sc_demo/`, not `public/`, so the complete example can be deleted as one unit. Reserve public SVG URLs for favicons, manifests, external URL contracts, and similar cases that cannot use a component import.

The standard brand colour pair is `--primary` and `--primary-foreground`, expressed as space-separated HSL channels in `src/styles/project.css`. Use semantic utilities such as `bg-primary`, `text-primary-foreground`, `text-foreground`, `text-muted-foreground`, `bg-accent`, and `ring-ring` instead of copying a product colour into a component. This keeps reusable application-owned surfaces, including `src/app/error/page.tsx` and `src/app/not-found.tsx`, aligned with each consuming application's branding.

The primary developer-owned inline loading animation lives at `src/assets/svgr/ui/inline-loader.svg`; a matching black variant lives at `src/assets/svgr/ui/inline-loader-dark.svg`. Replace either file in place to customise it for a brand; CLI updates preserve both. Import them through SVGR rather than using an image tag or public URL. Both supplied assets take their artwork colour from the root `fill`, so callers can override it with a prop such as `<InlineLoader fill='currentColor' />`; a branded replacement may hard-code its colours and simply ignore that prop. The shared loading component uses the primary asset.

Responsive UI SVG sources need a correct `viewBox` and no root `width` or `height` when CSS controls sizing. Size their SVGR components at the call site with utilities such as `size-*`, `w-*`, `h-*`, or `size-[1em]`; usually add `shrink-0` beside text, preserve the artwork's aspect ratio, and use `currentColor` only when colour inheritance is intentional. Test the source contract and inspect the rendered SVG at each affected viewport so clipping cannot be hidden by arbitrary dimensions.

Error and not-found routes are application-owned rather than CLI-protected. The starter keeps their shared presentation under `src/components/error-page/`: unauthenticated visitors receive only a full-viewport error state, while a server-verified authenticated visitor receives the same state inside the application's signed-in header and footer. Keep `/error` in the application's public route allow-list so authentication failures can reach it without creating a redirect loop; the canonical Proxy also exempts that route from profile-onboarding redirects so the explanation is not hidden by another guard.

Error copy is localised from the developer-owned `ErrorPage` message namespace when it is available. The resolver provides complete protected English defaults for an absent namespace or individual missing values, so a preserved or temporarily stale catalogue cannot make the error boundary emit `MISSING_MESSAGE` while it is trying to explain another failure.

The shared base layer gives enabled interactive controls—including links, buttons, form actions, selects, summaries, and ARIA button/menu/tab controls—a pointer cursor on hover. Disabled controls are deliberately excluded, so ordinary components should not repeat `cursor-pointer` utilities.

The same base layer supplies native smooth scrolling, while the root layout mounts the protected `SmoothAnchorNavigation` helper so Next.js `<Link>` fragment navigation behaves identically. Every same-page link such as `href='#features'` works automatically, including clicks on nested link content and `/#features` links. Modified clicks, downloads, external targets, and missing fragments retain their normal browser behaviour. Set `data-smooth-scroll='false'` on an exceptional link to opt out. Visitors who prefer reduced motion receive immediate scrolling.

`tailwind.config.ts` remains a merge-managed application configuration file and retains its current CommonJS export. `postcss.config.mjs` is the exact ESM PostCSS boundary used by Next.js and Turbopack. Keep the `@config` reference unchanged; do not add a package-wide `"type": "module"` merely to load either configuration.

- [Learn more about shadcn/ui components](https://ui.shadcn.com/docs)
- [Learn more about theming with shadcn/ui](https://ui.shadcn.com/docs/theming)
- [Learn more about the Tailwind CSS theme config](https://tailwindcss.com/docs/theme)
- [Learn more about adding custom Tailwind styles](https://tailwindcss.com/docs/adding-custom-styles)

### Emails

Your emails live in the `src/features/emails` dir. Emails are finicky and difficult to style correctly, so make sure to reference the [React Email docs](https://react.email/docs/introduction). After creating your email component, sending an email is as simple as:

```ts
import WelcomeEmail from '@/features/emails/welcome';
import { resendClient } from '@/libs/resend/resend-client';

resendClient.emails.send({
  from: 'no-reply@your-domain.com',
  to: userEmail,
  subject: 'Welcome!',
  react: <WelcomeEmail />,
});
```

### File structure

The file structure uses the group by `feature` concept. This is where you will colocate code related to a specific feature, with the exception of UI code. Typically you want to keep your UI code in the `app` dir, with the exception of reusable components. Most of the time reusable components will be agnostic to a feature and should live in the `components` dir. The `components/ui` dir is where `shadcn/ui` components are generated to.

### Going live

Follow these steps when you're ready to go live:

1. Activate your Stripe account and set the dashboard to live mode
1. Repeat the steps above to create a Stripe webhook in live mode, this time using your live url
1. Update Vercel env variables with your live Stripe pk, sk, and whsec
1. After Vercel has redeployed with your new env variables, run the fixture command using your Stripe sk

---

## Support

If you need help contact support@glowplug.studio.

## Contribute

PRs are always welcome.

---

This project was inspired by Kolby Sisk's [next-supabase-stripe-starter](<[https://github.com/vercel/nextjs-subscription-payments](https://github.com/KolbySisk/next-supabase-stripe-starter/tree/main)>).
