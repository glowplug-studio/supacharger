import { connection, NextResponse } from 'next/server';

import { loadAccountSummary } from '@/supacharger/account/account-summary';

export const instant = false;

export async function GET() {
  await connection();
  try {
    const summary = await loadAccountSummary();
    if (!summary) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    return NextResponse.json(
      { summary },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
    );
  } catch (error) {
    console.error('Failed to load the account summary.', error);
    return NextResponse.json({ error: 'Unable to load the account summary.' }, { status: 500 });
  }
}
