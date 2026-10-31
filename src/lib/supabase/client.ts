import { imageUploadFetch } from '@/supacharger/media/image-upload-transport';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/supacharger/utils/helpers';
import { createBrowserClient, isBrowser } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    // Client Components also render on the server, where browser cookies and localStorage are unavailable.
    isBrowser() ? { cookies: { encode: 'tokens-only' }, global: { fetch: imageUploadFetch } } : undefined,
  );
}
