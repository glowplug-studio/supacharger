import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { createClient } from '@/lib/supabase/server';
import { ProfileOnboardingForm } from '@/supacharger/profile/profile-onboarding-form';

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

  const { data: profiles } = await supabase.schema('api').rpc('get_account_profile_by_current_user');

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-12'>
      <section className='w-full space-y-6 rounded-xl border bg-background p-6 shadow-sm sm:p-8'>
        <div className='space-y-2'>
          <h1 className='text-2xl font-semibold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground'>{t('description')}</p>
        </div>
        <ProfileOnboardingForm initialProfile={profiles?.[0]} />
      </section>
    </main>
  );
}
