import type { MetadataRoute } from 'next';

import { pathMatches } from '@/supacharger/auth/route-policy';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export type MarketingPageName =
  | 'coreWidgetDemos'
  | 'home'
  | 'legal'
  | 'license'
  | 'paywallDemos'
  | 'whatsIncluded';

type MarketingPageRoute = {
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  path: string;
  priority: number;
};

/**
 * Add each canonical, indexable marketing page here once. Metadata, the sitemap,
 * structured data and llms.txt all use this registry. Authentication remains
 * authoritative: sitemap entries are emitted only while their paths are public.
 */
export const MARKETING_PAGE_ROUTES: Record<MarketingPageName, MarketingPageRoute> = {
  coreWidgetDemos: { path: '/features/core-widget-demos', changeFrequency: 'monthly', priority: 0.7 },
  home: { path: '/', changeFrequency: 'daily', priority: 1 },
  legal: { path: '/legal', changeFrequency: 'yearly', priority: 0.4 },
  license: { path: '/license', changeFrequency: 'yearly', priority: 0.5 },
  paywallDemos: { path: '/features/paywall-demos', changeFrequency: 'monthly', priority: 0.6 },
  whatsIncluded: { path: '/features/whats-included', changeFrequency: 'monthly', priority: 0.8 },
};

export function getIndexableMarketingPages() {
  return (Object.entries(MARKETING_PAGE_ROUTES) as [MarketingPageName, MarketingPageRoute][]).filter(
    ([, route]) => pathMatches(route.path, SC_CONFIG.PATH_AUTH_GUARD.UNAUTHED_USER.ALLOWED),
  );
}
