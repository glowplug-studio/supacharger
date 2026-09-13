import { cache } from 'react';
import { cookies } from 'next/headers';

import { getSupabasePublishableKey, getSupabaseUrl } from '@/supacharger/utils/helpers';
import { createServerClient } from '@supabase/ssr';

export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      encode: 'tokens-only',
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if Proxy is refreshing
          // user sessions.
        }
      },
    },
  });
});
