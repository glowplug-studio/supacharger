import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { connection, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

import {
  organisationProfileExtensionSchema,
  updateOrganisationProfileExtension,
} from '@/supacharger.adapters/organisations/profile-extension';
import { organisationActionSchema } from '@/supacharger/organisations/organisation-contract';
import { runOrganisationAction } from '@/supacharger/organisations/organisation-service';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export const instant = false;

export async function POST(request: NextRequest) {
  await connection();
  const t = await getTranslations('Organisations');
  if (!SC_CONFIG.ORGANISATIONS.ENABLED) {
    return NextResponse.json({ ok: false, message: t('errors.disabled') }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: t('errors.invalidRequest') }, { status: 400 });
  }

  const parsed = organisationActionSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string') fieldErrors[field] = t('errors.invalidField');
    }
    return NextResponse.json(
      { ok: false, message: t('errors.checkFields'), fieldErrors },
      { status: 422 },
    );
  }

  if (parsed.data.action === 'update') {
    const extension = organisationProfileExtensionSchema.safeParse(parsed.data.extension);
    if (!extension.success) {
      return NextResponse.json(
        { ok: false, message: t('errors.extension'), fieldErrors: { extension: t('errors.extension') } },
        { status: 422 },
      );
    }
  }

  try {
    const { actorUserId, result } = await runOrganisationAction(parsed.data);
    if (parsed.data.action === 'update') {
      const organisationId = typeof result.id === 'string' ? result.id : parsed.data.organisationId;
      if (!organisationId) throw new Error('Organisation update did not return an identifier.');
      await updateOrganisationProfileExtension({
        actorUserId,
        organisationId,
        values: parsed.data.extension,
      });
      revalidatePath(`/organisation/${parsed.data.handle}/settings`);
    }
    revalidatePath(SC_CONFIG.ORGANISATIONS.CHOOSER_PATH);
    return NextResponse.json({ ok: true, organisation: result });
  } catch (error) {
    console.error('Organisation action failed.', error);
    const rawMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const message = rawMessage.includes('reserved') || rawMessage.includes('duplicate') || rawMessage.includes('unique')
      ? t('errors.handleUnavailable')
      : rawMessage.includes('last owner')
        ? t('errors.lastOwner')
        : rawMessage.includes('invitation')
          ? t('errors.invitationInvalid')
          : rawMessage.includes('access required') || rawMessage.includes('membership')
            ? t('errors.forbidden')
            : t('errors.actionFailed');
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
