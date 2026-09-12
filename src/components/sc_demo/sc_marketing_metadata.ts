import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { createSupachargerPageMetadata } from '@/supacharger/root-document';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

type MarketingPageName = 'coreWidgetDemos' | 'home' | 'legal' | 'license' | 'paywallDemos' | 'pricing' | 'whatsIncluded';

const canonicalPaths: Record<MarketingPageName, string> = {
  coreWidgetDemos: '/features/core-widget-demos',
  home: '/',
  legal: '/legal',
  license: '/license',
  paywallDemos: '/features/paywall-demos',
  pricing: '/pricing',
  whatsIncluded: '/features/whats-included',
};

export async function createMarketingPageMetadata(pageName: MarketingPageName): Promise<Metadata> {
  const t = await getTranslations(`MarketingMetadata.${pageName}`);
  const page = { description: t('description'), title: t('title') };
  const metadata = createSupachargerPageMetadata(SC_CONFIG, {
    title: page.title,
    description: page.description,
    canonicalPath: canonicalPaths[pageName],
  });

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
