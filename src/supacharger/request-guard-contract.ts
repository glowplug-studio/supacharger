import type { NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Runs after authentication routing. Database authorisation remains authoritative. */
export type ProjectRequestContext = {
  request: NextRequest;
  isAuthenticated: boolean;
  supabase: SupabaseClient<Database>;
};

export type ProjectRequestGuard = (context: ProjectRequestContext) => Promise<NextResponse | null>;
