'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import FullScreenDialog from '@/supacharger/components/ui/fullscreen-dialog';

export default function SetupStep1() {
const t = useTranslations('AccountPages.setupWizard');
const [open, setOpen] = useState(true);
  return (
    <>
      <div className='space-y-6'>
        <h2 className='text-2xl font-bold tracking-tight'>{t('title')}</h2>

        <FullScreenDialog
      open={open}
      onOpenChange={setOpen}
      dialogTitle={t('sourceTitle')}
      dialogDescription={t('sourceDescription')}
      dialogContent={
        <form className="w-full max-w-md flex flex-col items-center">
          <label className="mb-2 font-semibold" htmlFor="source">
            {t('selectOption')}
          </label>
          <select
            id="source"
            name="source"
            className="mb-4 w-full rounded border px-3 py-2"
          >
            <option value="">{t('pleaseChoose')}</option>
            <option value="friend">{t('friend')}</option>
            <option value="social">{t('social')}</option>
            <option value="search">{t('search')}</option>
            <option value="ad">{t('advertisement')}</option>
            <option value="event">{t('event')}</option>
            <option value="other">{t('other')}</option>
          </select>
          <button
            type="submit"
            className="mt-4 px-6 py-2 rounded bg-primary text-white font-bold"
          >
            {t('submit')}
          </button>

          <Link href="/account/setup/2" className='btn my-6'>{t('continue')}</Link>
        </form>
      }
    />

      </div>
    </>
  );
}
