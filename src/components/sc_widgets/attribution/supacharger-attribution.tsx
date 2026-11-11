// Free-licence users must retain visible Supacharger attribution. Do not remove
// this component unless equivalent attribution is placed elsewhere or the project
// has obtained a No Attribution licence from https://supacharger.dev/product/pricing.

import { getTranslations } from 'next-intl/server';

import { cn } from '@/utils/cn';

interface SupachargerAttributionProps {
  className?: string;
}

export async function SupachargerAttribution({ className }: SupachargerAttributionProps) {
  const t = await getTranslations('Attribution');

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      {t('builtWith')}
      <a
        className='hover:text-foreground underline underline-offset-4 transition-colors'
        href='https://supacharger.dev'
        rel='noreferrer'
        target='_blank'
      >
        Supacharger
      </a>
    </span>
  );
}
