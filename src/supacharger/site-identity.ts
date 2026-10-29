import type { AbstractIntlMessages } from 'next-intl';

import { SC_CONFIG } from '@/supacharger/supacharger-config';

export function localisedSiteConfig(messages: AbstractIntlMessages) {
  const global = messages.Global;
  const title = typeof global === 'object' ? global.siteTitle : undefined;
  const description = typeof global === 'object' ? global.siteDescription : undefined;
  return {
    ...SC_CONFIG,
    SITE_TITLE: typeof title === 'string' && title.trim() ? title : SC_CONFIG.SITE_TITLE,
    SITE_DESCRIPTION: typeof description === 'string' && description.trim() ? description : SC_CONFIG.SITE_DESCRIPTION,
  };
}
