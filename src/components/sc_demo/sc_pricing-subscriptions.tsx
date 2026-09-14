'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Plan = { description: string; features: string[]; name: string; price: string };

export default function SCPricingSubscription() {
  const t = useTranslations('PricingPage');
  const plans = t.raw('plans') as Plan[];
  return <div className='grid gap-4 lg:grid-cols-3'>
    {plans.map((plan) => <Card className='rounded-lg shadow-none' key={plan.name}>
      <CardHeader><CardTitle>{plan.name}</CardTitle><p className='text-muted-foreground text-sm'>{plan.description}</p></CardHeader>
      <CardContent><p className='text-3xl font-semibold'>{plan.price}</p><p className='mt-6 text-sm font-medium'>{t('included')}</p>
        <ul className='mt-4 space-y-3'>{plan.features.map((feature) => <li className='text-muted-foreground flex gap-2 text-sm' key={feature}><Check aria-hidden='true' className='text-primary size-4' />{feature}</li>)}</ul>
      </CardContent>
      <CardFooter><Button className='w-full rounded-lg'>{t('getStarted')}</Button></CardFooter>
    </Card>)}
  </div>;
}
