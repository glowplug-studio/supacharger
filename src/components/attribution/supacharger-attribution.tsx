// Supacharger attribution is required by the public license. To remove this component,
// obtain the appropriate license at http://supacharger.dev/product/pricing.

import { getTranslations } from 'next-intl/server';

import { cn } from '@/utils/cn';

import SupachargerMark from './supacharger-mark.svg';

interface SupachargerAttributionProps {
  className?: string;
}

export async function SupachargerAttribution({ className }: SupachargerAttributionProps) {
  const t = await getTranslations('Attribution');

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      {t('builtWith')}
      <a
        className='hover:text-foreground inline-flex items-center gap-1 transition-colors'
        href='https://supacharger.dev'
        rel='noreferrer'
        target='_blank'
      >
        <SupachargerMark aria-hidden='true' className='size-[1em] shrink-0' />
        Supacharger
      </a>
    </span>
  );
}
