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
- Webhooks to automatically synchronize Stripe with Supabase
- Stripe fixture to bootstrap product data
- Supabase migrations to bootstrap and manage your db schema
- Responsive, performant, and accessible prebuilt pages
- Brevo email integration for welcome emails and payment receipts

Shared runtime and tooling dependencies are exact-pinned in `package.json`. Consuming applications should use the same pinned version for every dependency they inherit from the Supacharger core; application-only packages remain independently managed.

### Localisation

Supacharger uses `next-intl` with locale-neutral routes. A signed-in page keeps the same URL in every language—for example, `/account` never becomes `/en/account`. The request locale comes from the validated `supacharger_locale` cookie and falls back to English.

Applications own their locale policy and translations:

- `src/i18n/config.ts` declares supported and default locales;
- `src/i18n/request.ts` loads the request catalogue; and
- `messages/<locale>.json` contains application translations.

The Supacharger CLI installs starter files for a new application, then preserves all of these paths during `coreupdate`. Core releases may introduce new translation keys, so review release notes and add required keys to each application-owned catalogue when upgrading. See the [localisation guide](https://supacharger.dev/docs/Application%20Development/localisation) for setup and extension details.

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fglowplug-studio%2Fsupacharger&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,SUPABASE_SECRET_KEY,SUPABASE_DB_PASSWORD,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,STRIPE_EVENT_PROCESSOR_SECRET,BREVO_API_KEY,NEXT_PUBLIC_SITE_URL&demo-title=Supacharger%20SaaS%20Starter&demo-url=https%3A%2F%2Fdemo.supacharger.dev&integration-ids=oac_VqOgBHqhEoFTPzGkPd7L0iH6)

1. Click the deploy button ⬆️
1. On the form create a new repo and add the Supabase integration
1. Add the environment variables that you have available
1. Make sure to include `NEXT_PUBLIC_SITE_URL` with your production domain
1. Click Deploy

### 5. Stripe Webhook

1. After deploying go to your Vercel dashboard and find your Vercel URL
1. In Stripe Workbench, create a Sandbox event destination using API version `2026-07-29.dahlia`
1. Enter your Vercel URL followed by `/api/webhooks`
1. Select only `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, `price.deleted`, `checkout.session.completed`, and the implemented `customer.subscription.*` lifecycle events
1. Scroll to the bottom of the page and click `Add endpoint`
1. Click to `Reveal` signing secret and copy it
1. Go to your `Vercel project settings` → `Environment Variables`
1. Update the value of the `STRIPE_WEBHOOK_SECRET` env with your newly acquired webhook secret. Press `Save`

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
   - Subscribe to a plan
   - Check for welcome and receipt emails
   - Manage subscription


**That's the end of the setup. The following are guides to help you code in your new codebase.**

---

## Guides

### Managing products

Your products and prices are managed via the `stripe-fixtures.json` file. You can delete your test data in Stripe on the [Developers page](https://dashboard.stripe.com/test/developers), make the changes you'd like, and then run the fixture command from above. When changes are made in Stripe the webhook hits the api route at `src/app/api/webhooks`. The handler will synchronize the data sent from Stripe to your Supabase database.

The `metadata` field in your fixture is where we can store info about the product that can be used in your app. For example, say you have a basic product, and one of the features of the product includes a max number of team invites. You can add a field to the metadata like `team_invites`. Then update the Zod schema in `src/features/pricing/models/product-metadata.ts`

Then you can make use of it like this:

```ts
const products = await getProducts();
const productMetadata = productMetadataSchema.parse(products[0].metadata); // Now it's typesafe 🙌!
productMetadata.teamInvites; // The value you set in the fixture
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
