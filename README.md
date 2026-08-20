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

- Next.js 16.3
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

Authentication uses one request-scoped SSR client and one verification call. The core defaults to verified JWT claims and excludes anonymous Auth users; an application can deliberately choose strict Auth-server verification:

```ts
AUTH_SESSION: {
  VERIFICATION_MODE: 'claims', // or 'user' for strict/fresh Auth validation
  ALLOW_ANONYMOUS_USERS: false,
},
```

Every Proxy redirect preserves refreshed cookies and Supabase's auth anti-cache headers. Proxy is an optimistic navigation layer only; server code and RLS remain authoritative.

Authentication, identity, onboarding, and organisations are application policy behind one shared contract:

```ts
AUTHENTICATION: {
  EMAIL_PASSWORD: { SIGN_IN: true, SIGN_UP: true },
  MAGIC_LINK: { ENABLED: true, ALLOW_SIGN_UP: true },
  SIGN_UP_EMAIL_VERIFICATION: 'otp', // 'disabled' | 'link' | 'otp'
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

The canonical login journey preserves SnapScreen's approved progressive visual structure across Core, SnapScreen, and Wakekeeper: strong headings, provider-to-email transitions, dark auth surfaces, branded actions, and matching password-reset screens. It exposes only enabled methods and supports password sign-in/sign-up, magic links, six-digit sign-up OTP verification, and resend cooldown. Project copy, colour, imagery, and adapters remain developer-owned; Specdrive retains its separate presentation. Supabase Auth settings and email templates must match the selected verification mode. When onboarding is required, callbacks and Proxy call `api.is_profile_complete_by_current_user(p_username_required)` and redirect to the real developer-owned route. The starter supplies `/account/setup-profile`; applications may preserve a product-specific form at the configured path.

### Mobile login verification and deep links

Supacharger can publish the verified HTTPS association files used by iOS Universal Links and Android App Links. This lets a magic link, link-based email confirmation, or password-reset link open an installed mobile app while retaining the same web URL as a browser fallback. A six-digit email OTP is entered directly and does not itself require a deep link.

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

The private `app.user_roles` table and custom access-token hook add a compact `user_role` claim to newly issued or refreshed JWTs. Organisation and project roles remain membership data enforced through RLS; they are not flattened into the global role. See `docs/agents/authentication-and-claims.md` and the [human roles guide](https://supacharger.dev/docs/Application%20Development/roles-and-custom-claims).

### Localisation

Supacharger uses `next-intl` with locale-neutral routes. A signed-in page keeps the same URL in every language—for example, `/account` never becomes `/en/account`. The request locale comes from the validated `supacharger_locale` cookie, then the signed-in user's saved profile preference, and finally English.

A separate marketing site can hand off a language by linking to the SaaS with a standard query parameter such as `https://app.example.com/login?lang=fr`. Supacharger accepts only a locale listed in `SUPPORTED_LOCALES`, stores it as the active preference, synchronises the lowercase two-letter code to `app.profiles.language_code` when the user is signed in, and redirects to the same URL without `lang`. If the visitor signs in later, the cookie preference is synchronised after authentication. Other query parameters are preserved.

Applications own their locale policy and translations:

- `src/i18n/config.ts` declares supported and default locales;
- `src/i18n/request.ts` loads the request catalogue; and
- `messages/<locale>.json` contains application translations.

The protected `/api/intl` endpoint also persists authenticated language changes to `app.profiles.language_code`. The field accepts lowercase two-letter codes; application support remains controlled by `SUPPORTED_LOCALES`. The Supacharger CLI installs starter files for a new application, then preserves all of these paths during `coreupdate`. Core releases may introduce new translation keys, so review release notes and add required keys to each application-owned catalogue when upgrading. See the [localisation guide](https://supacharger.dev/docs/Application%20Development/localisation) for setup and extension details.

Canonical client-callable database RPC examples live in the Supacharger-only Bruno collection at `docs/bruno/supacharger-rpc/`. Run `npm run check:bruno-rpcs` after an `api` RPC migration; consumer-specific endpoints do not belong in this collection.

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

Supacharger does not equate a login user with a Stripe Customer. `app.billing_accounts` represents the billable party, `app.billing_account_members` authorises users, and `app.stripe_customers` maps each account to the appropriate Stripe live/test Customer. A Customer may have multiple Subscriptions and every Subscription may have multiple rows in `app.subscription_items`. New application code must not authorise from the deprecated single `subscriptions.price_id` alias.

Checkout uses flexible billing mode and Stripe Dynamic Payment Methods. `payment_method_types` is intentionally omitted: enable eligible cards, wallets, bank debits, and local methods in Stripe Dashboard. Configure Automatic Tax, address collection, and promotion codes under `SC_CONFIG.BILLING`; Stripe tax registrations and Product tax codes are still required outside the application.

Use `createCheckoutAction({ items, billingAccountId })` for multi-item Checkout. The server resolves every Price directly from Stripe, requires active recurring Prices, validates positive quantities and one currency, and verifies that the current user can manage the billing account.

Do not use Price IDs or unvalidated Product metadata directly as access control. Define stable feature lookup keys and map Stripe Products through Stripe Entitlements or `app.product_features`. Stripe grants are projected into `app.entitlement_grants`; manual and promotional grants use the same read model and survive Stripe refreshes. Set `SC_CONFIG.BILLING_ACCESS.FEATURE_LOOKUP_KEY` to require a feature, or leave it `null` for the compatibility policy of any active/trialling Subscription.

Then you can make use of it like this:

```ts
const products = await getProducts();
const billingAccounts = await getBillingOverview();
const featureKeys = billingAccounts.flatMap((account) =>
  account.entitlements.map((grant) => grant.feature_lookup_key),
);
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

### Configuring auth providers

There are many auth providers you can choose from. [See the Supabase docs](https://supabase.com/docs/guides/auth#providers) for the full the list and their respective guides to configure them.

### Styling

The application imports Tailwind once through `src/supacharger/styles/globals.css`. Styling is split by ownership:

- `src/supacharger/styles/globals.css` is the CLI-managed Tailwind entrypoint.
- `src/supacharger/styles/supacharger.css` contains reusable, CLI-managed Supacharger rules.
- `src/supacharger/styles/project.example.css` is the CLI-managed reference file and is not imported.
- `src/styles/project.css` is developer-owned. Put the named project's theme tokens, global defaults, product-specific classes, and overrides there; CLI updates preserve it.

Prefer Tailwind utilities in components. When custom CSS is needed, use `@layer base` for element defaults and theme tokens, `@layer components` for semantic classes, and `@layer utilities` for narrowly scoped utilities. Do not import Tailwind again from `project.css`.

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

This project was inspired by Kolby Sisk's [next-supabase-stripe-starter]([https://github.com/vercel/nextjs-subscription-payments](https://github.com/KolbySisk/next-supabase-stripe-starter/tree/main)).
