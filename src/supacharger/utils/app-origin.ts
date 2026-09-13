import { z } from 'zod';

import { getSafeNextPath } from '@/supacharger/auth/safe-next-path';

const originSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password &&
    url.pathname === '/' && !url.search && !url.hash;
});

/** Exact origins only: never trust wildcard hosts or arbitrary forwarded headers. */
export function parseAppOrigin(value: string): string {
  return new URL(originSchema.parse(value)).origin;
}

export function resolveAppOrigin(
  headers: Pick<Headers, 'get'>,
  allowedOrigins: readonly string[],
  requestUrl?: string,
): string {
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  const suppliedOrigin = headers.get('origin');
  const protocol = headers.get('x-forwarded-proto') ??
    (host && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) ? 'http' : 'https');
  const origin = parseAppOrigin(requestUrl ? new URL(requestUrl).origin :
    suppliedOrigin ?? `${protocol}://${host ?? ''}`);
  if (!allowedOrigins.map(parseAppOrigin).includes(origin) ||
      (suppliedOrigin && parseAppOrigin(suppliedOrigin) !== origin) ||
      (host && new URL(origin).host !== host)) {
    throw new Error('Untrusted application origin');
  }
  return origin;
}

/** Construct a same-origin absolute URL from an application-relative path. */
export function appURL(path: string, origin: string): string {
  const safePath = getSafeNextPath(path || '/');
  if (!safePath) throw new Error('Invalid application path');
  return new URL(safePath, parseAppOrigin(origin)).href;
}
