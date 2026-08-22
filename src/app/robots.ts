import type { MetadataRoute } from 'next';

import { SC_CONFIG } from '@/supacharger/supacharger-config';
import { getURL } from '@/supacharger/utils/site-url';

export default function robots(): MetadataRoute.Robots {
  if (!SC_CONFIG.METADATA.INDEXING_ENABLED) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: getURL('/sitemap.xml'),
    host: getURL(),
  };
}
