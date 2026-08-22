import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/supacharger/supabase-admin';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export async function POST(request: NextRequest) {
  if (!SC_CONFIG.ORGANISATIONS.ENABLED) {
    return NextResponse.json({ error: 'Organisations are disabled' }, { status: 404 });
  }

  const supabase = await createClient();
  const [{ data: userData }, { data: claimsData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
  ]);
  const userId = userData.user?.id;
  const sessionId = claimsData?.claims?.session_id;

  if (!userId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== 'create' && action !== 'select') {
    return NextResponse.json({ error: 'Action must be create or select' }, { status: 400 });
  }
  const admin = getSupabaseAdminClient();
  const result = action === 'create'
    ? await admin.schema('api_edge').rpc('create_organisation_context', {
        input_user_id: userId,
        input_session_id: sessionId,
        input_name: body?.name,
        input_handle: body?.handle,
      })
    : await admin.schema('api_edge').rpc('select_organisation_context', {
        input_user_id: userId,
        input_session_id: sessionId,
        input_handle: body?.handle,
      });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    return NextResponse.json({ error: refreshError.message }, { status: 400 });
  }

  return NextResponse.json({ organisation: result.data });
}
