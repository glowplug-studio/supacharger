import { getTranslations } from 'next-intl/server';

import { getURL } from '@/supacharger/utils/site-url';

import { MARKETING_PAGE_ROUTES, type MarketingPageName } from './sc_marketing_routes';

function serialiseStructuredData(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default async function SCMarketingStructuredData({ pageName }: { pageName: MarketingPageName }) {
  const t = await getTranslations(`MarketingMetadata.${pageName}`);
  const route = MARKETING_PAGE_ROUTES[pageName];
  const pageUrl = getURL(route.path);
  const siteUrl = getURL();
  const page = {
    '@type': pageName === 'home' ? 'WebSite' : 'WebPage',
    '@id': pageName === 'home' ? `${siteUrl}/#website` : `${pageUrl}/#webpage`,
    url: pageUrl,
    name: t('title'),
    description: t('description'),
    ...(pageName === 'home' ? {} : { isPartOf: { '@id': `${siteUrl}/#website` } }),
  };
  const graph = pageName === 'home'
    ? [
        page,
        {
          '@type': 'SoftwareApplication',
          '@id': `${siteUrl}/#software`,
          name: 'Kuro',
          url: siteUrl,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: t('description'),
        },
      ]
    : [page];

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serialiseStructuredData({ '@context': 'https://schema.org', '@graph': graph }) }}
      type='application/ld+json'
    />
  );
}
