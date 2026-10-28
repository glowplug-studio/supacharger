import { getSupabaseUrl } from '@/supacharger/utils/helpers';

/** Public images recheck Storage access on every request. Private images need caller authentication. */
export function profileMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const url = new URL('/functions/v1/profile-media', getSupabaseUrl());
  url.searchParams.set('path', path);
  return url.toString();
}
