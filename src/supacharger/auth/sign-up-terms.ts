import { SC_CONFIG } from '@/supacharger/supacharger-config';

/** Locale-specific legal destination, falling back to the configured default. */
export function signUpTermsUrl(locale: string): string | null {
  const urls = SC_CONFIG.AUTHENTICATION.SIGN_UP_TERMS.URL;
  const value = (urls.LOCALES[locale] || urls.DEFAULT)?.trim();
  if (!value || /[\\\u0000-\u0020]/.test(value)) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
