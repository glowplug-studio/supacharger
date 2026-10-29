'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function SCFooterSession() {
  const global = useTranslations('Global');
  const t = useTranslations('SessionFooter');
  return (
    <footer className='py-6'>
      <div className='mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='border-border flex flex-col items-center justify-between gap-6 border-b pb-4 text-sm font-normal min-[830px]:flex-row'>
          <Link href='/legal' className='color: font-medium text-gray-400'>
            {t('terms')}
          </Link>
          <Link href='/legal' className='color: font-medium text-gray-400'>
            {t('fairUse')}
          </Link>
        </div>
        <div className='flex flex-col items-center justify-between gap-6 pt-7 text-gray-400 min-[520px]:flex-row dark:text-gray-600'>
          <span className='text-sm font-medium'>
            &copy;{' '}
            <Link href='/' className='color: font-medium text-gray-500'>
              {global('siteTitle')}
            </Link>{' '}
            {new Date().getFullYear()}, {t('allRightsReserved')}
          </span>
          {/* Social Section Removed */}
        </div>
      </div>
    </footer>
  );
}
