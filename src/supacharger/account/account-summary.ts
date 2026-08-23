import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { projectProfileIdentity } from '@/supacharger/profile/profile-identity';
import { SC_CONFIG } from '@/supacharger/supacharger-config';
import type { User } from '@supabase/supabase-js';

import { resolveSignedMediaUrls } from '../media/signed-media';

import type { AccountSummary } from './account-summary-contract';

import 'server-only';

const accountSummaryRowSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  username: z.string().nullable(),
  avatar_path: z.string().nullable(),
  active_organisation: z
    .object({
      id: z.string().uuid(),
      handle: z.string(),
      name: z.string(),
      role: z.enum(['owner', 'admin', 'member']),
      avatar_path: z.string().nullable(),
    })
    .nullable(),
  organisation_count: z.number().int().nonnegative(),
});

export async function loadAccountSummary(verifiedUser?: User | null): Promise<AccountSummary | null> {
  const supabase = await createClient();
  const user = verifiedUser ?? (await supabase.auth.getUser()).data.user;
  if (!user || user.is_anonymous) return null;

  const { data, error } = await supabase.schema('api').rpc('get_account_summary_by_current_user');
  if (error) throw error;

  const row = accountSummaryRowSchema.parse(data);
  if (row.user_id !== user.id) throw new Error('Account summary identity did not match the authenticated user.');

  const identity = projectProfileIdentity(row, SC_CONFIG.PROFILE_IDENTITY.USERNAME, { ownerView: true });
  const signedMedia = await resolveSignedMediaUrls(supabase, [
    { key: 'avatar', bucket: 'user-avatars', path: row.avatar_path },
    {
      key: 'activeOrganisationAvatar',
      bucket: 'organisation-avatars',
      path: row.active_organisation?.avatar_path,
    },
  ]);

  return {
    userId: row.user_id,
    email: row.email,
    displayName: identity.displayName,
    initials: identity.initials,
    username: identity.username,
    avatarPath: row.avatar_path,
    avatarUrl: signedMedia.avatar,
    profileHref: identity.username ? `/profile/${encodeURIComponent(identity.username)}` : '/account',
    activeOrganisation: row.active_organisation
      ? {
          id: row.active_organisation.id,
          handle: row.active_organisation.handle,
          name: row.active_organisation.name,
          role: row.active_organisation.role,
          avatarUrl: signedMedia.activeOrganisationAvatar,
        }
      : null,
    organisationCount: row.organisation_count,
  };
}
