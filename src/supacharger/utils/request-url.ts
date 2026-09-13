import { headers } from 'next/headers';

import { appURL, parseAppOrigin, resolveAppOrigin } from '@/supacharger/utils/app-origin';
import { getSiteUrl } from '@/supacharger/utils/site-url';

import 'server-only';

function allowedOrigins() {
  const origins = [getSiteUrl(), ...(process.env.APP_ALLOWED_ORIGINS ?? '')
    .split(',').map((value) => value.trim()).filter(Boolean)];
  // These are exact hostnames supplied by the deployment environment, not request headers.
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) origins.push(`https://${host}`);
  }
  return origins.map(parseAppOrigin);
}

export function getAppRequestOrigin(request: Request): string {
  return resolveAppOrigin(request.headers, allowedOrigins(), request.url);
}

export async function getRequestOrigin(): Promise<string> {
  return resolveAppOrigin(await headers(), allowedOrigins());
}

export async function getRequestURL(path = '/'): Promise<string> {
  return appURL(path, await getRequestOrigin());
}
