import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { isTransientServiceError } from '@/supacharger/auth/transient-error';
import { schemaName } from '@/supacharger/namespace';

/** Read-only identity probe: never replay the request that encountered the outage. */
export async function GET() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.getClaims();
    const database = !error && data?.claims?.sub
      ? await supabase.schema(schemaName('api')).rpc('is_profile_complete_by_current_user', { input_username_required: false }).abortSignal(AbortSignal.timeout(10000))
      : null;
    const status = isTransientServiceError(error) || isTransientServiceError(database?.error) ? 503 : error || !data?.claims?.sub ? 401 : 200;
    return NextResponse.json({ available: status !== 503 }, {
      status,
      headers: { 'Cache-Control': 'private, no-store', ...(status === 503 ? { 'Retry-After': '30' } : {}) },
    });
  } catch {
    return NextResponse.json({ available: false }, { status: 503, headers: { 'Cache-Control': 'private, no-store', 'Retry-After': '30' } });
  }
}
