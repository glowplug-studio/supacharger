import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { isTransientServiceError } from '@/supacharger/auth/transient-error';
import { schemaName } from '@/supacharger/namespace';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

const organisationContextSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), title: z.string().trim().min(1).max(100), handle: z.string().trim() }).strict(),
  z.object({ action: z.literal('switch'), handle: z.string().trim() }).strict(),
]);

export async function POST(request: NextRequest) {
  if (!SC_CONFIG.ORGANISATIONS.ENABLED) {
    return NextResponse.json({ error: 'Organisations are disabled' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = organisationContextSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid organisation context request' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (isTransientServiceError(userError)) return unavailable();
  if (userError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data, error } = await supabase.schema(schemaName('api')).rpc('organisations', {
    input_payload: parsed.data,
  });
  if (isTransientServiceError(error)) return unavailable();
  if (error) {
    return NextResponse.json({ error: 'Unable to update organisation context' }, { status: 400 });
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (isTransientServiceError(refreshError)) return unavailable();
  if (refreshError) {
    return NextResponse.json({ error: 'Unable to refresh organisation context' }, { status: 500 });
  }

  return NextResponse.json({ organisation: data });
}

function unavailable() {
  return NextResponse.json({ error: 'service_temporarily_unavailable' }, { status: 503, headers: { 'Retry-After': '30', 'Cache-Control': 'private, no-store' } });
}
