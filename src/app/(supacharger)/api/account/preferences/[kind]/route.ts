import { connection, type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  loadNotificationPreferences,
  updateNotificationPreferences,
} from '@/supacharger.adapters/account/notifications';
import { loadPrivacyPreferences, updatePrivacyPreferences } from '@/supacharger.adapters/account/privacy';
import {
  type PreferenceKind,
  preferenceMutationSchema,
  preferenceSurfaceSchema,
} from '@/supacharger/account/preferences/preference-contract';

function preferenceAdapter(kind: PreferenceKind) {
  return kind === 'privacy'
    ? { load: loadPrivacyPreferences, update: updatePrivacyPreferences }
    : { load: loadNotificationPreferences, update: updateNotificationPreferences };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  await connection();
  const { kind } = await params;
  if (kind !== 'privacy' && kind !== 'notifications') {
    return NextResponse.json({ ok: false, error: 'notFound' }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalidRequest' }, { status: 400 });
  }
  const parsedBody = preferenceMutationSchema.safeParse(body);
  if (!parsedBody.success) return NextResponse.json({ ok: false, error: 'invalidRequest' }, { status: 422 });

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const adapter = preferenceAdapter(kind);
  const parsedSurface = preferenceSurfaceSchema.safeParse(await adapter.load(user.id));
  if (!parsedSurface.success) return NextResponse.json({ ok: false, error: 'adapterInvalid' }, { status: 500 });
  if (parsedSurface.data.availability !== 'enabled') return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 403 });
  const allowedOptions = new Map(parsedSurface.data.options.map((option) => [option.id, option]));
  const submittedIds = Object.keys(parsedBody.data.values);
  const changesDisabledOption = submittedIds.some((id) => {
    const option = allowedOptions.get(id);
    return option?.disabled && parsedBody.data.values[id] !== option.value;
  });
  if (submittedIds.length !== allowedOptions.size || submittedIds.some((id) => !allowedOptions.has(id)) || changesDisabledOption) {
    return NextResponse.json({ ok: false, error: 'invalidOptions' }, { status: 422 });
  }

  try {
    await adapter.update(user.id, parsedBody.data.values);
  } catch (mutationError) {
    console.error(`Failed to update ${kind} preferences.`, mutationError);
    return NextResponse.json({ ok: false, error: 'saveFailed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
