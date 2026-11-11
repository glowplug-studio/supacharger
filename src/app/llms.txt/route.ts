import { getIndexableMarketingPages } from '@/components/sc_demo/sc_marketing_routes';
import { getURL } from '@/supacharger/utils/site-url';

import englishMessages from '../../../messages/en.json';

export function GET() {
  const pages = getIndexableMarketingPages()
    .map(([pageName, route]) => {
      const page = englishMessages.MarketingMetadata[pageName];
      return `- [${page.title}](${getURL(route.path)}): ${page.description}`;
    })
    .join('\n');
  const body = `# Kuro\n\n> ${englishMessages.Global.siteDescription}\n\n## Public pages\n\n${pages}\n`;

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
