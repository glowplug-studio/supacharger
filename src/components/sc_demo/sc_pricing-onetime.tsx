'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import { Button } from '@/supacharger/components/ui/button';

export default function SCPricingOneTime() {
  const t = useTranslations('PricingPage.lifetime');
  const features = t.raw('features') as string[];
  return <div className='bg-muted mt-4 grid overflow-hidden rounded-lg lg:grid-cols-[1fr_22rem]'>
    <div className='p-8 sm:p-10'><h3 className='text-3xl font-semibold tracking-tight'>{t('title')}</h3><p className='text-muted-foreground mt-5 leading-7'>{t('description')}</p>
      <h4 className='mt-8 text-sm font-semibold'>{t('included')}</h4><ul className='mt-5 grid gap-3 sm:grid-cols-2'>{features.map((feature) => <li className='flex gap-2 text-sm' key={feature}><Check aria-hidden='true' className='text-primary size-4' />{feature}</li>)}</ul>
    </div>
    <div className='bg-card flex flex-col items-center justify-center p-8 text-center'><p className='font-semibold'>{t('access')}</p><p className='mt-4 text-5xl font-semibold'>{t('price')}</p><Button asChild className='mt-6 w-full rounded-lg'><Link href='/account/create'>{t('getStarted')}</Link></Button></div>
  </div>;
}
