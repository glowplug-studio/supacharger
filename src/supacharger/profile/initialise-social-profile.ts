import { z } from 'zod';

import type { AuthCallbackContext } from '@/supacharger/auth/callback-adapter-contract';
import { authoriseImageUpload } from '@/supacharger/media/authorise-image-upload';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

import { imageSha256 } from '../../../supabase/functions/process_image_upload/permit-crypto';

import { downloadSocialAvatar, socialAvatarSourceSchema } from './social-avatar-source';

import 'server-only';

const uploadedAvatarSchema = z.object({
  bucket: z.literal('user-avatars'),
  path: z.string().min(1).max(512),
});

/** Defaults only: onboarding, billing and MFA remain owned by their existing guards. */
export async function initialiseSocialProfile(supabase: AuthCallbackContext['supabase'], userId: string) {
  let uploadedPath: string | null = null;
  let completionAttempted = false;
  try {
    const { data, error } = await supabase.schema('api').rpc('initialise_social_profile_by_current_user');
    if (error) throw error;
    if (!data) return;
    const source = socialAvatarSourceSchema.safeParse(data);
    if (!source.success || SC_CONFIG.PROFILE_IDENTITY.AVATAR === 'disabled') {
      await supabase.schema('api').rpc('complete_social_avatar_by_current_user', {});
      return;
    }
    const file = await downloadSocialAvatar(source.data.provider, source.data.avatar_url);
    const body = new FormData();
    body.set('file', file);
    const { permit, signature } = await authoriseImageUpload({ target: 'profile_avatar', bytes: file.size, mimeType: file.type, sha256: await imageSha256(await file.arrayBuffer()) }, userId);
    body.set('permit', permit);
    body.set('signature', signature);
    const result = await supabase.functions.invoke('process_image_upload', { body, timeout: 15000 });
    if (result.error) throw result.error;
    const uploaded = uploadedAvatarSchema.parse(result.data);
    if (!uploaded.path.startsWith(`${userId}/avatar-`) || uploaded.path.includes('..')) {
      throw new Error('Invalid imported avatar path');
    }
    uploadedPath = uploaded.path;
    completionAttempted = true;
    const completed = await supabase.schema('api').rpc('complete_social_avatar_by_current_user', {
      input_avatar_path: uploadedPath,
    });
    if (completed.error) throw completed.error;
    if (completed.data !== true) await supabase.storage.from('user-avatars').remove([uploadedPath]);
  } catch {
    // No identity metadata, URLs, tokens or provider responses in logs.
    console.warn('Social profile import did not complete; sign-in will continue.');
    try {
      // A lost RPC response may follow a committed attachment; do not delete it.
      if (uploadedPath && !completionAttempted) await supabase.storage.from('user-avatars').remove([uploadedPath]);
      await supabase.schema('api').rpc('complete_social_avatar_by_current_user', {});
    } catch {
      // Import bookkeeping must not turn an optional image into a sign-in failure.
    }
  }
}
