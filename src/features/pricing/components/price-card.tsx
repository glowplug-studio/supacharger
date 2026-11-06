'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Price, ProductWithPrices } from '@/features/pricing/types';

function formatPrice(price: Price) {
  if (price.unit_amount === null || !price.currency) return 'Custom';
  return new Intl.NumberFormat(undefined, {
    currency: price.currency.toUpperCase(),
    style: 'currency',
  }).format(price.unit_amount / 100);
}

function pricePeriod(price: Price, t: ReturnType<typeof useTranslations<'AccountPages.billing'>>) {
  if (price.type === 'one_time') return t('oneTime');
  if (!price.interval) return t('subscriptionPeriod');
  return price.interval_count && price.interval_count > 1
    ? t('everyInterval', { count: price.interval_count, interval: price.interval })
    : t('perInterval', { interval: price.interval });
}

export function PricingCard({
  product,
  price,
  createCheckoutAction,
}: {
  product: ProductWithPrices;
  price?: Price;
  createCheckoutAction?: ({ price }: { price: Price }) => void;
}) {
  const t = useTranslations('AccountPages.billing');
  const initialPrice = price ?? product.prices.find((item) => item.interval === 'month') ?? product.prices[0];
  const [selectedPriceId, setSelectedPriceId] = useState(initialPrice?.id ?? '');
  const currentPrice = price ?? product.prices.find((item) => item.id === selectedPriceId) ?? initialPrice;

  return (
    <div className='w-full flex-1'>
      <div className='flex w-full flex-col rounded-md border border-zinc-800 bg-black p-4 lg:p-8'>
        <div className='p-4'>
          <div className='mb-1 text-center text-xl font-bold'>{product.name}</div>
          <div className='flex justify-center gap-1 text-zinc-400'>
            <span className='font-semibold'>{currentPrice ? formatPrice(currentPrice) : t('unavailable')}</span>
            {currentPrice ? <span>{pricePeriod(currentPrice, t)}</span> : null}
          </div>
        </div>

        {!price && product.prices.length > 1 ? (
          <PricingSwitch prices={product.prices} value={currentPrice?.id ?? ''} onChange={setSelectedPriceId} />
        ) : null}

        <div className='m-auto flex w-fit flex-1 flex-col gap-2 px-8 py-4'>
          <p className='text-sm text-zinc-400'>{product.description}</p>
        </div>

        {createCheckoutAction && (
          <div className='py-4'>
            {currentPrice && (
              <Button
                variant='secondary'
                className='w-full'
                onClick={() => {
                  createCheckoutAction({ price: currentPrice });
                }}
              >
                {currentPrice.type === 'one_time' ? t('buyNow') : t('subscribe')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PricingSwitch({ prices, value, onChange }: { prices: Price[]; value: string; onChange: (value: string) => void }) {
  const t = useTranslations('AccountPages.billing');
  return (
    <Tabs
      value={value}
      className='flex items-center'
      onValueChange={onChange}
    >
      <TabsList className='m-auto'>
        {prices.map((item) => (
          <TabsTrigger key={item.id} value={item.id}>
            {item.type === 'one_time' ? t('oneTime') : item.interval === 'year' ? t('yearly') : t('monthly')}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
