import { getTranslations } from 'next-intl/server';

import SCFooter from '@/components/sc_demo/sc_footer';
import { createMarketingPageMetadata } from '@/components/sc_demo/sc_marketing_metadata';
import SCPricingOneTime from '@/components/sc_demo/sc_pricing-onetime';
import SCPricingSubscription from '@/components/sc_demo/sc_pricing-subscriptions';

export async function generateMetadata() { return createMarketingPageMetadata('pricing'); }

export default async function Pricing() {
  const t = await getTranslations('PricingPage');
  return (
    <>
      <section>
        <div className='relative isolate pt-24'>
          <div className='mx-auto mt-8 max-w-4xl sm:text-center'>
            <h2 className='text-primary mt-10 text-5xl font-semibold tracking-tight sm:text-7xl'>{t('title')}</h2>
            <p className='font-mediu mt-8 text-pretty sm:text-xl/8'>
              {t('description')}
            </p>
          </div>
          <div className='mx-auto max-w-7xl px-6 py-12 sm:py-5 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-16'>
            <div className='flex flex-col gap-4'>
              <div>
                <SCPricingSubscription />
              </div>
              <div>
                <SCPricingOneTime />
              </div>
            </div>
          </div>
        </div>
      </section>
      <SCFooter></SCFooter>
    </>
  );
}
