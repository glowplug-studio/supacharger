'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import FullScreenDialog from '@/supacharger/components/ui/fullscreen-dialog';

export default function SetupStep2() {
  const t = useTranslations('AccountPages.setupWizard');
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>{t('title')}</h2>
          <FullScreenDialog
            open={open}
            onOpenChange={setOpen}
            dialogTitle={t('completeTitle')}
            dialogDescription={t('completeDescription')}
            dialogContent={
              <form className='flex w-full max-w-md flex-col items-center'>
                <label className='mb-2 font-semibold' htmlFor='fullname'>
                  {t('fullName')}
                </label>
                <input
                  id='fullname'
                  name='fullname'
                  type='text'
                  className='mb-4 w-full rounded border px-3 py-2'
                  placeholder={t('fullNamePlaceholder')}
                />

                <label className='mb-2 font-semibold' htmlFor='email'>
                  {t('email')}
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  className='mb-4 w-full rounded border px-3 py-2'
                  placeholder={t('emailPlaceholder')}
                />

                <label className='mb-2 font-semibold' htmlFor='bio'>
                  {t('bio')}
                </label>
                <textarea
                  id='bio'
                  name='bio'
                  className='mb-4 w-full rounded border px-3 py-2'
                  placeholder={t('bioPlaceholder')}
                  rows={3}
                />

                <button type='submit' className='mt-4 rounded bg-primary px-6 py-2 font-bold text-white'>
                  {t('saveProfile')}
                </button>

                <Link href="/account/setup/1" className='btn my-6 bg-muted'>{t('back')}</Link>

                <Link href="/account" className='btn my-6 bg-primary'>{t('done')}</Link>
              </form>
            }
          />
        </div>
      </div>
    </>
  );
}
