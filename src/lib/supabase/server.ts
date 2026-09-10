import { cache } from 'react';
import { cookies } from 'next/headers';

import { createAuthTransport } from '@/lib/supabase/supacharger/refresh-transport';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/supacharger/utils/helpers';
import { createServerClient } from '@supabase/ssr';

export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  const transport = createAuthTransport(getSupabaseUrl());

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    global: { fetch: transport.fetch },
    cookies: {
      encode: 'tokens-only',
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Contention/outages are not logout. Never clear the browser's session for them.
        if (transport.isTemporarilyUnavailable()) return;
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
