import type { NextResponse } from 'next/server.js';

const SUPABASE_AUTH_RESPONSE_HEADERS = ['cache-control', 'expires', 'pragma'] as const;

export function copySupabaseResponseState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });

  SUPABASE_AUTH_RESPONSE_HEADERS.forEach((name) => {
    const value = source.headers.get(name);
    if (value !== null) target.headers.set(name, value);
  });

  return target;
}
