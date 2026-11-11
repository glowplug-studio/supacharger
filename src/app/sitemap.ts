import type { MetadataRoute } from 'next';

import { getIndexableMarketingPages } from '@/components/sc_demo/sc_marketing_routes';
import { getURL } from '@/supacharger/utils/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return getIndexableMarketingPages().map(([, route]) => ({
    url: getURL(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
