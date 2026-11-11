import type { Metadata } from 'next';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

import { createSupachargerPageMetadata } from '@/supacharger/root-document';
import { localisedSiteConfig } from '@/supacharger/site-identity';

import { MARKETING_PAGE_ROUTES, type MarketingPageName } from './sc_marketing_routes';

export async function createMarketingPageMetadata(pageName: MarketingPageName): Promise<Metadata> {
  const [t, messages, locale] = await Promise.all([
    getTranslations(`MarketingMetadata.${pageName}`),
    getMessages(),
    getLocale(),
  ]);
  const page = { description: t('description'), title: t('title') };
  const metadata = createSupachargerPageMetadata(
    localisedSiteConfig(messages),
    {
      title: page.title,
      description: page.description,
      canonicalPath: MARKETING_PAGE_ROUTES[pageName].path,
    },
    locale,
  );

  if (pageName !== 'home') return metadata;

  return {
    ...metadata,
    title: { absolute: page.title },
    openGraph: {
      ...metadata.openGraph,
      title: page.title,
    },
    twitter: {
      ...metadata.twitter,
      title: page.title,
    },
  };
}
