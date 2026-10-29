import type { Database } from '@/supacharger/database-types';
import { getEnvVar } from '@/supacharger/utils/helpers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import 'server-only';

let supabaseAdminClientInstance: SupabaseClient<Database> | undefined;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  supabaseAdminClientInstance ??= createClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(secret, 'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  return supabaseAdminClientInstance;
}

export const supabaseAdminClient = new Proxy({} as SupabaseClient<Database>, {
  get(_target, property, receiver) {
    const client = getSupabaseAdminClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
