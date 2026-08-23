import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { AccountDetailsPageOverride } from '@/supacharger.adapters/account/details-page';
import { loadAccountProfileExtension } from '@/supacharger.adapters/account/profile-extension';
import { resolveSignedMediaUrls } from '@/supacharger/media/signed-media';

import { AccountDetailsForm } from './account-details-form';

import 'server-only';

type ProfileRow = {
  avatar_path: string | null;
  email: string | null;
  first_name: string | null;
  header_image_path: string | null;
  language_code: string | null;
  last_name: string | null;
  username: string | null;
};

export async function AccountDetailsPage() {
  if (AccountDetailsPageOverride) return <AccountDetailsPageOverride />;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || user.is_anonymous) redirect('/account/login');

  const { data, error } = await supabase.schema('api').rpc('get_account_profile_by_current_user');
  if (error) throw error;
  const profile = (data?.[0] ?? {}) as ProfileRow;
  const [extension, media] = await Promise.all([
    loadAccountProfileExtension(user.id),
    resolveSignedMediaUrls(supabase, [
      { key: 'avatar', bucket: 'user-avatars', path: profile.avatar_path },
      { key: 'header', bucket: 'user-avatars', path: profile.header_image_path },
    ]),
  ]);

  return (
    <AccountDetailsForm
      avatarPath={profile.avatar_path ?? null}
      avatarUrl={media.avatar}
      email={profile.email ?? user.email}
      extension={extension}
      firstName={profile.first_name ?? ''}
      headerImagePath={profile.header_image_path ?? null}
      headerImageUrl={media.header}
      language={profile.language_code ?? 'en'}
      lastName={profile.last_name ?? ''}
      username={profile.username ?? ''}
    />
  );
}
