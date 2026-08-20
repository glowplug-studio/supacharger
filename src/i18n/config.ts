export const SUPPORTED_LOCALES = ['en', 'fr'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_COOKIE_NAME = 'supacharger_locale';

export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): AppLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}
