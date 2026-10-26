import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { createClient } from '@/lib/supabase/server';
import { AccountProfileMedia } from '@/supacharger.adapters/account/profile-media';
import { resolveSignedMediaUrls } from '@/supacharger/media/signed-media';
import { initialiseAccountUsername } from '@/supacharger/profile/initialise-account-username';
import { ProfileOnboardingForm } from '@/supacharger/profile/profile-onboarding-form';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AccountPages.setupProfile');
  return { title: t('metadataTitle') };
}

export const instant = false;

export default async function SetupProfilePage() {
  const t = await getTranslations('AccountPages.setupProfile');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/account/login');

  await initialiseAccountUsername(supabase);

  const { data: profiles } = await supabase.schema('api').rpc('get_account_profile_by_current_user');

  const profile = profiles?.[0];
  const media = await resolveSignedMediaUrls(supabase, [
    { key: 'avatar', bucket: 'user-avatars', path: profile?.avatar_path },
  ]);

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-12'>
      <section className='w-full space-y-6 rounded-xl border bg-background p-6 shadow-sm sm:p-8'>
        <div className='space-y-2'>
          <h1 className='text-2xl font-semibold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground'>{t('description')}</p>
        </div>
        {SC_CONFIG.PROFILE_IDENTITY.AVATAR !== 'disabled' ? (
          <AccountProfileMedia
            avatarEnabled
            headerEnabled={false}
            firstName={profile?.first_name ?? ''}
            lastName={profile?.last_name ?? ''}
            username={profile?.username ?? ''}
            initialAvatarPath={profile?.avatar_path ?? null}
            initialAvatarUrl={media.avatar}
            initialHeaderPath={null}
            initialHeaderUrl={null}
          />
        ) : null}
        <ProfileOnboardingForm initialProfile={profiles?.[0]} />
      </section>
    </main>
  );
}
