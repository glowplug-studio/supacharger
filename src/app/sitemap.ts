import type { MetadataRoute } from 'next';

import { getURL } from '@/supacharger/utils/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: getURL(),
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: getURL('/legal'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: getURL('/license'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: getURL('/pricing'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: getURL('/features/whats-included'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: getURL('/features/paywall-demos'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: getURL('/features/core-widget-demos'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
