import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import englishMessages from '../../messages/en.json';
import spanishMessages from '../../messages/es.json';
import chineseMessages from '../../messages/zh.json';

import { type AppLocale, LOCALE_COOKIE_NAME, resolveLocale } from './config';

const messageCatalogues = {
  en: englishMessages,
  es: spanishMessages,
  zh: chineseMessages,
} satisfies Record<AppLocale, typeof englishMessages>;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return {
    locale,
    messages: messageCatalogues[locale],
  };
});
