import { type NextRequest, NextResponse } from 'next/server';

import { createAuthUnavailableResponse } from '@/supacharger/auth/unavailable-response';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

/** The demo shares the production renderer but disables automatic recovery. */
export function GET(request: NextRequest) {
  return createAuthUnavailableResponse(request, NextResponse.next(), SC_CONFIG.SITE_TITLE, {}, {
    next: request.nextUrl.searchParams.get('next') ?? '/',
    demo: request.nextUrl.searchParams.get('demo') === '1',
    forcePage: true,
  });
}
