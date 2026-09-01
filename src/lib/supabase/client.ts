import { getSupabasePublishableKey, getSupabaseUrl } from '@/supacharger/utils/helpers';
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      encode: 'tokens-only',
    },
  });
}
